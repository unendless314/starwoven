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

---

## 2026-09-29 — DEC-004：移除 /shop 商城展示頁，首頁「星靈選物」卡片替換為「靈氣調頻」

- **背景**：
  - 在前次 DEC-002 中，為貼近原站導航曾暫設 `/shop` 頁面連至外部 7-11 賣場。
  - 經討論確認，現階段靜態 Demo 應聚焦於命理諮詢、身心靈課程與靈氣療癒之品牌核心展示，不另外建置 `/shop` 頁面，使全站嚴格回歸原始 `spec.md` 與 `AGENTS.md` 所規劃之 6 大頂層路由。
  - 同時首頁四大核心服務卡片中的「星靈選物」同步刪除，調整為核心療癒主題「靈氣調頻」。
- **決策**：
  1. **移除 `/shop` 路由**：刪除 `src/pages/shop.astro`，全站頂層路由回歸標準 6 頁（`/`、`/about`、`/services`、`/courses`、`/reiki`、`/akashic`）。
  2. **導航列同步更新**：`Navbar.astro` 移除「星靈選物」項目，桌面版與行動版選單回歸 5 個核心導航項目＋1 個預約諮詢按鈕。
  3. **首頁卡片 4 改為「靈氣調頻」**：
     - 首頁四大服務卡片之第四張卡片替換為「靈氣調頻」，展示項目為「臼井靈氣、脈輪平衡、能量淨化、身心調頻」。
     - 卡片連結改為導向 `/reiki`（靈氣與脈輪）。
     - 素材規劃由原先的水晶草本更換為靈氣手勢與能量光芒意象。
  4. **實體商品導購承接**：二手牌卡、礦石水晶等周邊商品之購買連結，維持由全站頁尾（Footer）之 7-11 iOpen Mall 連結及 QR Code 承接，不影響既有外部販售管道。

---

## 2026-09-29 — DEC-005：固定循環課程收費規則定案（包月 4 堂 2000 元，不開放單堂）

- **背景**：
  - 原站文案於首頁註明「包 4 堂優惠 1800 元」，但課程頁部分班級註明「包月四堂 2000 元」，且對於是否能單堂上課存在歧異，列於 `known_issues/README.md`（問題 1）待業主確認。
- **決策**：
  1. **價格統一為包月 2000 元**：所有常態固定循環課程（阿卡西與光的課程、占星循環班、七脈輪與靈氣、托特塔羅、生命靈數等），定價統一為每期 **4 堂 2000 元**（平均每堂 500 元），取消 1800 元舊版折價文案。
  2. **必須以月為單位報名**：統一採**月費制／包月報名**，學員必須以月為單位報名一期（4 堂），**恕不開放單堂散客上課**，以維持班級研討與進度之一致性。
  3. **團練獨立性**：阿卡西、靈氣等系統若有單獨團練活動，可另行單獨報名（單次團練），但正式常態課程嚴格執行包月制。
  4. **問題結案**：同步修正 `content_inventory.md`、首頁收費說明卡片及活動課程頁面標示，關閉 `known_issues/README.md` 之第 1 項已知問題。

---

## 2026-09-29 — DEC-006：首頁課程收費說明與報名按鈕區塊替換為「學員評價／心得輪播」

- **背景**：
  - 首頁原固定循環課程卡片下方包含一組左右雙欄區塊（左欄為收費與 LINE 預約白底卡片，右欄為 4 顆大報名按鈕）。
  - 經業主與團隊評估討論，該區塊顯得重複且佔位過多，決定全數移除，並改建為展示社群口碑的「學員心聲／評價輪播卡片（Testimonials Carousel）」。
- **決策**：
  1. **移除舊版按鈕與重複說明**：移除首頁下方原左右雙欄之收費白底卡片與 4 顆直排報名按鈕。
  2. **新增學員評價輪播卡片**：
     - 卡片規格包含：1. 頭像小圖（頭像縮圖／首字漸層圖標）、2. 學員 ID / 稱號、3. 真實溫暖評語（涵蓋塔羅、阿卡西、脈輪靈氣、占星等課程）。
     - 效果採平滑無縫無限循環滾動（Smooth Infinite Carousel / Marquee），支援滑鼠懸停暫停（Hover Pause）與觸控滑動。
  3. **資料驅動維護**：在首頁建立 `studentReviews` 資料結構，方便業主後續隨時增補或替換真實學員回饋文字與頭像。

