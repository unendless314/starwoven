# AGENTS.md — 星靈織語 Starwoven

## Repo state

This repo contains the **fully built Astro static site** (initial commit `000b083`),
iterated through **DEC-001 ~ DEC-054** in `decisions.md`. The original Demo deadline
(2026-09-23) has passed; the site is feature-complete and under continuous content/UI
iteration. This file was rewritten on 2026-10-06 — the previous version described a
pre-build planning repo and is obsolete.

- Stack: **Astro ^5.18.2** (`output: 'static'`) + **Tailwind CSS v4** via
  `@tailwindcss/vite` (CSS-first config in `src/styles/global.css`; no
  `tailwind.config.*`). No JS framework, no CMS.
- **`@astrojs/node` (standalone) adapter** since DEC-073: every page is still
  prerendered; the only on-demand route is `POST /api/tarot/reading`
  (`prerender = false`). Build output is `dist/client/`（static）＋`dist/server/`（Node）.
- Commands: `npm run dev`（前後端一起，API 讀 `.env` 的 `AI_*`／`TAROT_*`）· `npm run build`
  (→ `dist/client/` + `dist/server/`) · `npm run preview`

## Canonical sources of truth (read these first, in order)

1. `decisions.md` — the authoritative change log (DEC-001 起). If any other doc
   conflicts with reality or with each other, **this file wins**.
2. `demo_docs/content_inventory.md` — copy/content SSOT for every page (fully
   populated since DEC-001; never invent copy, names, or prices).
3. `demo_docs/phase0_answers.md` — Phase-0 confirmations（較新的確認優先於 spec）。
4. `demo_docs/spec.md` — original Demo spec; baseline only, several sections
   superseded by decisions.
5. `demo_docs/development_roadmap.md` — phase plan (Phase 0–4 complete; kept for
   reference).
6. `demo_docs/image_prompts.md` — asset registry（命名代碼）+ generation log.

衝突判定順序：`decisions.md` ＞ `content_inventory.md`（文案）＞
`phase0_answers.md` ＞ `spec.md`。

## Current site IA (actual routes)

```
/             index.astro            Hero / 四大核心服務×4 / 固定循環課程×6 / 許願池入口連結 / 學員評價輪播
/wishlist     wishlist.astro         課程許願池（敲碗開課投票，試算表 SSOT；DEC-049 自首頁獨立為分頁）
/about        about.astro            品牌故事 + 創辦人×2 + 星靈夥伴×9（真人頭像已上架）
/services     services.astro         7 大服務雙欄大卡片（塔羅/星盤/靈數/八字/靈氣與光/阿卡西/毛孩溝通）
/courses      courses.astro          固定課程（圖片常態外顯+手風琴詳情）/ 交流會 / 主題體驗工作坊
/blog         blog/index.astro       星靈專欄列表（分類過濾 + 精選置頂）
/blog/[slug]  blog/[...slug].astro   文章內頁（Content Collections，src/content/blog/ 共 5 篇）
/tarot        tarot.astro            線上塔羅抽卡（AI 解讀）MVP Demo——noindex、不在導覽列（DEC-073）
POST /api/tarot/reading  api/tarot/reading.ts  全站唯一 on-demand 路由（Node 服務）
```

- AI 互動功能共用核心（DEC-079，規格書 `demo_docs/ai_platform_plan.md`）：
  `src/lib/ai/server/`（伺服器專用：`AI_*` 設定、供應商轉接器、`generateText`、標記擷取、
  額度工廠 `createDailyQuota`、輸入守門、端點 HTTP 工具，**不得被前端 import**）＋
  `src/lib/ai/shared/`（前後端共用：共用常數、錯誤碼、安全關懷文案、`postReading`／`trackEvent`）。
  只共用逐行相同之伺服器機制；各功能頁面、狀態機、提示詞與內容資料各自獨立。
- 抽卡程式集中於 `src/lib/tarot/`（`config.ts` 功能常數檔、`copy.ts` 前端文案、
  `cards.ts`／`spreads.ts` 共用資料；`server-config.ts`／`ai.ts`／`prompt.ts` 為伺服器專用，
  **不得被前端 import**）＋`src/scripts/tarot.ts`。
  規格書：`demo_docs/tarot_plan.md`。牌義與提示詞為佔位內容，待占卜師審定。
  新增 AI 功能依 `ai_platform_plan.md` 第十節檢查清單（第二階段占星抽卡另立 DEC-080）。

- Nav (Navbar.astro): 關於我們 / 命理服務 / 活動與課程 / 課程許願池 / 星靈專欄 + 「預約諮詢」CTA
- **Removed routes — do not recreate without a DEC entry**:
  - `/reiki`, `/akashic` — pages deleted (DEC-020/023); content lives on as blog
    long-form posts; server-level 301s live in `nginx/starwoven.conf`.
  - `/shop` — removed (DEC-004); shopping routes to the footer iOpen Mall link.

## Layout & shared components (src/layouts/, src/components/)

- `src/layouts/Layout.astro` — head/meta/OG/canonical, theme-init inline script
  (zero-FOUC), GA component, global footer（聯絡我們 / 地址→Google Maps /
  6 個社群圖示）, bottom-right floating LINE button.
- `Navbar.astro` — sticky + backdrop-blur, desktop nav + mobile hamburger,
  dark/light toggle (persisted to `localStorage["starwoven_theme"]`).
- `CTAButton.astro` — variants `nav` / `hero` / `primary`; the LINE URL is fixed
  (see below).
- `CourseWishlistCard.astro` — 許願池卡片版型與樣式（互動邏輯在
  `src/scripts/wishlist.ts`，由頁面層級 script 引入）；demo/live 雙模式，live mode 由
  `PUBLIC_WISHLIST_API_URL` 驅動（Google Apps Script → 試算表 SSOT，DEC-038）。
