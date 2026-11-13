# AGENTS.md — 星靈織語 Starwoven

## Repo state

This repo contains the **fully built Astro static site** (initial commit `000b083`),
with key decisions recorded in `decisions.md`. The original Demo deadline
(2026-09-23) has passed; the site is feature-complete and under continuous content/UI
iteration. This file was rewritten on 2026-10-06 — the previous version described a
pre-build planning repo and is obsolete.

- Stack: **Astro ^7.4.5**（Node ≥ 22.23.4；DEC-081） (`output: 'static'`) + **Tailwind CSS v4** via
  `@tailwindcss/vite` (CSS-first config in `src/styles/global.css`; no
  `tailwind.config.*`). No JS framework, no CMS.
- **`@astrojs/node` (standalone) adapter** since DEC-073: every page is still
  prerendered; the only on-demand routes are `POST /api/tarot/reading` and
  `POST /api/astro-cards/reading` (`prerender = false`). Build output is `dist/client/`（static）＋`dist/server/`（Node）.
- Commands: `npm run dev`（前後端一起，API 讀 `.env` 的 `AI_*`／`TAROT_*`／`ASTROCARDS_*`）· `npm run build`
  (→ `dist/client/` + `dist/server/`) · `npm run preview` · `npm run check`（`astro check`
  型別檢查；`npm run build` 不做型別檢查，改動 TS 後須另跑，應為 0 errors）。
  `typescript` 固定 `^6`：`@astrojs/check` 0.9.x 不支援 TypeScript 7，待其支援再升。

## Canonical sources of truth (read these first, in order)

1. `decisions.md` — 決策紀錄（只記「為什麼」：架構選型、範疇／IA 變更、商業規則、
   決定不做的事；2026-11-12 精簡，編號跳號屬正常）。If any other doc conflicts
   with it on those matters, **this file wins**；價格、人名、連結等現值以
   `content_inventory.md` 與程式碼為準。
2. `demo_docs/content_inventory.md` — copy/content SSOT for every page (fully
   populated since DEC-001; never invent copy, names, or prices).
3. `demo_docs/phase0_answers.md` — Phase-0 confirmations（較新的確認優先於 spec）。
4. `demo_docs/spec.md` — original Demo spec; baseline only, several sections
   superseded by decisions.
5. `demo_docs/development_roadmap.md` — phase plan (Phase 0–4 complete; kept for
   reference).
6. `demo_docs/image_prompts.md` — asset registry（命名代碼）+ generation log.

衝突判定順序：`decisions.md`（決策與規則）＞ `content_inventory.md`（文案與現值）＞
`phase0_answers.md` ＞ `spec.md`。

## Current site IA (actual routes)

```
/             index.astro            Hero（含星靈出攤，試算表驅動）/ 四大核心服務×4（卡片底部按鈕、部落格卡列最新文章；DEC-089）/ 許願池入口連結 / 學員評價輪播
/wishlist     wishlist.astro         課程許願池（敲碗開課投票，試算表 SSOT）
/about        about.astro            品牌故事 + 創辦人×2 + 星靈夥伴×9（真人頭像已上架）
/services     services.astro         10 項服務雙欄大卡片，依 4 分類分區（塔羅/星盤/靈數/八字/臼井靈氣/阿卡西/毛孩溝通／天使靈氣／亢達里尼靈氣／靈擺調頻；DEC-087／DEC-089）
/courses      courses.astro          循環課程（圖片常態外顯+手風琴詳情）/ 實體交流會 / 主題工作坊（分類快捷鍵；DEC-088）
/blog         blog/index.astro       星靈專欄列表（分類過濾 + 精選置頂）
/blog/[slug]  blog/[...slug].astro   文章內頁（Content Collections，src/content/blog/ 共 5 篇）
/tarot        tarot.astro            線上塔羅抽卡（AI 解讀）MVP Demo——noindex、不在導覽列（DEC-073）
/astro-cards  astro-cards.astro      線上占星抽卡（AI 解讀）——導覽列「線上占星」、開放索引（DEC-080／DEC-082）
POST /api/tarot/reading        api/tarot/reading.ts        on-demand 路由（Node 服務）
POST /api/astro-cards/reading  api/astro-cards/reading.ts  on-demand 路由（Node 服務）
```

- AI 互動功能共用核心（DEC-079，規格書 `demo_docs/ai_platform_plan.md`）：
  `src/lib/ai/server/`（伺服器專用：`AI_*` 設定、供應商轉接器、`generateText`、標記擷取、
  額度工廠 `createDailyQuota`、輸入守門、端點 HTTP 工具，**不得被前端 import**）＋
  `src/lib/ai/shared/`（前後端共用：共用常數、錯誤碼、安全關懷文案、`postReading`／`trackEvent`）。
  只共用逐行相同之伺服器機制；各功能頁面、狀態機、提示詞與內容資料各自獨立。