---

## 2026-09-29 — DEC-007：頁尾聯絡我們改版，移除 QR Code 卡片改為社群 Favicon，地址整合 Google Map 導航連結

- **背景**：
  - 原全站頁尾（Footer）配置了 4 張大型 QR Code 卡片（Line ID、Instagram、Line 社群、iOpen Mall 星靈選物），視覺佔比較重，且 LINE 社群邀請網址待補。
  - 經業主指示，期望頁尾排版輕巧現代化，要求移除全部 4 張大型 QR Code 卡片，僅保留 5 個主要社群小圖標（Favicon：Instagram、Facebook、Threads、LINE、YouTube），並將原獨立之「點我連結Google map」膠囊按鈕整合進左側實體地址，使地址直接作為可點擊之導航按鈕。
- **決策**：
  1. **移除 4 大 QR Code 卡片**：刪除原 Line ID、Instagram、Line 社群、iOpen Mall 之大型 QR Code 卡片 Grid。
  2. **新增 5 大社群 Favicon 圖標按鈕列**：
     - 圖標項目包含：**Instagram**、**Facebook**、**Threads**、**LINE**、**YouTube**。
     - **真實社群帳號連結**：
       - Instagram：導向官方帳號 `https://www.instagram.com/starwoven2026`。
       - LINE：導向官方 LINE `https://line.me/R/ti/p/@347fucvj?ts=07031038&oat_content=url`（ID: `@347fucvj`）。
     - **平台首頁預留佔位（Placeholder）**：
       - Facebook（`https://www.facebook.com`）
       - Threads（`https://www.threads.net`）
       - YouTube（`https://www.youtube.com`）
       （未來開通專頁或頻道時可直接替換實際 URL）。
     - 樣式採圓形微互動按鈕，預設配合深/淺主題，滑鼠懸停時微放大並切換各平台品牌識別色（IG 品紅、FB 藍、Threads 黑/白、LINE 綠、YT 紅）。
  3. **實體地址按鈕化與 Google Map 導航整合**：
     - 將左側「高雄市前金區河南二路140號2樓（近捷運前金站一號出口）」轉為互動卡片按鈕。
     - 點擊後以新分頁開啟 Google Maps 導航（`https://maps.app.goo.gl/ZZuc8QC1tHn13GxE6`），附帶向外導覽指示圖示與懸停漣漪回饋。
  4. **問題結案**：同步關閉 `known_issues/README.md` 之第 2 項已知問題（LINE 社群卡片連結待補）。

---

## 2026-09-29 — DEC-008：導入全站 Dark / Light 模式切換機制（Navbar 太陽/月亮切換鈕、localStorage 偏好記憶、全站深淺雙向適配）

- **背景**：
  - 原設計中，首頁（Index）預設採深邃星空藍紫（`#2E2A4F`），而內頁（About、Services、Courses、Reiki、Akashic）預設採淡水彩柔和淺藍（`#EAF3F8`）。
  - 使用者期望全站能提供深淺模式（Dark / Light Mode）切換功能，既能保留星空的神祕感，又能提供日間舒適的長文閱讀體驗。
