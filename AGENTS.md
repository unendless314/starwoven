# AGENTS.md — 星靈織語 Starwoven

## Repo state

This repo contains the **fully built Astro static site** (initial commit `000b083`),
iterated through **DEC-001 ~ DEC-052** in `decisions.md`. The original Demo deadline
(2026-09-23) has passed; the site is feature-complete and under continuous content/UI
iteration. This file was rewritten on 2026-10-06 — the previous version described a
pre-build planning repo and is obsolete.

- Stack: **Astro ^5.18.2** (`output: 'static'`) + **Tailwind CSS v4** via
  `@tailwindcss/vite` (CSS-first config in `src/styles/global.css`; no
  `tailwind.config.*`). No JS framework, no CMS.
- Commands: `npm run dev` · `npm run build` (→ `dist/`) · `npm run preview`

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
```

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
- **Off-spec decisions → append to `decisions.md`** (next number: DEC-053).
  Never silently change scope, IA, pricing, or people.
- **Multi-agent workflow**: when you change shared surfaces (Layout, Navbar,
  footer, `global.css`, `public/assets/`, content schema), say so explicitly in
  your final reply.
- Open content/config issues live in `known_issues/README.md`.

## Deployment (Hetzner NBG1, Ubuntu arm64, nginx)

- Server IP: `<YOUR_VPS_IP>` · domain `starwoven.xyz`（A records for `@`/`www`）。
- Deploy root `/var/www/starwoven`；pure static `dist/` served directly（no
  reverse proxy）。
- **`nginx/starwoven.conf` in this repo is the canonical vhost** — includes the
  `/reiki` / `/akashic` 301s, static caching, gzip, security headers。Add as a
  new vhost only; never edit existing server blocks。
- HTTPS via `certbot --nginx` with auto-renew。
- 部署現況：vhost 配置檔已備妥；實際上傳 VPS、DNS 與憑證作業見
  `development_roadmap.md` Phase 5 勾選狀態。

## Environment variables (see `.env.example`)

- `PUBLIC_GA_ID` — GA4 measurement id（未設定時 fallback 為 `G-27D79HXXF5`）。
- `PUBLIC_WISHLIST_API_URL` — Apps Script web app URL；unset → 許願池以本機
  demo 模式運行（不發網路請求，票數存 localStorage）。
