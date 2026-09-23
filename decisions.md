# 星靈織語 Starwoven — 專案決策紀錄（Decisions Log）

> 依據 `AGENTS.md` 規範，所有超出原始 Spec 或架構調整之決策統一記錄於此，禁止默默變更範疇。

---

## 2026-09-21 — DEC-001：原站文案萃取與 content_inventory.md 定案

- **背景**：原站 Canva 截圖中「關於我們」為空白，原 Spec 與 Phase 0 預期創辦人與成員資料需人工後續補齊，且 `content_inventory.md` 為待辦事項。
- **決策**：從 Canva 發布快取之 bootstrap JSON 中完整提取全站 6 個頁面之真實資料，包含 2 位創辦人（以恩、皮皮）與 8 位核心成員（達心、悠悠、曉宇、姆姆、Migo、凜月、白白、古古）之完整頭銜、專長與服務內容。已完成收錄於 `demo_docs/content_inventory.md`，作為後續所有切版之 Single Source of Truth。

---

## 2026-09-21 — DEC-002：導航列呈現與「星靈選物／商城」架構分離設計

- **背景**：
  - `spec.md` 規劃了 6 大路由（`/`、`/services`、`/courses`、`/about`、`/reiki`、`/akashic`）與預約 CTA 按鈕，並提到未來預留 `/shop`。
  - 原站 Canva 導航列排版為：`關於我們`、`命理服務`、`活動與課程`、`星靈選物`、`預約諮詢`，最上方另有系統層級之 `靈氣與脈輪` 與 `光與阿卡西紀錄`。
  - 業主需求：維持原站 UI 視覺呈現，但底層架構需高可維護性（拆成獨立多頁面），並保留未來商城位置，目前的「星靈選物」可與未來商城獨立開來。
- **決策**：
  1. **獨立頁面架構**：全站維持 Astro 靜態多頁面路由架構，每頁具備獨立之 `.astro` 檔案、獨立 SEO `<title>`、`<meta>` 與 OG tags。
  2. **星靈選物路由 (`/shop`)**：
     - 在網站架構中建立獨立之 `/shop` 頁面（星靈選物）。
     - 現階段內容呈現精選水晶、二手牌卡與手作品介紹，並配置行動按鈕連至 7-11 iOpen Mall（`https://mall.iopenmall.tw/117352/`）。
     - 底層預留未來替換為自建電商商城（購物車、商品清單、金流結帳）之架構接孔。
  3. **導航列（Navbar）整合**：
     - 桌面版與行動版導航完整呈現原站重要項目（關於我們、命理服務、活動課程、靈氣與脈輪、光與阿卡西、星靈選物、預約諮詢）。
     - 排版依據原站精緻風格，兼顧 7 項目之合理佈局與響應式漢堡選單。

---

## 2026-09-23 — DEC-003：正式網域名稱定案為 starwoven.xyz

- **背景**：在 Phase 0 與原始 Spec 中，網域暫定為未購狀態（候選 starwoven.com / starwoven.tw），以 IP 佔位。
- **決策**：業主正式確認正式網域為 `starwoven.xyz`。
  1. `astro.config.mjs` 設定 `site: 'https://starwoven.xyz'`。
  2. `src/layouts/Layout.astro` 內 Canonical URL 與 Open Graph 絕對網址基準更新為 `https://starwoven.xyz`。
  3. VPS Nginx vhost 配置檔使用 `server_name starwoven.xyz www.starwoven.xyz;`。
  4. DNS A Record 指向 `<YOUR_VPS_IP>`，並透過 Certbot 簽署 `starwoven.xyz` 與 `www.starwoven.xyz` 之 Let's Encrypt SSL 憑證。