- **決策**：
  1. **Tailwind v4 自訂 Dark 變體支援**：
     - 在 `src/styles/global.css` 中配置 `@custom-variant dark (&:where(.dark, .dark *));`，無縫配合 Tailwind CSS v4 之全新 CSS-first 引擎。
  2. **防閃爍（Zero-FOUC）全站底層腳本**：
     - 在 `src/layouts/Layout.astro` `<head>` 置入行內阻斷式偵測腳本（`is:inline`）。
     - 檢查 `localStorage.getItem('starwoven_theme')`，若有儲存偏好則立即套用；若尚無自訂紀錄，則首頁預設為深色星空、內頁預設為淺水彩，避免跳轉或重整時發生任何閃爍。
  3. **導航列雙端切換鈕（Desktop & Mobile）**：
     - 在 `src/components/Navbar.astro` 桌面導航右側（預約諮詢按鈕旁）與行動版漢堡選單內，均配置圓形日/夜切換鈕。
     - 按鈕內嵌精緻之太陽（Sun）與月亮（Moon）SVG 圖示，隨主題狀態動態呈現對應圖示。
     - 支援滑鼠點擊切換、鍵盤無障礙與觸控操作，切換時即刻同步全站 `html.dark` class 與 `localStorage` 偏好。
  4. **全站 6 大頁面深淺色雙向適配**：
     - **首頁 (`/`)**：
       - 深色模式：維持經典星空夜景、金色月亮、深靛藍漸層（`#2E2A4F`）與金色文字光暈。
       - 淺色模式：轉為晨曦清亮柔和水藍微光漸層（`from-[#DFECF3] via-[#EAF3F8] to-[#D5E5F0]`），文字切換為深藍灰（`#2D3748` / `#1F2937`），各區塊卡片轉為輕盈半透白底。
     - **內頁 (`/about`, `/services`, `/courses`, `/reiki`, `/akashic`)**：
       - 淺色模式：維持淡水藍手繪水彩洗感（`#EAF3F8`）。
       - 深色模式：平滑過渡為深紫星夜背景（`#2E2A4F`），文字升階為明亮清晰之珍珠白與柔金（`text-white`, `text-[#FCE794]`），資訊卡片與課表套用高質感半透明毛玻璃微光（`dark:bg-white/10`, `dark:border-white/15`）。
     - **頁尾（Footer）**：
       - 隨全局模式切換深淺背景（深藍紫 `dark:bg-[#1E1B3A]` / 柔灰藍 `bg-[#DCE9F2]`），社群按鈕與實體地址導航卡片無縫適配雙主題色彩。


---

## 2026-09-29 — DEC-009：代碼審查問題修正（iOpen Mall 賣場 Favicon、對齊阿卡西團練費用 250 元、重構雙軌跑馬燈消除 12px 縫隙瞬跳）

- **背景**：
  - 經由代碼審查發現三處待修正事項：
    1. DEC-004 提及移除 `/shop` 後由頁尾承接 7-11 賣場，但 DEC-007 頁尾精簡時移除了所有卡片，導致全站缺乏連至 iOpen Mall 的入口。
    2. `demo_docs/content_inventory.md` 首頁預告摘要寫阿卡西團練 200 元，但 `/courses` 課程內頁與其他團練均寫 250 元，存在內部資料衝突。
    3. 首頁學員評價輪播因單一容器內複製卡片產生 11 個間隙（奇數），`translateX(-50%)` 動畫在循環交界處產生約 12px 的瞬跳瑕疵。
- **決策**：
  1. **恢復 iOpen Mall 購物商城 Favicon**：
     - 在全站頁尾（`Layout.astro`）的社群 Favicon 列中新增第 6 個「星靈選物（7-11 iOpen Mall 賣場）」專屬購物袋圖示按鈕。
     - 點擊開啟新分頁連至 `https://mall.iopenmall.tw/117352/`，懸停時轉為 iOpen 橘色（`#F26522`），完美解決賣場導購需求且維持頁尾極簡風格。
  2. **對齊阿卡西紀錄團練定價為 250 元**：
     - 將 `content_inventory.md` line 63 的歷史筆誤校正為「團練每次 250 元」，使全站所有團練（阿卡西、靈氣、托特、偉特）定價統一為標準的 **250 元**，與 `/courses` 頁面 100% 吻合。
  3. **重構雙軌跑馬燈（Two-Track Marquee）**：
     - 將首頁評價輪播卡片重構為標準雙軌道架構（Track 1 與 Track 2，Track 2 標註 `aria-hidden="true"` 防止無障礙重複朗讀）。
     - 各軌道末端配置對應之間隙 padding（`pr-5 sm:pr-6`），動畫位移設定為精確的 `translateX(-100%)`。
     - 數學上達成完全對齊，徹底消除每輪循環時的 12px 縫隙微瞬跳，呈現絲滑無縫的無限輪播效果。
