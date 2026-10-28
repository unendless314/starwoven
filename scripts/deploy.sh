#!/usr/bin/env bash
# ==========================================
# 星靈織語 Starwoven — VPS 部署腳本（DEC-073、DEC-079，規格 demo_docs/ai_platform_plan.md 第八節第 3 小節）
# 於 VPS repo 目錄以 root 執行：先手動 `git pull`，再 `bash scripts/deploy.sh`
# （腳本本身不拉取，避免執行中途腳本被更新）
#
# 🔴 舊指令 `rsync -a --delete dist/ /var/www/starwoven/` 不得再使用：
#    dist/ 已改為 client/＋server/，沿用舊指令會使全站失效並公開後端程式碼。
#
# nginx 設定有變時另行手動處理：
#   cp nginx/starwoven.conf /etc/nginx/sites-available/starwoven && nginx -t && systemctl reload nginx
# ==========================================
set -euo pipefail

WEB_ROOT=/var/www/starwoven
APP_DIR=/opt/starwoven-app
SERVICE=starwoven-app
SMOKE_BASE=http://127.0.0.1:4321
# 全部 AI 端點：須與 nginx/starwoven.conf 之 AI location 清單一致（新增功能時加入）
SMOKE_PATHS=(/api/tarot/reading /api/astro-cards/reading)
SMOKE_ORIGIN=https://starwoven.xyz

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

step() { printf '\n==> %s\n' "$*"; }
die() { printf '\n❌ %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "請以 root 執行"
[ -d "$WEB_ROOT" ] || die "$WEB_ROOT 不存在"
id starwoven >/dev/null 2>&1 || die "服務帳號 starwoven 不存在（見一次性設定）"
[ -f /etc/starwoven/app.env ] || die "/etc/starwoven/app.env 不存在（見一次性設定）"

# 1. 安裝依賴並建置
step "npm ci && npm run build"
npm ci
npm run build

# 2. 結構檢查：防止將錯誤結構同步至網站根目錄
step "檢查建置產物結構"
[ -f dist/client/index.html ] || die "dist/client/index.html 不存在，中止部署"
[ -f dist/server/entry.mjs ] || die "dist/server/entry.mjs 不存在，中止部署"

# 3. 靜態站（保留 certbot webroot 驗證目錄 .well-known/）
step "同步靜態站 → $WEB_ROOT"
rsync -a --delete --delete-after --delay-updates --exclude=.well-known dist/client/ "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

# 4. 應用程式：dist/＋package*.json → /opt，安裝執行期依賴（擁有者 root，服務帳號唯讀）
step "同步應用程式 → $APP_DIR"
mkdir -p "$APP_DIR"
rsync -a --delete dist/ "$APP_DIR/dist/"
install -m 644 package.json package-lock.json "$APP_DIR/"
(cd "$APP_DIR" && npm ci --omit=dev)
chown -R root:root "$APP_DIR"
chmod -R u=rwX,go=rX "$APP_DIR"

# 5. 重啟服務
step "重啟 $SERVICE"
SINCE="$(date '+%Y-%m-%d %H:%M:%S')"
systemctl restart "$SERVICE"

# 6. 冒煙請求（逐一端點）：格式錯誤之 POST（不呼叫 AI、不消耗額度），
#    強制載入共用與各功能設定以觸發執行期 secret 驗證
for path in "${SMOKE_PATHS[@]}"; do
  step "冒煙請求 $path"
  status=""
  for _ in $(seq 1 20); do
    status="$(curl -s -o /tmp/starwoven-smoke.json -w '%{http_code}' -X POST "$SMOKE_BASE$path" \
      -H "Origin: $SMOKE_ORIGIN" -H 'Content-Type: application/json' -d '{}' || true)"
    [ "$status" != "000" ] && break
    sleep 0.5
  done
  body="$(cat /tmp/starwoven-smoke.json 2>/dev/null || true)"
  rm -f /tmp/starwoven-smoke.json
  [ "$status" = "400" ] && [[ "$body" == *'"INVALID_REQUEST"'* ]] \
    || die "冒煙請求失敗（$path，HTTP $status）：$body —— 請檢查 journalctl -u $SERVICE"
done

logs="$(journalctl -u "$SERVICE" --since "$SINCE" --no-pager)"
if grep -q 'AI_API_KEY missing' <<<"$logs"; then
  die "AI_API_KEY 未設定，全部 AI 功能停用中（/etc/starwoven/app.env）"
fi
if grep -qE '\[ERROR\]|EnvInvalidVariables' <<<"$logs"; then
  printf '%s\n' "$logs" | tail -20
  die "服務 log 出現錯誤"
fi

step "✅ 部署完成（${#SMOKE_PATHS[@]} 個端點冒煙請求皆 HTTP 400 INVALID_REQUEST，log 無錯誤）"