- 塔羅抽卡程式集中於 `src/lib/tarot/`（`config.ts` 功能常數檔、`copy.ts` 前端文案、
  `cards.ts`／`spreads.ts` 共用資料；`server-config.ts`／`ai.ts`／`prompt.ts` 為伺服器專用，
  **不得被前端 import**）＋`src/scripts/tarot.ts`。
  規格書：`demo_docs/tarot_plan.md`。牌義與提示詞為佔位內容，待占卜師審定。
- 占星抽卡程式集中於 `src/lib/astro-cards/`（`config.ts`、`copy.ts`、`decks.ts` 前後端共用；
  `server-config.ts`／`ai.ts`／`prompt.ts` 為伺服器專用，**不得被前端 import**）＋`src/scripts/astro-cards.ts`。
  規格書：`demo_docs/astro_cards_plan.md`（DEC-080）。牌義與提示詞為佔位內容，待占星師審定。
- 新增 AI 功能依 `ai_platform_plan.md` 第十節檢查清單；兩功能相似程式各自實作、不互相 import。

- Nav (Navbar.astro): 關於我們 / 命理服務 / 活動與課程 / 課程許願池 / 星靈專欄 / 線上占星 + 「預約諮詢」CTA
- **Removed routes — do not recreate without a DEC entry**:
  - `/reiki`, `/akashic` — pages deleted; content lives on as blog
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
- 部落格文章**不寫死課程的星期、時段、講師、價格**，一律連至
  `/courses#recurring`；粗體緊鄰全形引號（「」）時 `**` 不生效，改用 `<strong>`。
- Every page sets its own `<title>` and meta description. OG image：各頁未個別傳入
  `ogImage`，共用 Layout 預設值 `/assets/common_b_og_image_v1.jpg`（1200×630；
  刻意用 JPG，DEC-091；Layout 會轉成完整網址輸出）。

## Asset management (human-led, WebP mandatory)

- Naming: `[分頁代碼]_[圖片代碼]_[素材名稱]_v[版本號].webp`
  (e.g. `home_a_tarot_world_v3.webp`)；代號登錄於 `image_prompts.md`。
  唯一例外：社群分享圖（OG）用 JPG（DEC-091）。
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
- **`decisions.md` 不是變更日誌，預設不立 DEC**（next number: DEC-092）。
  - 立 DEC 的判準：**半年後的人只看程式碼與規格書，會不會想不通「為什麼這樣做」
    或把它改回去？** 會，才立。只收四類：架構選型、範疇／IA 變更、業主確認的
    商業**規則**、明確決定不做的事。
  - **不立 DEC**：價格／人名／連結／場次等現值更新（改 `content_inventory.md`）、
    版面與文案調整、bug 與程式碼審查修復、素材上架、部署與驗收紀錄、文件同步。
    這些寫在 commit message。
  - 每條只寫背景、決策、理由，以十行內為度；不寫改了哪些檔案、驗收過程、
    審查輪次、上線狀態。細節放對應的 `demo_docs/*_plan.md`。
  - 既有決策被修改或取代時，**直接改寫原條目**（或刪除），不另附加新條目；
    檔案應反映現行決策，歷史由 git 保存。
  - 待業主確認的事項記在 `known_issues/README.md`，不記在 DEC。
  - 規格書或舊註解中的「另立 DEC」字樣同樣適用上述判準。
  Never silently change scope, IA, pricing, or people——不立 DEC 不代表可以不說：
  在回覆與 commit message 中明講。
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
  `/var/www/starwoven`。
- ⚠️ 線上抽卡功能（DEC-073）合併後，`dist/` 改為 `client/`＋`server/` 結構，
  **舊指令 `rsync -a --delete dist/ /var/www/starwoven/` 不得再使用**，一律改用
  `scripts/deploy.sh`（規格見 `demo_docs/tarot_plan.md` 第八節）。

## Environment variables (see `.env.example`)

- `PUBLIC_GA_ID` — GA4 measurement id（未設定時 fallback 為 `G-27D79HXXF5`）。
- `PUBLIC_WISHLIST_API_URL` — Apps Script web app URL；unset → 許願池以本機
  demo 模式運行（不發網路請求，票數存 localStorage）。
- `PUBLIC_BOOTH_API_URL` — 星靈出攤 Apps Script web app URL（`demo_docs/booth_plan.md`）；
  unset → 首頁出攤區直接顯示提示卡（不發網路請求）。build 時編譯進前端，修改後須重新 build＋部署。
- `AI_*` — AI 功能共用之供應商變數（DEC-079；原 `TAROT_AI_*`）、`TAROT_*`／`ASTROCARDS_*` — 塔羅／占星抽卡
  功能開關與每日上限（DEC-073／DEC-080，額度分開計算）。**唯一清單為 `astro.config.mjs` 的 `env.schema`**，一律 server secret
  （執行期讀取、不進 bundle；VPS 改 `app.env` 重啟即生效）。`AI_API_KEY` 選填，缺少時全部 AI
  功能停用、其餘頁面與 build 不受影響。功能前綴不得用 `PUBLIC_`／`AI_`／`ASTRO_`／`NODE_`。