- `CategoryIcon.astro`、`GoogleAnalytics.astro`（GA4 `G-27D79HXXF5`，可用
  `PUBLIC_GA_ID` 覆寫；內建 LINE／地圖／iOpen Mall 轉換事件監聽）。

## "預約諮詢" CTA — fixed value

- URL: `https://line.me/R/ti/p/@347fucvj?ts=07031038&oat_content=url`
- Always `target="_blank"` with `rel="noopener"`.

## Styling conventions (read before any UI work)

- **Dual theme everywhere**: `@custom-variant dark` on `.dark`; homepage defaults
  dark (starry night), inner pages default light (watercolor); user toggle
  overrides via localStorage. Every style change must cover both modes.
- Colors are mostly **hardcoded hex + `dark:` variants**, not theme tokens:
  `#2E2A4F`（深夜空）、`#8FB8E8`（月光藍）、`#80A9D4`（accent）、
  `#EAF3F8`（內頁底）、`#FCE794`（星金）。Changing a color = global search.
- `font-huninn`（粉圓體）for headings/brand; Latin: Quicksand/Nunito;
  `<html lang="zh-Hant">`; full-width punctuation in copy.
- Page content lives in **frontmatter data arrays** (courses, reviews, wishlist,
  team) — edit data, not markup.
- Every page sets its own `<title>` and meta description. ⚠️ OG image：各頁目前
  未個別傳入 `ogImage`，共用 Layout 預設值 `/assets/og-image.jpg`——**該檔案
  尚未存在**，社群分享縮圖會 404，見 `known_issues/README.md` 第 4 項。

## Asset management (human-led, WebP mandatory)

- Naming: `[分頁代碼]_[圖片代碼]_[素材名稱]_v[版本號].webp`
  (e.g. `home_a_tarot_world_v3.webp`)；代號登錄於 `image_prompts.md`。
- Adopted assets → archive copy in `demo_docs/sd-assets/` + production copy in
  `public/assets/`；rejected → `demo_docs/sd-assets/rejected/`（never delete）。
- **Never commit raw PNGs** — convert to WebP (Q85, `method=6`) before commit.
- Scripts: `scripts/process_asset.py`（AI 生成圖，rembg 去背）與
  `scripts/process_photo.py`（實拍照，ROI 裁切，`--batch-team` / `--batch-courses`）。
  Both print a ready-made markdown row for the 生成紀錄 table.
- Log every adopted/rejected image in `image_prompts.md`「六、生成紀錄」。
- 業主實拍原圖放 `demo_docs/raw-photos/{team,courses,workshops,events}/`
  （git-ignored except `.gitkeep`）。
- No image ships without a human having eyeballed it.

## Execution rules

- **No fabrication.** Copy/names/prices come from `content_inventory.md` or the
  owner. Missing content → placeholders, keep moving.
- **Off-spec decisions → append to `decisions.md`** (next number: DEC-081).
  Never silently change scope, IA, pricing, or people.
- **Multi-agent workflow**: when you change shared surfaces (Layout, Navbar,
  footer, `global.css`, `public/assets/`, content schema), say so explicitly in
  your final reply.
- Open content/config issues live in `known_issues/README.md`.

## Deployment (Hetzner NBG1, Ubuntu arm64, nginx)

- Server IP: `<YOUR_VPS_IP>` · domain `starwoven.xyz`（A records for `@`/`www`）。
- Deploy root `/var/www/starwoven`（內容為 `dist/client/`，nginx 直接提供）；
  `/api/` 由 nginx 反向代理至 `127.0.0.1:4321` 的 systemd 服務 `starwoven-app`
  （程式於 `/opt/starwoven-app`，unit 正本 `systemd/starwoven-app.service`，
  執行期變數 `/etc/starwoven/app.env`）。
- **`nginx/starwoven.conf` in this repo is the canonical vhost** — includes the
  `/reiki` / `/akashic` 301s, static caching, gzip, security headers。Add as a
  new vhost only; never edit existing server blocks。
- HTTPS via `certbot --nginx` with auto-renew。
- 部署現況（2026-10-20 確認）：網站已上線（HTTPS、直連未經 CDN）；VPS 即建置機，
  repo 位於 `/root/.openclaw/workspace/starwoven/`，於該處 build 後 rsync 至
  `/var/www/starwoven`。線上 vhost 目前與 repo 版分叉，DEC-073 實作時整併。
- ⚠️ 線上抽卡功能（DEC-073）合併後，`dist/` 改為 `client/`＋`server/` 結構，
  **舊指令 `rsync -a --delete dist/ /var/www/starwoven/` 不得再使用**，一律改用
  `scripts/deploy.sh`（規格見 `demo_docs/tarot_plan.md` 第八節）。

## Environment variables (see `.env.example`)

- `PUBLIC_GA_ID` — GA4 measurement id（未設定時 fallback 為 `G-27D79HXXF5`）。
- `PUBLIC_WISHLIST_API_URL` — Apps Script web app URL；unset → 許願池以本機
  demo 模式運行（不發網路請求，票數存 localStorage）。
- `AI_*` — AI 功能共用之供應商變數（DEC-079；原 `TAROT_AI_*`）、`TAROT_*` — 抽卡功能開關與
  每日上限（DEC-073）。**唯一清單為 `astro.config.mjs` 的 `env.schema`**，一律 server secret
  （執行期讀取、不進 bundle；VPS 改 `app.env` 重啟即生效）。`AI_API_KEY` 選填，缺少時全部 AI
  功能停用、其餘頁面與 build 不受影響。功能前綴不得用 `PUBLIC_`／`AI_`／`ASTRO_`／`NODE_`。
