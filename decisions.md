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

---

## 2026-09-29 — DEC-010：命理服務「塔羅占卜」收費標準與項目調整

- **背景**：
  - 依業主最新指示，命理服務頁面（`/services`）中的「塔羅占卜」收費資訊需要調整，包含新增面對面形式並更新半小時價格結構。為避免多行項目造成卡片高度與其他 5 項服務落差過大影響視覺協調，移除 1 小時之選項。
- **決策**：
  1. **塔羅占卜收費項目定案**：
     - **離線文字占卜**：一題 300 元
     - **語音和面對面占卜**：半小時 600 元（原先 1 小時 1200 元之選項予以刪除，使全站卡片維持高度和諧）
  2. **版面結構優化**：
     - `src/pages/services.astro` 採用彈性結構陣列渲染價格項目，卡片統一配置 `flex flex-col justify-between`，確保 6 大服務卡片在桌面與行動端均維持水平對齊與美觀佈局。
     - 同步更新 Single Source of Truth 文件 `demo_docs/content_inventory.md`。

---

## 2026-09-29 — DEC-011：命理服務頁面版面重構（還原 Canva 原站雙欄寬幅大卡片與專屬留圖空間）

- **背景**：
  - 經對照 Canva 原始範本網站（`https://jessicalam-portfolio.my.canva.site/dahp-kg9jiq/starwovenwrite`），發現既有 `services.astro` 僅為 Phase 1 骨架留下的 3 欄式小卡片純文字預覽，與 Canva 原站存在明顯落差：
    1. **排版格式差異**：Canva 原站採大氣的 2 欄式大卡片（每排 2 個，共 3 排），而非 3 欄擠迫小卡片。
    2. **留圖空間缺失**：Canva 原站每個服務項目均配有專屬的精緻手繪插圖位置（塔羅牌、星盤、靈數、八字、靈氣、阿卡西之書）。
    3. **師資資訊完整度**：Canva 原站於卡片底部清楚列出各服務之「可預約占卜師 / 命理師 / 靈氣師」名單（如偉特塔羅與托特塔羅系統分組）。
- **決策**：
  1. **改採 2 欄式寬幅大卡片（Grid 2 欄）**：
     - 將卡片容器升級為 `grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10`，在桌機上呈現寬綽舒展的雙欄格局，行動端維持單欄順暢流動。
  2. **配置專屬留圖空間與 SVG 佔位符**：
     - 為 6 大服務建立獨立素材路徑變數（`imgTarot`、`imgAstrology`、`imgNumerology`、`imgBazi`、`imgReiki`、`imgAkashic`）。
     - 未放入真圖前，自動呈現靈性手繪質感之 SVG 幾何圖示與素材代碼標籤（`服務-A` ~ `服務-F`），有圖時等比無縫載入。
  3. **完整還原師資團隊標籤與收費說明**：
     - 還原各卡片之預約形式（通話語音、面對面、離線文字）、超時計費備註與各領域老師名單徽章。
     - **更正塔羅占卜師資歸屬**：依 Canva 原站排版，精準校正為兩類別各兩位老師——偉特塔羅（以恩、達心）、托特塔羅（曉宇、悠悠），修正前期 inventory 文件將 4 人全數併入偉特之誤。

---

## 2026-09-30 — DEC-012：偉特塔羅課表校正（修正原站舊資訊：時間 20:00-21:30、包月四堂 1200 元、無單堂課程）

- **背景**：
  - 經業主指示確認，原始 Canva 網站中針對週三「偉特塔羅」的課表描述存在歷史舊資訊誤植（原站同時列有「偉特塔羅課程」與「偉特塔羅團練 1000 元/單堂 250 元」）。
  - 業主明確指示最新營運規則：週三固定循環課程為「**偉特塔羅團練**」，時間為 **20:00-21:30**，由**以恩老師**授課，費用為**包月四堂 1200 元**，不設單堂課程。
- **決策**：
  1. **活動與課程頁面 (`courses.astro`)**：
     - 將週三課程更新為：標題「偉特塔羅團練」、時間「20:00 - 21:30」、費用「包月四堂 1200元（平均每堂 300元）」。
     - 移除單堂報名備註（`extraNote`），卡片底端僅標示「採包月小班制」，確保與最新規定相符。
  2. **首頁課表同步 (`index.astro`)**：
     - 將每週三課程卡片標題調整為「偉特塔羅團練」、時段更新為「20:00-21:30」、費用確認為「包月四堂1200元」。
  3. **資料規格文件同步**：
     - 更新 `demo_docs/content_inventory.md`，將原先分列的課程與團練整併為單一項目「4. 偉特塔羅團練（20:00-21:30，以恩老師，包月四堂1200元，無單堂課程）」，並順延後續課程編號。
     - 更新 `demo_docs/image_prompts.md` 中的對應描述為偉特塔羅團練。

---

## 2026-09-30 — DEC-013：循環課程團練單報費用統一改為「包月四堂 1000 元」（不接受單堂）

- **背景**：
  - 經業主指示確認，全站所有可單獨報名團練的課程（阿卡西紀錄、七脈輪與靈氣、托特塔羅），一律取消原先單堂計費（250元/次），統一改採「包月四堂 1000 元」，不接受單堂報名。
- **決策**：
  1. **活動與課程頁面 (`courses.astro`)**：
     - 週一「光與阿卡西紀錄」：備註更新為「✦ 可單報阿卡西紀錄團練（20:00-21:00 包月四堂1000元）」。
     - 週四「七脈輪與靈氣」：備註更新為「✦ 可單報靈氣團練（21:45-23:00 包月四堂1000元）」。
     - 週五「托特塔羅循環班」：備註更新為「✦ 可單報托特塔羅團練（20:00-21:00 包月四堂1000元）」。
  2. **文件同步 (`content_inventory.md`)**：
     - 同步更新對應課程條目之團練報名說明為「包月四堂1000元」，確保全站收費規則一致。

---

## 2026-09-30 — DEC-014：活動與課程「固定循環課程」區塊排版改為 1*6 橫向寬幅卡片（單欄 6 列）

- **背景**：
  - 原設計採 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`（3 欄 × 2 列的 3*2 直式卡片排列）。
  - 經對照 Canva 原站（`starwovenstudy`）垂直依序展示各門課程之格局，業主期望版面調整為「1*6 行」（每行 1 門課程，直向堆疊 6 行），以容納更大氣的留圖展示空間與更詳盡的課程說明。
- **決策**：
  1. **活動與課程頁面 (`courses.astro`)**：
     - 將容器改為單欄縱向流動 `flex flex-col gap-6 sm:gap-8`。
     - 每一門課程重構為橫向寬幅大卡片（Desktop 採 12 欄內部佈局）：
       - 左側（5 欄）：16:10 寬螢幕留圖空間，結合醒目之星期色彩標籤（如 `每週一`）與各課程專屬手繪風靈性 SVG 符號。
       - 右側（7 欄）：課程大標題、授課講師徽章、開課時間、價格突出展示區塊（含包月四堂與團練單報備註），以及專屬的「私訊詢問檔期」LINE 預約按鈕。
     - 行動端自然降級為垂直流動（圖在上、文在下），提供極佳的手機瀏覽體驗。

---

## 2026-09-30 — DEC-015：固定循環課程全面升級為「手風琴模式（Accordion）」收折卡片與深度介紹文案

- **背景**：
  - 1*6 直列排版雖然大氣，但在未收折時頁面長度較長。業主期望能改為收折式卡片，點擊標題列平滑展開查看詳細介紹，再點一下收合，並指示採「手風琴模式（Accordion Mode）」（即開啟任一課程時，自動收合其他已展開的課程），介紹文案可先由 AI 生成佔位文案。
- **決策**：
  1. **手風琴交互架構實作 (`courses.astro`)**：
     - 採用現代 HTML5 原生 `<details name="recurring-courses-accordion">` 結合 `<summary>` 標籤，現代瀏覽器原生支援組名互斥手風琴功能。
     - 輔以輕量漸進增強腳本（Progressive Enhancement Script），保證在所有舊版環境與各型行動裝置上均能 100% 穩定實現「點擊展開、互斥收合、點擊即關」的完美體驗。
     - 加入 CSS Keyframe 平滑滑入微動畫（`accordionSlideDown`）與 180 度圓形箭頭旋轉過渡效果。
  2. **收合與展開雙態視覺設計**：
     - **收合狀態（常態摘要列）**：高質感收縮條（高度約 64~72px），清晰展示星期徽章、課程名稱、授課老師、時段、費用與旋轉指示箭頭，週一到週六 6 門課在單一螢幕畫面內一目了然。
     - **展開狀態（深度詳情面板）**：
       - 左側（5 欄）：保留原本專屬的 16:10 寬螢幕留圖空間與靈性手繪 SVG 標籤。
       - 右側（7 欄）：配置完整的深度介紹文案（Overview）、3 大核心學習重點（Highlights）、適合對象（Suitable For）、費用與團練說明框，以及直通官方 LINE 的預約按鈕。
  3. **高品質占位文案生成**：
     - 依據星靈織語品牌調性與各課程領域（阿卡西、占星、偉特塔羅、靈氣脈輪、托特塔羅、生命靈數），撰寫契合且具專業度的課程理念、3 項學習重點與適合學習族群文案。

---

## 2026-09-30 — DEC-016：固定循環課程收折優化：圖片常態外顯隨時可見，僅收折詳細介紹文案

- **背景**：
  - 前一版本將整張卡片（包含圖片）包覆在 `<details>` 之中，導致收合狀態下無法直接看見各課程專屬的精緻插圖與現場留圖空間，減弱了視覺吸引力。
  - 經業主指示確認：「圖片不能夾在收折的文字當中，圖片應該要外顯隨時都能看到，只有細節介紹內容是可以收折的」。
- **決策**：
  1. **圖片與核心資訊常態外顯**：
     - 將大卡片外層重構為常態展示的寬幅 Grid 容器。
     - 左側（5 欄）：16:10 課程專屬留圖空間、手繪 SVG 標記與星期色彩膠囊**永久外顯、隨時可見**。
     - 右側（7 欄）：課程大標題、授課老師、開課時間、價格標籤、加碼備註與 LINE 私訊按鈕亦保持外顯，訪客無須展開即可直接掌握課表與預約。
  2. **手風琴僅作用於「深度介紹抽屜」**：
     - 將 `<details>` 收折抽屜僅套用於「✦ 課程簡介 Overview」、「✦ 學習重點 Highlights」與「適合對象 Suitable For」。
     - 點擊「點擊展開詳細介紹與學習重點」時，抽屜向下平滑展開；開啟新課程時，其他課程的抽屜自動收回，完美兼顧圖片外顯率與排版整潔度。

---

## 2026-09-30 — DEC-017：關於我們頁面重構（對齊 Canva 原站 2*4 成員網格、補齊過渡區塊與 11 處專屬留圖空間）

- **背景**：
  - 經對照 Canva 原版網站（`https://jessicalam-portfolio.my.canva.site/dahp-kg9jiq/starwovenpeople`），發現現有 `src/pages/about.astro` 與 Canva 原版存在顯著落差：
    1. **成員排版落差**：原先成員採 `grid-cols-4`（4×2 的 4 欄擠迫直式小方塊），而 Canva 原版 Section 4 & 5 為大氣寬敞的 **2 欄 × 4 排（2*4 行）** 橫式名片佈局。
    2. **卡片樣式差異**：Canva 原版為左側 269×269 大圓頭像、右側名字與專長垂直條列的橫向「名片式」設計。
    3. **遺漏過渡章節**：Canva 原版在品牌故事與團隊名片之間，設有 Section 2「認識星靈夥伴」及其溫暖引導文案，既有頁面漏掉了此過渡區塊。
    4. **品牌故事側邊插圖缺失**：Canva Section 1 品牌故事右側留有寬 447 × 高 517 px 的氛圍插圖空間，既有頁面僅為單純純文字置頂。
- **決策**：
  1. **成員網格重構為 2 欄 × 4 排（2*4 行）橫式名片**：
     - 將 8 位星靈夥伴重構為 `grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8`。
     - 每一位夥伴採橫向名片卡片：左側為 269×269 規格大圓頭像槽（未上傳時展示精緻靈性圖示與 `[關於-D]` ~ `[關於-K]` 標籤），右側為大字名字、身分與專長標籤。
     - 嚴格對齊 Canva 原版左右排列順序：
       - 第 1 排：達心（左） · 曉宇（右）
       - 第 2 排：悠悠（左） · 姆姆（右）
       - 第 3 排：凜月（左） · 白白（右）
       - 第 4 排：Migo（左） · 古古（右）
  2. **創辦人區塊升級（2 欄 × 1 排 尊榮橫式名片）**：
     - 以恩與皮皮採用加大圓頭像（`w-32 h-32`）、金色創辦人徽章（`Founders`）與橫向名片佈局，各配置 `[關於-B]` 與 `[關於-C]` 留圖槽。
  3. **補齊 Section 2「認識星靈夥伴」**：
     - 完整還原標題與文案：「每位夥伴都有不同的專長與風格，願用自己的專業與經驗，陪伴你看見更多可能，找到最適合自己的答案。」並搭配四芒星與星辰星軌裝飾。
  4. **品牌故事（Section 1）升級為雙欄佈局並加入 `[關於-A]` 留圖空間**：
     - 桌面端左側 7 欄配置品牌緣起長文，右側 5 欄配置 4:5 比例之品牌故事氛圍插圖空間（447 × 517 px），配備織光靈性 SVG 預覽圖。
  5. **素材規範與文檔同步**：
     - 在 `demo_docs/image_prompts.md` 中完整登錄 `[關於]-[圖片 A~K]` 共 11 處圖位與生成紀錄，建立清楚透明的素材對應。

---

## 2026-09-30 — DEC-018：代碼審查問題修復（課程頂部區間價格橫幅、清理 ServiceCard.id、消除首頁-M 重複代碼）

- **背景**：
  - 經由外部 AI 代碼審查回報三項可操作性改進建議：
    1. **課程頂部價格標籤衝突**：`courses.astro:246` 標示「每期 4 堂 2,000 元（平均 500 元 / 堂）」，但週三「偉特塔羅團練」實際為 1,200 元（平均 300 元 / 堂），單一標示容易造成學員預期矛盾。
    2. **未使用的資料屬性**：`services.astro:22` 定義了 `ServiceCard.id`，但在模板渲染中並未被使用。
    3. **首頁圖片代號重複**：`demo_docs/image_prompts.md` 與 `index.astro` 同時將週三課程與以恩老師形象照標記為 `首頁-M`，存在素材混淆風險。
- **決策**：
  1. **固定循環課程價格橫幅改為精確區間標示**：
     - `courses.astro` 頂部膠囊標籤更新為：`每期 4 堂 1,200 ~ 2,000 元（平均 300 ~ 500 元 / 堂）`。
     - 精確涵蓋週三（1,200 元）與其餘課程（2,000 元），資訊 100% 透明且不誤導。
  2. **清理 `ServiceCard.id` 冗餘欄位**：
     - 從 `interface ServiceCard` 及 6 個服務項目中移除未使用的 `id` 屬性，提升資料純度與可維護性。
  3. **消除 `首頁-M` 代號衝突並依序重構**：
     - 首頁週一至週六 6 門課程順暢編排為連續字母 `首頁-G` ~ `首頁-L`（週三偉特團練為 `首頁-I`，`home_i_course_waite.jpg`）。
     - 師資介紹維持 `首頁-M`（以恩）、`首頁-N`（皮皮）、`首頁-O`（達心），無需改動圖檔名。
     - 底層星空背景圖順延為 `首頁-P`（`home_p_bg_stars_v1.png`）。
     - 同步更新 `demo_docs/image_prompts.md` 與 `src/pages/index.astro`。
  4. **文檔同步與程式碼清潔**：
     - `demo_docs/content_inventory.md` 同步修正週三偉特團練時間（20:00-21:30）與團練包月四堂 1000 元。
     - 清理所有檔案多餘的行尾空白與結尾多餘空行。

---

## 2026-09-30 — DEC-019：導入 Astro Content Collections 建立「星靈專欄」（Blog）與全站導航整合

- **背景**：
  - 業主期望為網站新增部落格（Blog）專欄功能，以發布身心靈、命理、阿卡西紀錄、靈氣調頻與塔羅學習等專業文章，增強內容行銷、SEO 觸及與學員互動。
  - 原 Spec 與 `AGENTS.md` 僅規劃 6 大核心頁面，新增部落格為架構範疇擴充，依規範記錄於此。
- **決策**：
  1. **導入 Astro 5 Content Collections（方案 A）**：
     - 配置 `src/content.config.ts`，採用 Astro 5 Content Layer API（`glob` loader 監聽 `src/content/blog/`）。
     - 定義嚴謹之 TypeScript Zod Schema（包含 `title`、`description`、`pubDate`、`author`、`authorRole`、`category`、`tags`、`readTime`、`featured` 等欄位）。
  2. **建立專欄列表頁 (`src/pages/blog/index.astro`)**：
     - 包含頂部星空氛圍標題、分類標籤切換過濾器（全部、光與阿卡西、靈氣與脈輪、命理與占卜）。
     - 置頂精選專文（Featured Post）寬幅大卡片。
     - 響應式文章網格（Grid），提供標籤、日期、作者微名片與閱讀時間。
     - 完美融入既有深淺色主題（Dark / Light Mode）切換機制。
     - 底部整合「預約諮詢」LINE 官方引導橫幅。
  3. **建立動態文章內頁 (`src/pages/blog/[...slug].astro`)**：
     - 透過 `getStaticPaths()` 靜態預先渲染純 HTML。
     - 內建層級麵包屑導航（首頁 / 星靈專欄 / 分類）。
     - 專屬 Markdown 樣式適配（支援各級標題、引言金句框、有序/無序清單、深淺色自適應高亮）。
     - 內建「延伸閱讀推薦」雙卡片與作者身分徽章。
  4. **導航列（Navbar）整合與斷點微調**：
     - `src/components/Navbar.astro` 中的 `navLinks` 加入 `{ name: '星靈專欄', href: '/blog' }`，自動同步桌面導航與行動版漢堡選單。
     - 桌面導航間距由 `gap-6 xl:gap-8` 微調為 `gap-3.5 xl:gap-7`，文字字級調整為 `text-sm xl:text-base`，確保在 1024px ~ 1280px 中型螢幕寬度下 6 個導航項目、主題切換鈕與預約按鈕均維持優雅單行佈局，無任何折行。
  5. **建立 3 篇品牌高質感範例專文**：
     - `akashic-records-intro.md`（解鎖靈魂的藍圖：初探光與阿卡西紀錄）
     - `reiki-daily-healing.md`（日常能量急救包：如何運用脈輪與靈氣自我調頻）
     - `tarot-mindful-dialogue.md`（不只是預測未來：塔羅牌是一面映照心靈的鏡子）

---

## 2026-09-30 — DEC-020：精簡主導航列（移除「靈氣與脈輪」、「光與阿卡西紀錄」頁籤），內容深度移植至「星靈專欄」

- **背景**：
  - 經業主與團隊共識，為了使全站主導航更俐落聚焦，決定將導航列上的「靈氣與脈輪」與「光與阿卡西紀錄」獨立頁籤移除。
  - 兩頁原有的豐富教學與 FAQ 內容，全數深度移植至「星靈專欄」作為長青精選專文。
- **決策**：
  1. **主導航列（Navbar）精簡**：
     - `src/components/Navbar.astro` 移除「靈氣與脈輪」與「光與阿卡西紀錄」項目。
     - 導航項目聚焦為 4 大核心：**關於我們**（`/about`）、**命理服務**（`/services`）、**活動與課程**（`/courses`）、**星靈專欄**（`/blog`）。
     - 桌面版排版間距恢復為舒適的 `gap-6 xl:gap-8` 與 `text-base`，整體視覺更為大氣與平衡。
  2. **深度內容移植至星靈專欄（Content Collections）**：
     - **光與阿卡西紀錄**：移植為 `src/content/blog/light-and-akashic-records.md`（《治癒別人，我們就獲得治癒：光與阿卡西紀錄的探索指引與常見問答》），完整保留核心精神、身心調頻作用與四大常見 FAQ。
     - **靈氣與脈輪**：移植為 `src/content/blog/reiki-and-chakras.md`（《建立你的身心自我檢測系統：認識臼井靈氣與七脈輪日常調頻》），完整收錄臼井靈氣源流、自我檢測哲學，以及六大脈輪對現代上班族舒緩焦慮與提升職場自信的精闢指引。
  3. **頁面轉址與內部連結更新**：
     - `src/pages/index.astro` 首頁四大核心卡片之「靈氣調頻」點擊連結更新為 `/blog/reiki-and-chakras`。
     - `src/pages/reiki.astro` 與 `src/pages/akashic.astro` 設定標準 301 靜態跳轉至對應專欄文章，確保既有外部連結與書籤不失效。

---

## 2026-09-30 — DEC-021：統一「星靈專欄」全站封面圖規格與靈性佔位視覺系統

- **背景**：
  - 在前次版本中，專欄頂部的「置頂精選專文」具備專屬視覺圖槽，而下方網格的「一般文章卡片」為純文字名片版型，造成訪客視覺上產生「部分文章有封面圖、部分文章沒有封面圖」的感受差異。
  - 經業主指示確認，全站專欄文章應當統一封面圖配置，呈現和諧標準之媒體雜誌感。
- **決策**：
  1. **專欄列表頁 (`src/pages/blog/index.astro`) 統一封面圖槽**：
     - 一般文章網格中的每一張卡片頂部，統一加入標準 16:10 寬幅封面圖容器。
     - **智慧佔位（Smart Placeholder）機制**：
       - 若文章 Frontmatter 填寫 `coverImage`，自動載入真實圖片並支援微縮放懸停特效。
       - 若尚未上傳自訂圖片，自動依文章分類（「光與阿卡西」、「靈氣與脈輪」、「命理與占卜」等）渲染專屬的靈性幾何符號（阿卡西之書、脈輪能量光暈、星芒塔羅盤）與星空水彩漸層光斑，確保全站所有卡片皆具備完整而精緻的視覺焦點。
  2. **文章詳情內頁 (`src/pages/blog/[...slug].astro`) 導入專屬封面橫幅**：
     - 在標頭與正文之間配置 21:9 / 16:9 大氣編輯部橫幅（Editorial Cover Banner），具備分類光芒膠囊、星光漸層、靈性圖示與閱讀時間。
     - 底部「延伸閱讀推薦」雙卡片同步加入迷你封面圖槽，確保全站閱讀體驗一致連貫。

---

## 2026-09-30 — DEC-022：代碼審查修復（Schema coverImage 補齊、專欄列表重複卡片消除、Nginx 301 規則定案、單一精選限制與空狀態優化）

- **背景**：
  - 經由外部 AI 代碼審查提出 6 項關於可維護性與潛在 Bug 的改進報告，經評估後全數採納實施。
- **決策與修復項目**：
  1. **補齊 Zod Schema `coverImage` 欄位與 `z.enum` 分類防呆**：
     - 在 `src/content.config.ts` 中補齊 `coverImage: z.string().optional()`，解決 Zod 自動剔除未宣告欄位導致封面圖失效之隱患。
     - 定義 `BLOG_CATEGORIES = ['光與阿卡西', '靈氣與脈輪', '命理與占卜', '心靈隨筆'] as const`，並透過 `z.enum(BLOG_CATEGORIES)` 強型別驗證，防止小編手民之誤產生無效分類標籤。
  2. **消除文章列表重複顯示（改用 `regularPosts`）**：
     - `src/pages/blog/index.astro` 網格渲染改為 `regularPosts.map(...)`，徹底解決置頂精選文章在下方網格再度重複出現的問題。
  3. **定案 Nginx 伺服器層級 301 重定向規範**：
     - 針對 `/reiki` 與 `/akashic` 舊路徑，保留 Astro 靜態 HTML 作為本地端預覽與客戶端 Fallback，同時在 VPS Nginx vhost 配置中追加伺服器層級之絕對跳轉：
       ```nginx
       location = /reiki { return 301 /blog/reiki-and-chakras; }
       location = /reiki/ { return 301 /blog/reiki-and-chakras; }
       location = /akashic { return 301 /blog/light-and-akashic-records; }
       location = /akashic/ { return 301 /blog/light-and-akashic-records; }
       ```
       確保搜尋引擎爬蟲（SEO）能接收到標準的 HTTP 301 Moved Permanently 狀態碼。
  4. **嚴格限制單一精選文章（Single Featured Article）**：
     - 將 `src/content/blog/akashic-records-intro.md` 的 `featured` 修正為 `false`，全站僅保留 `light-and-akashic-records.md` 為單一精選文章，避免多篇置頂爭搶版面。
  5. **首頁與分類空狀態（Empty State）顯示防禦**：
     - 當專欄文章數為 0 篇時，`index.astro` 預設顯示「目前專欄籌備中，敬請期待全新靈性文章上線」，修復無文章時畫面空白的缺陷。
  6. **清除生產環境死代碼（Dead Code）**：
     - 移除客戶端腳本中未使用的 `featuredCard` DOM 查詢變數。

---

## 2026-09-30 — DEC-023：Nginx 專屬 vhost 配置檔落地、徹底移除靜態過渡檔案與 CategoryIcon 重構

- **背景**：
  - 外部代碼審查 Follow-up 指出：純靜態模式下的 `reiki.astro` 與 `akashic.astro` 依然會在建置時輸出 200 OK 的 HTML，無法在伺服器端真正回應 HTTP 301。
  - 同時指出專欄多個頁面中存在重複的 SVG 分類圖示條件分支。
- **決策與執行**：
  1. **落地專屬 Nginx 配置檔案 (`nginx/starwoven.conf`)**：
     - 在版控中直接建立專屬 server block 設定檔，明確配置伺服器層級之絕對跳轉：
       ```nginx
       location = /reiki { return 301 /blog/reiki-and-chakras; }
       location = /reiki/ { return 301 /blog/reiki-and-chakras; }
       location = /akashic { return 301 /blog/light-and-akashic-records; }
       location = /akashic/ { return 301 /blog/light-and-akashic-records; }
       ```
     - 整合靜態快取策略（30天 Cache-Control）、Gzip 壓縮與標準安全防護標頭，部屬時直接軟連結至 `/etc/nginx/sites-enabled/starwoven`。
  2. **徹底刪除靜態轉址假檔案**：
     - 刪除 `src/pages/reiki.astro` 與 `src/pages/akashic.astro`，杜絕產出 200 OK 偽轉址檔案，全站純靜態頁面嚴格維持 10 個核心有效頁面。
  3. **重構分類圖示元件 (`src/components/CategoryIcon.astro`)**：
     - 將散落在列表頁、置頂卡片、文章內頁橫幅與推薦閱讀中的 4 處重複 SVG 判斷式，全數收斂至單一共用元件 `CategoryIcon.astro`，大幅提升 DRY 度與未來的可擴充性。

---

## 2026-09-30 — DEC-024：星靈專欄 5 大深度文章 ComfyUI 配圖落地與 WebP 最佳化部署

- **背景**：
  - 星靈專欄（/blog）已建立完善的版面與智慧佔位機制，全站 5 篇深度專文尚待真實專屬情境插圖。
- **決策與執行**：
  1. **ComfyUI 規格定案（1344 × 768 / 1.75:1）**：
     - 採用 SDXL / Z-Image-Turbo 原生 100 萬像素標準橫向解析度 1344 × 768，完美相容列表頁卡片（16:10）與文章內頁寬幅橫幅（16:9 / 21:9）之裁切。
     - 風格統一為靈性水彩手繪、星塵粒子與柔和光暈（Pastel Watercolor & Celestial Glow）。
  2. **自動化後製與 WebP 最佳化（--skip-rembg）**：
     - 使用專案腳本 scripts/process_asset.py 處理，因屬滿版氛圍圖，加入 --skip-rembg 保留完整背景。
     - 統一轉為 WebP（Quality 85, method=6），5 張圖檔總大小僅 ~577 KB（平均每張約 115 KB），兼顧高解析度與 LCP 秒開體驗。
  3. **雙重歸檔與 Markdown 掛載**：
     - 同步歸檔於 demo_docs/sd-assets/ 與生產環境 public/assets/。
     - 更新 5 篇專欄文章之 Frontmatter coverImage 欄位（blog_a_akashic_light_v1.webp ~ blog_e_tarot_mirror_v1.webp）。
     - 更新 demo_docs/image_prompts.md 之素材手冊與生成紀錄表。

---

## 2026-10-01 — DEC-025：頁尾社群列表新增 TikTok（國際版抖音）Favicon 圖標按鈕與首頁佔位設定

- **背景**：
  - 業主與團隊討論期望於全站頁尾（Footer）的社群 Favicon 列表中新增「抖音」圖標，以利後續短影音行銷與社群引流。
  - 台灣一般大眾與商業行銷皆以**國際版 TikTok** 為主（中國版抖音受限於 +86 手機認證與台灣 App Store 下載門檻），因此選用國際版 TikTok 作為標準配置。
  - 目前專屬頻道帳號尚在籌備中，暫無直接網址。
- **決策與執行**：
  1. **導入國際版 TikTok 圓形微互動 Favicon (`src/layouts/Layout.astro`)**：
     - 在頁尾右側社群按鈕列表中，於 YouTube 與 iOpen Mall 之間新增第 6 個社群按鈕：**TikTok**。
     - 採用標準 TikTok 經典音符 SVG 向量圖標，尺寸與既有社群維持 `w-12 h-12 sm:w-14 sm:h-14 rounded-full` 一致規格。
     - 微互動懸停動效：滑鼠懸停時微放大並切換為 TikTok 經典黑底（`hover:bg-black hover:border-black text-[#2E2A4F] hover:text-white`，暗色模式下為 `dark:hover:bg-white dark:hover:text-black`）。
  2. **平台首頁預留佔位（Placeholder）**：
     - 目標連結配置為 `https://www.tiktok.com`（另開新分頁 `target="_blank"`、`rel="noopener noreferrer"`），比照 Facebook、Threads 與 YouTube 採用的佔位策略，後續取得官方帳號 ID 後即可直接置換。
  3. **社群與電商排序收斂**：
     - 頁尾按鈕依序為：**Instagram**、**Facebook**、**Threads**、**LINE**、**YouTube**、**TikTok**、**星靈選物（7-11 iOpen Mall）**，保持社群在前、線上商城在後的清晰層級。

---

## 2026-10-01 — DEC-026：Google Analytics 4 (GA4) 追蹤碼正式導入（代碼 G-27D79HXXF5、獨立元件封裝與核心轉換事件自動監聽）

- **背景**：
  - 業主於 Google 官網完成 GA4 帳戶建立，取得正式評估 ID（Measurement ID）：`G-27D79HXXF5`。
  - 需要將此追蹤碼注入全站各網頁 `<head>` 中，並針對網站之身心靈諮詢與電商導流特性，建立關鍵轉換事件追蹤。
- **決策與執行**：
  1. **獨立元件化封裝 (`src/components/GoogleAnalytics.astro`)**：
     - 建立專屬 Astro 元件，封裝標準 `gtag.js` 載入腳本與設定邏輯。
     - 支援彈性設定：預設支援 `PUBLIC_GA_ID` 環境變數（可由 `.env` 動態覆寫），若未設定環境變數則自動採用正式代碼 `G-27D79HXXF5`，保證開發與生產環境均能順暢運作。
     - 建立 `.env.example` 規範設定項目。
  2. **注入全站佈局 (`src/layouts/Layout.astro`)**：
     - 在全站共用模板 `<head>` 區段中掛載 `<GoogleAnalytics />`，取代原先預留之註解佔位標記。
     - 由於全站採用純靜態多頁面架構（MPA），瀏覽器每次換頁均會自動觸發 GA4 之 `page_view` 事件，無需額外監聽複雜的 SPA 路由生命週期。
  3. **自動化關鍵轉換事件監聽（Automatic Conversion Tracking）**：
     - 在元件內注入輕量全域監聽機制，自動捕捉高價值之業務轉換與外連行為：
       - **`line_consultation_click`**：訪客點擊任一 LINE 預約諮詢按鈕（全站浮動鈕、導航按鈕、課程內預約連結）時自動觸發，帶入按鈕文字與目標連結，利於在 GA4 後台直接設定為重要轉換目標（Key Events）。
       - **`iopenmall_store_click`**：訪客點擊前往星靈選物（7-11 賣場）時自動觸發。
       - **`address_map_click`**：訪客點擊實體地址開啟 Google Maps 導航時自動觸發。
  4. **規格文件同步**：
     - 同步更新 `demo_docs/spec.md`、`demo_docs/phase0_answers.md`、`demo_docs/development_roadmap.md` 及 `AGENTS.md`，將原 GA 佔位標記結案為正式啟用。



---

## 2026-10-01 — DEC-027：師資名稱更換（曉宇更換為學長 / 學長老師）

- **背景**：
  - 依據業主需求，原夥伴／老師「曉宇」全數更換為「學長」。
  - 原稱謂未帶「老師」尊稱者置換為「學長」，原稱謂帶「老師」尊稱者置換為「學長老師」，其餘成員名稱維持不變。
- **決策與執行**：
  1. **首頁 (`src/pages/index.astro`)**：
     - 固定循環課程（週四七脈輪靈氣、週五托特塔羅）授課講師更新為「學長老師」。
  2. **活動與課程頁 (`src/pages/courses.astro`)**：
     - 固定循環課程週四、週五課程講師更新為「學長老師」，課程介紹文案內同步更新為「由學長老師帶領」。
  3. **命理服務頁 (`src/pages/services.astro`)**：
     - 托特塔羅占卜、星盤解析、靈氣調頻之可預約名單由「曉宇」更新為「學長」。
  4. **關於我們團隊頁 (`src/pages/about.astro`)**：
     - 星靈夥伴「關於-E」成員名稱由「曉宇」更新為「學長」。
  5. **專欄文章 (`src/content/blog/reiki-and-chakras.md`)**：
     - 文章作者 frontmatter 與結語課堂說明之講師由「曉宇老師」更新為「學長老師」。
  6. **規格文件同步**：
     - 同步更新 `demo_docs/content_inventory.md` 與 `demo_docs/image_prompts.md` 之文字與形象照說明。

---

## 2026-10-01 — DEC-028：特色主題體驗課程調整（保留梅花易數，移除手作類，新增八字體驗與紫微斗數兩日課）

- **背景**：
  - 業主來訊調整 `/courses`（活動與課程）之主題體驗工作坊：
    1. 保留「塏易學 梅花易數」（仲塏老師）。
    2. 移除原先 3 門手作體驗（獨角獸流體畫、禪繞畫、牌卡調香）。
    3. 新增「八字體驗」（高楷博老師，10/24 14:00-18:00，1,000元/人）。
    4. 新增「紫微斗數工作坊」（阿福老師，11/8、11/15 14:00-17:00 兩日課，單堂 600元 / 兩堂 1,200元/人，雙日獨立主題）。
- **決策與執行**：
  1. **維持 2 欄標準自然排列（方案 B）**：
     - 不採用壓縮卡片寬度的 3×1 擠壓排版，維持大氣之 2 欄寬幅海報大卡片結構（`grid-cols-1 lg:grid-cols-2`）。
     - 第 1 排：梅花易數（左）、八字體驗（右）；第 2 排：紫微斗數工作坊（居左），右側自然留白，為後續擴充第 4 門課保留平滑彈性。
  2. **紫微斗數兩日課綱區塊**：
     - 於卡片內新增 `w.schedule` 渲染機制，優雅展示 Day 1（11/08）與 Day 2（11/15）之日程與主題（預設優雅佔位文字，待業主定案主題後可即時替換）。
     - 費用清楚標示「一堂 600元 · 兩堂 1,200元 / 人」，並加註彈性報名機制。
  3. **八字體驗整合**：
     - 配置標準八字陰陽五行圖示（`icon: 'bazi'`），帶入完整時間、時數、費用與溫暖引言文案。
  4. **規格文件同步**：
     - 同步更新 `demo_docs/content_inventory.md`（Section 3.4）與 `demo_docs/image_prompts.md`（課程海報清單）。

---

## 2026-10-02 — DEC-029：新增夥伴命理師「黎夢」及其專長與對應配置

- **背景**：
  - 依據業主最新指示，新增一位占卜師夥伴「黎夢」，專長項目為「塔羅占卜、金錢靈氣、奧剛金字塔、靈擺調頻、七脈輪療癒」，需整合至命理師介紹之頁面中。
- **決策與執行**：
  1. **關於我們團隊頁面 (`src/pages/about.astro`)**：
     - 於星靈夥伴名冊中新增第 9 位夥伴「黎夢」，配置專屬留圖變數 `imgMemberLimeng`（代號 `關於-L`）。
     - 專長標籤完整載入：`塔羅占卜`、`金錢靈氣`、`奧剛金字塔`、`靈擺調頻`、`七脈輪療癒`。
     - 區塊計數標籤改為動態顯示 `{members.length} 位專業夥伴`，維持響應式優雅流動。
  2. **規格文件同步**：
     - 同步更新 Single Source of Truth 文件 `demo_docs/content_inventory.md`（Section 4.3 團隊成員第 9 位）。
     - 同步於 `demo_docs/image_prompts.md` 登錄素材代號 `[關於]-[圖片 L]`（`about_l_member_limeng_v1.webp`）之規格與生成紀錄表。

---

## 2026-10-02 — DEC-030：移除首頁「命理師介紹」區塊，全站成員介紹集中於「關於我們」頁面

- **背景**：
  - 依據業主最新指示，首頁（Index）的「命理師介紹」區塊予以移除，訪客欲了解星靈團隊師資與夥伴統一導向「關於我們（`/about`）」頁面。
  - 首頁原區位空間規劃於後續改放最新公告、品牌動態或更多實體活動花絮照片。
- **決策與執行**：
  1. **首頁模板清潔 (`src/pages/index.astro`)**：
     - 完整移除 Section 4「命理師介紹」卡片 Grid 容器，首頁底部自然收尾於「學員真實回饋（Testimonials）」輪播區塊與頁尾。
     - 清理 Frontmatter 中未使用的 `imgReaderYiEn`、`imgReaderPiPi`、`imgReaderDaXin` 圖片變數與 `featuredReaders` 陣列，維持程式碼純淨無死碼。
  2. **素材規劃收斂與去重**：
     - 移除首頁重複之命理師素材欄位（`首頁-M`、`首頁-N`、`首頁-O`），師資個人照片統一對應「關於我們」之 `關於-B`（以恩）、`關於-C`（皮皮）、`關於-D`（達心），無需準備兩套重複圖檔。
     - 同步更新 `demo_docs/image_prompts.md` 與 `demo_docs/content_inventory.md`（Section 1.5）。

---

## 2026-10-02 — DEC-031：建立 demo_docs/raw-photos/ 四大分類子目錄與實拍素材標準化歸檔架構

- **背景**：
  - 隨著實拍素材增多（團隊個人照、各課程活動照、工作坊海報、交流會花絮），若全部存放於同一目錄易造成混亂且難以辨識版本。
- **決策與執行**：
  1. **建立 4 大分類子目錄**：
     - `demo_docs/raw-photos/team/`：團隊夥伴與創辦人個人照。
     - `demo_docs/raw-photos/courses/`：週一至週六固定循環課程現場照。
     - `demo_docs/raw-photos/workshops/`：特色主題體驗工作坊海報。
     - `demo_docs/raw-photos/events/`：實體交流會與聚會花絮。
  2. **檔案正名與移動**：
     - 將原 10 張照片移動至 `team/`，並將「達達.png」正名為「達心.png」、「月月.png」正名為「凜月.png」。
  3. **自動化批次腳本升級 (`scripts/process_photo.py`)**：
     - 內建 `TEAM_MAPPING`，針對特殊取景（悠悠、凜月之右上半身特寫）設定專屬 ROI 視窗裁切，支援 `--batch-team` 一鍵批次全自動轉換。
  4. **Git 版控安全設定**：
     - 更新 `.gitignore` 規則為 `demo_docs/raw-photos/**/*`，遞迴忽略所有子目錄中的原始大圖，保留 `.gitkeep` 結構。
---

## 2026-10-02 — DEC-032：活動課程與實體交流會 7 張實拍照片 16:10 取景最佳化與 WebP 上架部署

- **背景**：
  - 業主提供 7 張固定循環課程與實體交流會的現場活動照片，存放在 `demo_docs/raw-photos/courses/`。
  - 原檔中包含數張直式手機拍攝照片（阿卡西 1093×1795、靈氣 1093×1459、生命靈數 866×1445），若直接等比縮小置入前端 16:10 橫式卡片容器，人像與板書會嚴重失焦或被裁切到無效的天花板。
- **決策與執行**：
  1. **直式手機拍圖 16:10 取景最佳化 (ROI Crop)**：
     - `光與阿卡西紀錄.png`：上半部為大面積白色天花板，指定垂直區間 `(0, 480, 1093, 1163)` 裁切出 16:10 畫面，精確收納前方白板、古古老師與全體冥想學員。
     - `七脈輪與靈氣.png`：指定垂直區間 `(0, 320, 1093, 1003)` 裁切出 16:10 畫面，完整呈現教室學員圍坐共振氛圍。
     - `生命靈數.png`：指定垂直區間 `(0, 260, 866, 801)` 裁切出 16:10 畫面，突出皮皮老師講解白板之主體。
  2. **橫式照片與交流會規格對齊**：
     - `占星循環課.jpg`、`偉特塔羅.jpg`、`托特塔羅.jpg` 均為 4:3 橫式，直接等比置中裁切為 16:10（960×600 px）。
     - `命理交流會.png` 指定正圓/方形視窗 `(0, 80, 386, 466)` 裁切為 600×600 px，適配 `/courses` 專屬之 1:1 交流會卡片。
  3. **自動化批次腳本與 WebP 壓制**：
     - 於 `scripts/process_photo.py` 整合 `COURSES_MAPPING`，支援 `--batch-courses` 命令全自動處理。
     - 統一輸出為 WebP Q85，7 張檔案體積介於 19.2 KB ~ 86.1 KB，總體積僅約 388 KB，完美達成 LCP 效能目標。
  4. **全站雙頁面聯動掛載**：
     - `src/pages/courses.astro`：6 大固定循環課程卡片（`imgCourseAkashic` ~ `imgCourseNumerology`）與實體交流會卡片（`imgMeetup`）全面掛載實拍圖。
     - `src/pages/index.astro`：首頁 Section 3 固定循環課表同步引用 `courses_a` ~ `courses_f` 實拍 WebP，告別佔位圖符號。
  5. **規格與生成紀錄文件同步**：
     - 同步更新 `demo_docs/image_prompts.md` 與 `demo_docs/content_inventory.md`。
---

## 2026-10-02 — DEC-033：代碼審查問題修復（process_photo.py 單張與團隊批次參數修正、.gitignore 目錄追蹤規則優化）

- **背景**：
  - 經由代碼審查指出 3 項潛在問題：
    1. `scripts/process_photo.py` 在 `main()` 單張轉檔分支調用 `args.quality`，但 `argparse` 中未宣告 `--quality` 參數，導致單張模式拋出 `AttributeError`。
    2. `scripts/process_photo.py` 在 `batch_team()` 中調用 `process_photo(..., max_size=...)`，但 `process_photo` 簽名為 `target_size`，導致拋出 `TypeError`。
    3. `.gitignore` 中的 `demo_docs/raw-photos/**/*` 會將子目錄視為忽略對象，使得 Git 停止遞迴檢視，導致後續 `!demo_docs/raw-photos/**/.gitkeep` 例外規則無法生效追蹤分類資料夾。
- **決策與執行**：
  1. **修正 process_photo.py 參數與 CLI 宣告**：
     - 在 `argparse` 補充 `--quality` 參數（預設 85）。
     - 將 `batch_team()` 中的 `max_size` 參數名對齊為 `target_size`。
     - 經由實測 `--batch-team`、`--batch-courses` 與單張轉檔 `-i / -o` 命令，全部驗證 100% 執行成功。
  2. **優化 .gitignore 目錄白名單規則**：
     - 加入 `!demo_docs/raw-photos/**/`，允許 Git 進入 `raw-photos/` 底下所有分類資料夾，精確納入各子目錄的 `.gitkeep` 結構。
     - 經由 `git check-ignore` 實測，所有子資料夾內之原始高清大圖（`team/以恩.png`、`courses/光與阿卡西紀錄.png` 等）維持被嚴格忽略，而 `.gitkeep` 正常追蹤。

---

## 2026-10-02 — DEC-034：首頁新增「課程許願池（敲碗開課）」區塊（Demo 版，純前端可先展示）

- **背景**：
  - 業主希望提前看到 `demo_docs/course_wishlist_plan.md` 所規劃之「課程敲碗許願」功能 demo；提供揪團許願類網站截圖作為 UI 參考（卡片含分類標籤、「N 人想上」膠囊、進度條與全寬許願按鈕）。
  - Google 試算表與 Apps Script 後端（企劃書 Step 1–2）尚未部署，故需一個不依賴後端即可展示互動的 Demo 版本。
- **決策與執行**：
  1. **新增共用元件 `src/components/CourseWishlistCard.astro`**：
     - UI 依參考截圖改編並套用品牌色彩：意象區漸層底色＋左上分類標籤＋右上金色「🔥 N 人想上」膠囊；資訊區含課程名稱、企劃講師、「N / M 人許願」進度條（達標轉為 `#58A497` 綠色並顯示「✓ 達標籌備中」）與全寬「✦ 我想一起」按鈕。
     - 完整互動狀態機：樂觀更新（點擊即 +1 並彈跳動畫）→ 傳送中鎖定 → 成功鎖定（金色 `#FCE794` 實心「✓ 已成功許願」＋寫入 `localStorage` 持久化）／失敗回滾（票數退回、琥珀警示「連線稍候，點此重試」、2.5 秒後恢復可重試）；正式模式以 `AbortController` 8 秒逾時保護。
     - 訪客裝置識別碼 `starwoven_client_id`（UUIDv4）與每課 `starwoven_wish_{course_id}` 鎖定旗標均依企劃書規格實作。
  2. **Demo／正式雙模式切換**：
     - 讀取 `PUBLIC_WISHLIST_API_URL`（已於 `.env.example` 新增）。
     - 未設定時為 **Demo 模式**：不發送網路請求，650ms 模擬延遲後視為成功，票數增量存於本機 `starwoven_wish_demo_votes`，重整頁面仍持續累計，供業主展示完整互動。
     - 設定後為**正式模式**：進站自動 `action=get_all` 同步全站票數，投票走 `action=vote&course_id&client_id`，失敗自動回滾。
  3. **首頁掛載位置**：於 `/`（`src/pages/index.astro`）「固定循環課程」卡片 Grid 正下方、「學員心聲」輪播之前新增「✦ 課程許願池」區塊；右上方配置金色「我想許願」按鈕導向 LINE 官方帳號（`@347fucvj`），供訪客提案新課程。
  4. **佔位課程資料**：以 6 門品牌調性佔位課程展示（托特高階解盤、阿卡西深度工作坊、靈氣三階大師班、占星合盤、金錢靈氣、靈數流年），涵蓋未達標與已達標（12/12）兩種視覺狀態；待業主定案欲募集之課程清單後替換，屆時 `id` 需與試算表 A 欄 `course_id` 對齊。
  5. **GA4 事件**：許願成功時送出 `course_wish_click` 事件（含 `course_id` 與 `mode: demo|live`），便於後續觀察敲碗熱度。

---

## 2026-10-02 — DEC-035：許願池代碼審查修復（匿名 client_id 互相擋票、鍵盤繞過 pending 鎖、get_all 競態覆寫）

- **背景**：
  - 外部 AI 代碼審查對許願池功能（DEC-034）提出 3 項 P1 問題，經逐條驗證判定全部成立並採納修復；審查同時確認 Apps Script 後端（tryLock、快取、速率限制、前後端合約）、`.env.example` 與 Tailwind 動態 class 保留均無問題。
- **決策與執行**（`src/components/CourseWishlistCard.astro`）：
  1. **修復匿名 `client_id` 共用導致互相擋票**：
     - 原實作在 localStorage 停用時回傳固定字串 `anonymous`，後端快取會讓第一位投票的無儲存權限訪客擋住其後所有同類訪客（誤判 `already_voted` 達 6 小時）。
     - 改為抽出 `generateUUID()`，localStorage 不可用時生成**本頁面工作階段專屬**的隨機 UUID（模組層級 `sessionClientId`），不再共用固定值。
  2. **pending 鎖定改用 `disabled` 屬性**：
     - 原實作僅以 CSS `pointer-events: none` 鎖定，已聚焦按鈕仍可用 Enter／Space 觸發 click，造成重複加票與並行請求。
     - `setBtn()` 改操作 `HTMLButtonElement.disabled`（pending／voted 時為 `true`），同步阻擋滑鼠、觸控與鍵盤；並新增每卡 `data-pending` in-flight 旗標，程式化觸發亦被忽略。CSS 移除多餘的 `pointer-events` 宣告，補 `:disabled` 游標樣式。
  3. **修復 `get_all` 競態覆寫與回滾失真**：
     - 原實作中進站 `get_all` 的較慢回應可能在使用者投票後才返回，以舊票數覆寫樂觀更新；失敗回滾又從被覆寫的值再 -1，畫面憑空少一票。
     - `vote()` 改為先快照投票前票數（`before`），失敗回滾直接還原快照；`get_all` 回應處理略過 `pending` 中或本機已投票的卡片。

---

## 2026-10-02 — DEC-036：許願池第二輪審查修復（localStorage 停用時 get_all 殘留競態）

- **背景**：
  - 外部 AI 第二輪複審確認 DEC-035 三項修復全數通過（含瀏覽器實測連按 Enter／Space 票數僅 +1 並維持鎖定），但發現 1 項殘留競態：localStorage 停用時 `hasVoted()` 恆為 `false`，正式模式投票成功後 `pending` 旗標已清除，延遲抵達的 `get_all` 舊回應仍可穿透守衛、覆寫剛同步的最新票數。
  - 影響範圍有限（僅無儲存權限訪客、僅顯示層失真、下次載入即恢復），但修復成本極低，予以採納。
- **決策與執行**（`src/components/CourseWishlistCard.astro`）：
  1. **新增每卡記憶體旗標 `data-voted`**：初始化時由 `hasVoted()` 映射、投票成功（Demo／正式模式）時設定；「本頁已投票」狀態不再以 localStorage 為唯一判斷來源。
  2. **`get_all` 回應守衛改以記憶體旗標為準**：略過條件由 `hasVoted()` 改為 `data-pending`／`data-voted`，localStorage 停用情境下同樣成立。
  3. **`vote()` 入口守衛雙重保險**：同步檢查 `data-voted`，防止任何路徑對已投票卡片重複送票。

---

## 2026-10-02 — DEC-037：許願池第三輪審查修復（already_voted 回應保留幻影 +1）

- **背景**：
  - 外部 AI 第三輪複審以 mock API 實測重現：本機投票旗標遺失（清除 localStorage 或換瀏覽器）但後端 6 小時快取仍記得該 `client_id` 時，`already_voted` 回應未附帶票數，前端保留樂觀更新的 +1——實際票數 8，畫面卻鎖定在 9。
- **決策與執行**（`src/components/CourseWishlistCard.astro`）：
  1. **拆分 `success` 與 `already_voted` 回應分支**：`already_voted` 視為「本次未新增票數」，還原投票前快照（`before`）後再鎖定為已許願狀態，消除幻影 +1。
  2. **GA4 事件區分**：`already_voted` 情境之 `course_wish_click` 事件以 `mode: 'already_voted'` 標記，不與真實新增票數混淆。
  3. **不採納後端連動修改**：未採「Apps Script 在 `already_voted` 回應附上總票數」之替代方案——此邊界情境罕見、失真僅顯示層且重整即恢復，相較重新部署後端版本之作業成本，投入產出不成比例；前端快照還原已可正確修復。

---

## 2026-10-02 — DEC-038：課程許願池 v2「全面試算表驅動」前端實作（編號格子制 1~6＋認名字機制）

- **背景**：
  - v1 許願池（DEC-034 ~ DEC-037）僅票數會進站同步，課程清單、門檻、講師等內容寫死於 `src/pages/index.astro`，業主（不寫程式）異動需委託重新 build 部署。
  - 依 `demo_docs/course_wishlist_plan_v2.md`（v2.5 定稿，經四輪外部審查全數採納修正）實作前端，Google 試算表成為許願池唯一資料來源（SSOT）：業主改試算表、網頁重整即更新，不需重新部署。
  - 業主定調：Apps Script 全量重寫、前端**不保留 v1 相容層**（乾淨易維護優先；網站未正式上線，無過渡期問題）；計票定位為開課意向熱度參考，微小誤差可接受。
- **決策與執行**（`src/components/CourseWishlistCard.astro` ＋ `src/pages/index.astro`）：
  1. **編號格子制**：SSR 課程 `id` 由英文語意 id 改為 `'1'`~`'6'`，對應試算表 A 欄數字格子；格子可重用（募完換課：改 B 欄課名、D 欄清零）。
  2. **認名字機制（一票綁定「編號＋課名」）**：localStorage `starwoven_wish_{編號}` 由 `'true'` 改存**課程名稱**；已許願判定 = 儲存值 === 卡片當前課名（根元素新增 `data-course-name` 作為唯一來源）。改名即新課，所有人（含投過舊課者）自動解鎖可重新許願。
  3. **結構掛勾與動態卡片同構**：元件補上 `wish-title`／`wish-teacher`／`wish-category`／`wish-icon`／`data-wish-hero` 掛勾；`index.astro` Grid 加 `data-wish-grid`，並新增 `<template id="wish-card-template">` 內嵌一份實際渲染的佔位卡片——動態卡片一律 clone 模板，與 SSR 卡片永遠同構，未來改外觀只需改元件檔一處。
  4. **`syncFromSheet(list)` 全量同步**：`get_all` 回傳陣列依列序處理——既有卡片 `updateCardContent`、新列 `createCard`、不在清單中的卡片隱藏（重新出現可還原）；每張以 `appendChild` 歸位，**DOM 順序 = 試算表列順序**。回應 `data` 非陣列（後端未更新）時整段略過，維持 SSR 顯示（防禦性檢查，非相容層）。
  5. **綁定投票與「回應先比對、再分支」**：`vote()` 從 `data-course-name` 快照課名隨請求送出 `course_name`；回應抵達先比對回應課名與卡片**當前**課名，不一致（含後端主動回傳 `course_changed`）→ 回滾、清 pending、**不寫記憶、不鎖定**、重新 `get_all` 同步後可對新課許願；一致才走 `success`／`already_voted` 分支，且只以後端確認過的課名寫入 localStorage。
  6. **配色白名單 `STYLE_MAP`**：六組漸層（pink/blue/teal/purple/gold/orange）以完整 class 字串常駐元件 script（Tailwind v4 內容掃描保證收進 CSS bundle）；替換時先移除白名單全部漸層再加上新值。非法鍵值：既有卡片保留原樣、新卡片預設 `blue`。
  7. **既有防護原樣保留**：樂觀更新、失敗回滾快照、`disabled`＋`data-pending` 雙鎖、`data-voted` 記憶體旗標、8 秒逾時、票數守衛（pending／voted 不覆寫票數）。
  8. **規格精神內的順序調整**：`updateCardContent` 先更新課名並執行認名字判定（改名即解鎖），再套用票數守衛——改名後的卡片已視為新課，票數正常同步，避免已解鎖的新課卡片殘留顯示舊課票數。
  9. **GA4**：`course_wish_click` 事件參數改為 `{ course_id, course_name, mode }`，`mode` 新增 `course_changed` 情境值。
- **後續待辦（業主側，依文件第五節）**：Step 1 試算表 A2:A7 改數字編號、H1:K7 貼上講師／分類／圖示／配色；Step 2 Apps Script 整段取代並部署新版本（網址不變）；完成後依 Step 5 清單驗收。

---

## 2026-10-03 — DEC-039：許願池 v2 前端審查修復（get_all 亂序回應防護、改名期間逾時不回填舊課快照）

- **背景**：
  - commit 前外部 AI 對 v2 前端實作（DEC-038）做代碼審查，提出 2 項 P1，經逐條驗證判定成立並採納；其餘重點（template clone 同構、textContent 無注入路徑、localStorage 停用降級、樂觀更新／回滾／雙鎖／逾時等既有防護）均確認正常。
- **決策與執行**（`src/components/CourseWishlistCard.astro`）：
  1. **同步請求序號防亂序（P1）**：初始進站的 `get_all` 與 `course_changed` 觸發的重新同步可能併發，fetch 回應順序不受保證，較舊回應可能覆寫較新的課程名稱、票數與排序。`refreshFromSheet()` 加入遞增序號 `syncSeq`，僅採用「最後一次發出」之回應，過期回應直接忽略（其成本僅為該次同步不套用，下次進站即恢復，與既有「get_all 失敗維持現狀」哲學一致）。
  2. **改名期間失敗不回填舊課快照（P1）**：投票 pending 中若 `get_all` 已將卡片更新為新課，舊投票請求逾時／失敗時原 `catch` 會把舊課的投票前票數寫回新課卡片且不重新同步，造成新課卡片長時間顯示舊課票數。現於 `catch` 先比對快照課名與卡片當前 `data-course-name`：不一致時僅解除 pending、按鈕回預設、重新 `get_all` 同步，不回填快照、不進入重試態（此路徑不發 GA 事件——逾時下投票是否入帳無從得知，不記為 `course_changed`）。

---

## 2026-10-03 — DEC-040：許願池 v2 前端審查第二輪修復（course_changed 路徑改為條件式回滾）

- **背景**：
  - 外部 AI 複查確認 DEC-039 兩項修復有效，但發現 1 項殘留 P1：`course_changed` 路徑（含回應課名與卡片當前課名不符之情形）仍**無條件**將舊課的投票前票數快照回填。若投票等待期間 `get_all` 已將卡片換成新課，舊課票數會寫進新課卡片；若隨後的重新同步又失敗，新課將持續顯示舊票數直至重整。
- **決策與執行**（`src/components/CourseWishlistCard.astro`）：
  1. `course_changed` 分支改為**條件式回滾**：僅當卡片仍顯示快照課名（`get_all` 尚未更新卡片）時才還原樂觀 +1；卡片已是新課則不回填快照，僅解除 pending、按鈕回預設、重新 `get_all` 同步——與 DEC-039 之 `catch` 路徑修法完全一致，三條「課名不符」路徑（後端主動回傳、回應比對不符、逾時失敗）行為自此統一。

---

## 2026-10-03 — DEC-041：許願池 v2 前端審查第三輪修復（改名同步當下即套用新課票數）

- **背景**：
  - 外部 AI 第三輪複查確認 DEC-039／DEC-040 修復有效、三條課名不符路徑的回滾判定已一致，但發現最後 1 項殘留 P1：投票 pending 中 `get_all` 把卡片換成新課時，票數守衛（DEC-036）因 `data-pending` 存在而不套用新課的 `total_votes`，而三條不符路徑又一律「不回填」——若後續重新同步失敗，新課卡片會停留在「舊課票數 +1」的樂觀數字直至重整。
- **決策與執行**（`src/components/CourseWishlistCard.astro`）：
  1. `updateCardContent` 票數守衛新增例外：本次同步發生課名變更（`nameChanged`）時視為新課，直接套用 `row.total_votes`——畫面上的 pending 樂觀 +1 屬於舊課，對新課無意義；課名未變時守衛行為完全不變（DEC-036 保護不受影響）。
  2. 與前兩輪修復的銜接：稍後抵達的舊投票回應走課名不符路徑時本就不回填票數，與此例外不衝突。

---

## 2026-10-04 — DEC-042：團隊夥伴「達心」更名為「達達」、「凜月」更名為「月月」，服務技能「寵物溝通」正名為「毛孩溝通」並同步全站服務師資

- **背景**：
  - 業主最新指示：
    1. 將團隊夥伴「達心」正式更名為「達達」。
    2. 將團隊夥伴「凜月」正式更名為「月月」。
    3. 專長技能中的「寵物溝通」統一正名為「毛孩溝通」。
    4. 依據業主提供之服務項目師資清單，調整各項目可預約人員：
       - 塔羅占卜：以恩、悠悠、學長、達達（維持偉特/托特體系分組）
       - 星盤解析：皮皮、以恩、學長、古古
       - 生命靈數：皮皮
       - 八字命理：達達
       - 靈氣與光調頻（原靈氣調頻更名）：以恩、皮皮、學長、達達、古古、月月、白白
       - 阿卡西紀錄：以恩、古古
       - 毛孩溝通：以恩、古古
- **決策與執行**：
  1. **關於我們團隊頁面 (`src/pages/about.astro`)**：
     - 星靈夥伴名冊中「達心」更名為「達達」（`about_d_member_daxin_v1.webp` 頭像路徑維持，註解與顯示名更新）。
     - 星靈夥伴名冊中「凜月」更名為「月月」（`about_h_member_linyue_v1.webp` 頭像路徑維持，註解與顯示名更新）。
     - 創辦人以恩之技能標籤「寵物溝通」更新為「毛孩溝通」。
     - 夥伴古古之專長標籤補上「毛孩溝通」，與服務項目可預約人員對齊。
  2. **命理服務頁面 (`src/pages/services.astro`)**：
     - 「靈氣調頻」更名為「靈氣與光調頻」，可預約人員擴充為以恩、皮皮、學長、達達、古古、月月、白白 7 位。
     - 「阿卡西紀錄」可預約解讀師加入以恩（共以恩、古古 2 位）。
     - 偉特塔羅與八字命理可預約師資名稱同步更新為「達達」。
  3. **專欄文章與規格文件同步**：
     - `src/content/blog/reiki-and-chakras.md`：作者與結語師資「達心老師」同步更名為「達達老師」。
     - `src/content/blog/light-and-akashic-records.md`：助教「凜月老師」同步更名為「月月老師」。
     - `demo_docs/content_inventory.md`：更新服務項目與團隊名冊之師資名稱、技能標籤與服務清單。
     - `demo_docs/image_prompts.md`：更新素材排版備註與採用紀錄表中夥伴之稱呼。

---

## 2026-10-04 — DEC-043：夥伴「姆姆」形象照片最佳化裁切、WebP 轉換與「關於我們」頁面正式上架

- **背景**：
  - 業主於 `demo_docs/raw-photos/team/姆姆.jpg` 提供星靈夥伴「姆姆」（可愛橘白奶油貓）之實拍高解析原檔（2719 × 1943，1.4 MB）。
  - 原檔中主體偏右且左下角有一筆記本雜物邊緣，若直接取正中會使頭像失焦或露出雜物，且在圓形頭像容器中比例過小。
- **決策與執行**：
  1. **ROI 取景框最佳化裁切**：
     - 在 `scripts/process_photo.py` 中為 `姆姆.jpg` 配置專屬取景視窗 `(430, 100, 1830, 1500)`（1400 × 1400 像素正方）。
     - 精確聚焦於姆姆生動的面部表情、琥珀眼珠與自然前爪，完全避開左下角筆記本邊緣，在 269×269 圓框內展現居中美感。
  2. **高效能 WebP 壓縮與典藏同步**：
     - 輸出為 `about_g_member_mumu_v1.webp`（600 × 600 px，品質 Q85，method=6），檔案大小由 1.4 MB 降至 85.9 KB（體積縮減 93.8%）。
     - 同步典藏至 `demo_docs/sd-assets/` 與上線目錄 `public/assets/`。
  3. **頁面與文件連動**：
     - `src/pages/about.astro`：`imgMemberMumu` 正式指向 `/assets/about_g_member_mumu_v1.webp`，取代原有的 SVG 佔位符。
     - `demo_docs/image_prompts.md`：更新 `關於-G` 項目之生成紀錄表狀態為「採用上架」。


---

## 2026-10-05 — DEC-044：頁尾 YouTube 連結更新為官方專屬頻道

- **背景**：
  - 頁尾（Footer）之社群 Favicon 列表中，YouTube 圖示原採平台首頁佔位連結（`https://www.youtube.com`）。
  - 業主提供星靈織語專屬官方 YouTube 頻道連結：`https://www.youtube.com/channel/UCw30YbjMjchOx-lAYGfQUoQ`。
- **決策與執行**：
  1. **全站頁尾組件 (`src/layouts/Layout.astro`)**：
     - 將 YouTube 圖示連結替換為 `https://www.youtube.com/channel/UCw30YbjMjchOx-lAYGfQUoQ`。
     - 無障礙標籤 `aria-label` 更新為「前往星靈織語 YouTube 官方頻道」，按鈕提示 `title` 更新為「YouTube: 星靈織語 Starwoven」。
  2. **文案總清單 (`demo_docs/content_inventory.md`)**：
     - 同步更新 0.2 節官方社群 Favicon 連結清單，將 YouTube 由平台首頁佔位標示為「官方頻道：星靈織語 Starwoven」。


---

## 2026-10-05 — DEC-045：頁尾 TikTok 連結更新為官方專屬帳號

- **背景**：
  - 頁尾（Footer）之社群 Favicon 列表中，TikTok 圖示原採平台首頁佔位連結（`https://www.tiktok.com`）。
  - 業主提供星靈織語專屬官方 TikTok 帳號連結：`https://www.tiktok.com/@starwoven2026?_r=1&_t=ZS-9AH4nldT20a`（ID: `@starwoven2026`）。
- **決策與執行**：
  1. **全站頁尾組件 (`src/layouts/Layout.astro`)**：
     - 將 TikTok 圖示連結替換為 `https://www.tiktok.com/@starwoven2026?_r=1&_t=ZS-9AH4nldT20a`。
     - 無障礙標籤 `aria-label` 更新為「前往星靈織語 TikTok 官方帳號」，按鈕提示 `title` 更新為「TikTok: @starwoven2026」。
  2. **文案總清單 (`demo_docs/content_inventory.md`)**：
     - 同步更新 0.2 節官方社群 Favicon 連結清單，將 TikTok 標示為「官方帳號 `@starwoven2026`」。


---

## 2026-10-05 — DEC-046：「關於我們」創辦人與夥伴頭像支援純淨超連結跳轉

- **背景**：
  - 「關於我們」頁面（`/about`）中之創辦人與星靈夥伴頭像原先為純展示容器（`<div>`），點擊無跳轉動作。
  - 業主期望能埋入每位老師個人的社群平台或主頁連結（如 IG 等），且風格要求簡約純粹、不添加小圖標等額外裝飾，僅需單純點擊圖片即可跳轉目標 URL。
- **決策與執行**：
  1. **資料結構擴充 (`src/pages/about.astro`)**：
     - `Person` 介面新增可選欄位 `link?: string`。
  2. **簡約純粹的頭像跳轉互動**：
     - 若有填寫 `link`，大圓形頭像容器自動以 `<a>` 標籤渲染，配置 `target="_blank" rel="noopener noreferrer"` 與 `cursor-pointer`。
     - 滑鼠懸停時微放大（`hover:scale-105`）與柔和陰影回饋，完全不疊加額外的小 IG 圖示或徽章，維持極簡美感。
     - 若未填寫 `link`，維持標準 `<div>` 展示，無縫兼顧靈活性。


---

## 2026-10-05 — DEC-047：頁尾撤下 Threads 社群圖示（官方帳號遭封禁）

- **背景**：
  - 星靈織語官方 Threads 帳號遭平台封禁，業主指示頁尾（Footer）暫不顯示 Threads 圖示與連結，避免訪客點擊造成困惑。
- **決策與執行**：
  1. **全站頁尾組件 (`src/layouts/Layout.astro`)**：
     - 移除 Threads 圖示與 `https://www.threads.net` 連結。
     - 頁尾社群 Favicon 列表更新為 6 項：Instagram、Facebook、LINE、YouTube、TikTok、iOpen Mall。
  2. **文案總清單 (`demo_docs/content_inventory.md`)**：
     - 0.2 節官方社群 Favicon 清單中標記 Threads 已依指示撤下。


---

## 2026-10-06 — DEC-048：專案文件全面同步（AGENTS.md 重寫、spec.md 與 development_roadmap.md 對齊現況）

- **背景**：
  - `AGENTS.md` 仍停留在建置前狀態（宣稱無 `package.json`、無原始碼、無 git 歷史、IA 為 6 大頂層路由、`decisions.md` 不存在等），與實際 repo 嚴重落差，會誤導接手 agent。
  - `demo_docs/spec.md` 的 IA（第 3 節）、內容需求（第 5 節）與風險表（第 9 節）部分過時；`demo_docs/development_roadmap.md` 多數 Phase checkbox 未隨實際進度更新。
- **決策與執行**：
  1. **重寫 `AGENTS.md`**：更新為建置後現況——實際路由表（含 `/blog`，並註明 `/reiki`、`/akashic`、`/shop` 已移除及對應 DEC 編號）、共用元件清單、深淺色雙主題與硬編碼色碼慣例、素材管線（`scripts/process_asset.py`、`process_photo.py`）、文件優先級（`decisions.md` 最高）、多 agent 協作規範與部署現況（以 `nginx/starwoven.conf` 為準）。
  2. **同步 `demo_docs/spec.md`**：狀態標頭改為 v0.2（Demo 已交付，後續以 `decisions.md` 為準）；第 3 節 IA 改為實際路由（含 DEC-019/020/023/004 差異註記）；第 5 節標記 `content_inventory.md` 已建立（DEC-001）；第 9 節除第 3 項 OpenAI 授權確認外逐項結案；修正檔內殘留之 Windows 絕對路徑連結（第 7 節與文末「交付文件」）為相對路徑。
  3. **同步 `demo_docs/development_roadmap.md`**：狀態標頭改為 v0.3；Phase 2–4 checkbox 依實際完成狀態勾選（Logo／星空背景以 inline SVG＋CSS 漸層實現、生圖以本機 ComfyUI 為主等差異均加註）；Phase 5 僅勾選可驗證之完成項（build、nginx 配置檔、GA4），實際 VPS 部署、DNS、HTTPS 與 Phase 6 維持未勾選。
  4. **更新 `known_issues/README.md`**：第 3 項（首頁檔案過長）更新行數與已拆分元件之現況，維持「後續優化」狀態；新增第 4 項（全站 OG 分享圖檔案尚未存在）。
  5. **文件優先級定調**：`decisions.md` ＞ `content_inventory.md`（文案）＞ `phase0_answers.md` ＞ `spec.md`。
  6. **外部審查回饋修正（同批變更，與上述同步提交）**：
     - 更正「OpenAI 雲端未使用」之誤述：`服務-G` 毛孩溝通素材實為 OpenAI Playground 生成（`image_prompts.md` 生成紀錄），文件改為「以 ComfyUI 為主、曾使用 OpenAI Playground」，roadmap Phase 2 授權確認項恢復為未完成。
     - 更正「每頁獨立 OG 圖」之誤述：各頁未傳 `ogImage`，共用之 Layout 預設 `/assets/og-image.jpg` 尚未存在；`AGENTS.md`、roadmap Phase 4、spec 第 6 節據實標記，並新增 `known_issues` 第 4 項追蹤。
     - `AGENTS.md` 元件章節標題修正為含 `src/layouts/`；文件優先級排序與本檔第 5 項統一。
  7. **外部審查第二輪回饋修正（同批）**：
     - `spec.md` 第 4.4 節前提、第 8 節授權與第 9 節風險表第 3 項一併修正：素材為本機 ComfyUI 生成＋OpenAI Playground 個別素材（`服務-G`）＋業主實拍；OpenAI 商用條款結論仍待確認，第 9 節該項改標 ⚠️ 部分待確認。
     - `known_issues` 第 4 項 OG 圖檔名改為 `og-image.webp` 以符合全站 WebP 強制規範，並註明實作時需同步更新 `Layout.astro` 預設 `ogImage` 路徑。


---

## 2026-10-06 — DEC-049：「課程許願池」自首頁獨立為 `/wishlist` 分頁並加入主導航

- **背景**：
  - 業主反映首頁「課程許願池」區塊內容偏多，且未來許願課程可能持續增加，會使首頁過長。
  - 業主指示：將許願池獨立為導航列分頁，首頁移除該區塊；經討論後首頁保留一個小型跳轉入口連結（位於原區塊位置），方便滑到該處、對許願池有興趣的訪客順手前往。
- **決策與執行**：
  1. **新增 `/wishlist` 路由（`src/pages/wishlist.astro`）**：
     - 沿用內頁版型（預設淺色主題由 `Layout.astro` 自動生效），頁頭為金色「敲碗開課・集氣許願」膠囊＋h1「課程許願池」＋說明文案。
     - 原首頁之 `wishlistCourses` SSR fallback 資料、卡片 Grid（`data-wish-grid`）、`<template id="wish-card-template">`、「我想許願」LINE 按鈕與免責說明全數遷入；`CourseWishlistCard.astro` 元件**零修改**（僅更新一處註解中的檔名參照），投票／同步／Demo 模式邏輯不受影響。
  2. **首頁（`src/pages/index.astro`）精簡**：
     - 移除許願池資料陣列、section 與 template（檔案由約 889 行降至 768 行）。
     - 原位置改放小型膠囊入口連結：「✦ 想看看大家正在敲碗什麼課？前往「課程許願池」一起集氣 →」，導向 `/wishlist`，深淺主題皆適配。
  3. **主導航（`src/components/Navbar.astro`）**：`navLinks` 新增 `{ name: '課程許願池', href: '/wishlist' }`（位於「活動與課程」與「星靈專欄」之間），桌面版與行動版選單自動同步；經估算 5 個項目在 1024px 斷點仍可單行容納，間距維持 `gap-6 xl:gap-8` 不變。
  4. **文件同步**：更新 `AGENTS.md`（路由表、nav 清單、元件說明）、`demo_docs/spec.md` 第 3 節 IA、`known_issues/README.md` 第 3 項（首頁行數與拆分現況）、`demo_docs/content_inventory.md`（新增第 8 節登錄 `/wishlist` 全頁文案與 SSR fallback 課程資料，並於 1.7 登錄首頁入口連結文案；審查回饋後補登）。
- **備註**：許願池 Google 試算表後端、`PUBLIC_WISHLIST_API_URL`、localStorage 計票 key 皆為 origin 層級，遷移頁面無需任何後端或環境變數調整；若日後需再拆分（如獨立子路由），屆時另記 DEC。


---

## 2026-10-07 — DEC-050：課程許願池欄位調整（G 欄 status 接上 UI 作手動下架開關、I 欄 category 改為 price 預定價格）

- **背景**：
  - 業主盤點許願池試算表欄位後確認兩項調整：G 欄 `status` 原僅供內部管理，需接上 UI 作為手動下架開關（募集結束的課想暫時下架、已開課的課想停止集氣）；I 欄 `category`（分類標籤）實際用不到，改為 `price`（預定價格）自由文字，原樣顯示於卡片左上角標籤。
  - K 欄 `style`（卡片配色）功能確認正常，本次維持不變。
- **決策與執行**：
  1. **G 欄 status 手動下架開關（純前端實作，Apps Script 的 status 部分零改動——`get_all` 本來就有回傳）**：
     - `已結束`（trim 後完全一致比對）→ 卡片 `display: none` 隱藏下架；不清除任何資料，**清空該格即恢復上架**。
     - `已開課` → 卡片保留顯示，但按鈕停用並顯示「✓ 已開課」（`BtnState` 新增 `'closed'`、`is-closed` 綠色樣式 `#58A497` 白字）、隱藏「✓ 達標籌備中」標籤、`vote()` 入口加守衛禁止送票。
     - 空白或其他值 → 視同募集中，「✓ 達標籌備中」仍由票數 ≥ 門檻自動推導。
     - 關鍵值以常數 `STATUS_OPENED`／`STATUS_ENDED` 定義於 `CourseWishlistCard.astro` script；新增 `applyStatus(card)` 統一管理卡片 display 與按鈕態——`syncFromSheet` 不再直接還原顯示（已結束卡片即使仍在清單中也維持隱藏）；`updateCardContent` 於 `renderCard` **之後**呼叫（避免達標標籤被重新顯示），`createCard` 於 `initCard` **之後**呼叫（closed 狀態蓋過 `refreshVotedState` 的按鈕判定）。
  2. **I 欄 category → price（預定價格）**：自由文字原樣顯示（如「4 堂 2,000 元」），取代卡片左上角原分類標籤（同位置同深色膠囊樣式，掛勾 class `wish-category` 改名 `wish-price`）；留空 → 新卡片隱藏標籤、既有卡片保留原值（沿用既有「空字串不覆寫」同步慣例）。SSR fallback 六門課 `price` 一律留空**不虛構**，SSR 標籤以 `class:list` 條件隱藏，待業主在試算表 I 欄填入後由 `get_all` 覆寫。
  3. **Apps Script key 改名（需業主部署新版本）**：`get_all` 的 JSON key `category` → `price`（仍讀第 9 欄），其餘程式碼零更動；Web App 網址不變、`.env` 不用改。部署前後短暫不一致期間，前端收不到 `price` key → 既有卡片標籤保留現值、不壞畫面。
  4. **文件同步**：`demo_docs/course_wishlist_plan_v2.md` 加 v2.6 修訂沿革、欄位總表 G／I 欄說明、業主操作規則第 7 條（status 關鍵值須完全一致）、H~K 貼上區塊標題列改 `price`、Apps Script 程式碼 key 改名、第四節前端設計補 status 行為說明、第五節新增 Step 7（業主操作）與 Step 8（驗收）；`demo_docs/content_inventory.md` §8.4 表格「分類」欄改為「預定價格（試算表 I 欄）」，6 列標示（待業主填入）。
- **業主側待辦**：① 試算表 I1 標題由 `category` 改為 `price`（程式依欄位位置讀取，改標題不影響運作）；② I 欄填入各課預定價格（自由文字）；③ Apps Script 貼上規劃書第三節新版程式碼並部署**新版本**；完成後依規劃書第五節 Step 7／8 驗收。

---

## 2026-10-07 — DEC-051：許願池規格書整併為 v3.0（`course_wishlist_plan_v3.md` 取代 v2），試算表 I1 標題改名完成

- **背景**：
  - 業主已完成試算表 I1 標題由 `category` 改為 `price`（原 v2 規劃書 Step 7 的第一項；程式依欄位位置讀取，改標題不影響運作）。
  - 業主指示文件整併：不再以增量修訂維護 `demo_docs/course_wishlist_plan_v2.md`，改以「當前基準規格書」`demo_docs/course_wishlist_plan_v3.md`（v3.0 定稿）直接取代；`course_wishlist_plan.md`（v1）保持不動。
- **決策與執行**：
  1. **新建 `demo_docs/course_wishlist_plan_v3.md`（v3.0 定稿）**：整併 v2 全部有效內容（含 v2.6 之 G 欄 status 手動下架開關、I 欄 price 預定價格）——設計原則（試算表 SSOT、一票綁定「編號＋課名」、入帳原則）→ 試算表結構（A~K 最新欄位總表、配色白名單、業主操作規則含 status 關鍵值）→ Apps Script 完整現行版程式碼（JSON key 為 `price`、status 註解為手動下架開關；已 diff 核對與 v2 版僅標頭註解之差，供業主直接複製部署新版本）→ 前端設計摘要（以 `CourseWishlistCard.astro`／`wishlist.astro` 為準，不全文複述）→ 實施與驗收清單（已標完成：v2 Step 1~3、DEC-050 前端、I1 改名；未完成：I 欄填價格、Apps Script 部署新版本、build 上傳 VPS、瀏覽器驗收含 status 開關四項）→ 已知取捨。v2「修訂沿革」不搬移（歷史見本檔），檔頭以一行沿革摘要帶過；已失效的一次性操作（H~K 貼上區塊、A2:A7 改編號）不再收錄；驗收措辭中的「首頁」一併更正為許願池頁面（DEC-049 遷移後的現況）。
  2. **刪除 `demo_docs/course_wishlist_plan_v2.md`**。
  3. **引用更新**：`demo_docs/spec.md` 第 6 節預留銜接點表中許願池的「詳見 `course_wishlist_plan.md`」更新為 `course_wishlist_plan_v3.md`（原指向已被取代的 v1）；本檔 DEC-034/038/050 等歷史條目對 v1/v2 檔名的引用**保持原樣**（歷史紀錄不改寫）。其餘非歷史文件（`AGENTS.md`、`content_inventory.md`、`development_roadmap.md`、`known_issues/README.md`）經 grep 確認本無 plan 檔引用，無需更動。
- **後續待辦（業主側，依 v3 第五節）**：I 欄填入各課預定價格 → Apps Script 貼上第三節現行版程式碼並部署**新版本** → build 上傳 VPS → Step 9 瀏覽器驗收。

---

## 2026-10-07 — DEC-052：許願池 SSR fallback 改為骨架卡＋載入失敗錯誤區塊（移除寫死課程）

- **背景**：
  - 部署驗收期間業主同步更新試算表，課程由 6 門擴為 8 門且課名全面更新，使 `wishlist.astro` 寫死的 6 門 SSR fallback 首屏即過期（known_issues 第 5 項）。
  - 討論後定調：動態建卡路徑（clone `<template>`）已實證可行，與其反覆追同步寫死內容，不如讓「壞掉就真的顯示壞掉」，避免讀者被過期資訊誤導。
- **決策與執行**：
  1. **SSR 移除寫死課程**：刪除 `wishlist.astro` 的 `WishlistCourse` interface 與 `wishlistCourses` 陣列；Grid 改渲染 6 張骨架卡（`data-wish-skeleton`，`animate-pulse` 灰階佔位塊，等比例仿卡片版型，深淺雙主題）。
  2. **同步路徑單一化**：所有課程卡片一律由 `createCard` clone 模板建立（單一版型來源）；`syncFromSheet` 首次成功時以 `removeSkeletons()` 移除骨架卡（重複呼叫無害）。
  3. **載入失敗錯誤區塊**：新增 `#wish-error`（預設隱藏，「許願池暫時連線異常」文案＋重新整理按鈕）與 `<noscript>` 提示；`refreshFromSheet` 加 12 秒逾時（Apps Script 冷啟動可達 10 秒級）。逾時／網路錯誤／回應格式異常**且頁面尚無任何課程卡片**時才顯示錯誤區塊；已有卡片的背景再同步失敗仍靜默維持現狀。
  4. **Demo 模式資料搬入元件 script**：示範課程常數 `DEMO_COURSES`（沿用原 SSR 六門內容，僅未設 API 網址時使用）經同一 `syncFromSheet` 建卡。正式 build 因 `PUBLIC_WISHLIST_API_URL` 已編譯為非空字串，`!API_URL` 分支被 minifier 死碼移除——已分別驗證「無環境變數 build」（demo 資料進 bundle）與「正式 build」（無 demo 資料、含 API 網址）。
  5. **文件同步**：`course_wishlist_plan_v3.md` 第一節設計原則、第四節前端設計（SSR fallback 條目改寫為骨架卡＋錯誤區塊、Demo 模式條目改寫、掛勾補 `data-wish-skeleton`／`#wish-error`）、第五節 Step 9 驗收增列三項、第六節已知取捨兩項改寫；`known_issues/README.md` 第 5 項改標 ✅ 已解決。
- **備註**：純前端變更，Apps Script 與試算表零改動。驗證：`npm run build` 通過（11 頁）；`dist/wishlist/index.html` 含 6 張骨架卡與 `#wish-error`、不再含舊課名；正式 bundle 含 API 網址且不含 demo 資料。
- **踩坑紀錄（同批修正）**：初版本地預覽只剩骨架卡不動——Astro 會把元件 `<script>` 標籤插在元件首次使用處；元件僅被 `<template>` 使用時，腳本落入 `<template>` 內成為 inert 永不執行（此前因 SSR 實體卡片存在，腳本標籤位於模板外而倖免）。修正：互動邏輯原樣抽出為 `src/scripts/wishlist.ts`，由 `wishlist.astro` 頁面層級 `<script>` 引入；已驗證打包後 script 標籤位於模板外、`<template>` 內無 script。

---

## 2026-10-07 — DEC-053：許願池 vote 後端補 G 欄狀態檢查（程式碼審查 P1 修正）

- **背景**：外部程式碼審查回報 P1 缺陷——DEC-050 的 G 欄 status 手動下架開關僅前端實作（按鈕停用＋`vote()` 入口守衛），Apps Script 收票流程全程不讀 G 欄：訪客舊分頁（頁面載入後業主才標已開課）或直接呼叫公開 vote 端點，仍可對已開課／已結束課程加票，下架開關在後端形同虛設。
- **評估結論**：屬實，採納。威脅模型雖低（無預期惡意攻擊），但「舊分頁送票」無需惡意即自然發生；修正僅十餘行且完全位於既有排他鎖與入帳原則之內，風險極低，並讓 DEC-050 的開關語意完整（前後端一致）。
- **決策與執行**：
  1. **Apps Script（`course_wishlist_plan_v3.md` 第三節，v3.2）**：`findRow()` 加讀 G 欄（trim 後比對）；新增步驟 2.6 鎖內狀態檢查（版本核對之後、防重複／限流之前）——`已開課`／`已結束` 回傳 `course_closed`（附 `course_status` 實際值與對應文案），不計票、不記已投、不占限流額度；原步驟 2.6~2.10 順延為 2.7~2.11，標頭功能摘要同步補述。
  2. **前端（`src/scripts/wishlist.ts`）**：`vote()` 新增 `course_closed` 分支——回滾樂觀 +1、清 pending、不記已投，依後端 `course_status` 即時把卡片轉停投（`STATUS_OPENED`）或下架（`STATUS_ENDED`，沿用 `applyStatus`）；後端未附狀態值時保守視同已開課；卡片已被 `get_all` 換課時不干預、交由重新同步。GA4 `course_wish_click` 的 `mode` 新增 `course_closed`。
  3. **雜項**：移除 `CourseWishlistCard.astro` 檔尾多餘空行（審查以 `git diff --check` 回報）。
  4. **文件同步**：v3 規格書沿革摘要、第一節 G 欄說明、第二節業主操作規則第 7 條、第四節投票回應分支與 GA4 mode 值、第五節 Step 4 補充與 Step 9 驗收增列一項。
- **業主側待辦**：Apps Script 貼上第三節新版程式碼 →「部署 → 管理部署作業 → ✏️ 編輯 → 版本：新增版本 → 部署」（**Web App 網址不變，`.env` 無需修改；勿刪除重建部署**）。新前端搭配舊後端不受影響（舊後端本無 `course_closed` 回應）；部署後依 Step 9 新增項驗收。

---

## 2026-10-07 — DEC-054：許願池 vote 寫入前核對補讀 G 欄（程式碼審查第二輪 P1）

- **背景**：第二輪審查指出 DEC-053 的狀態檢查留有殘餘競態——`target.status` 由 2.4 `findRow()` 快照，2.6 判定後到 2.10 寫入之間，業主仍可改 G 欄而該票照舊入帳；且 2.9 寫入前核對只重讀 A、B 兩欄，移列後 `findRow()` 重定位取得的新快照狀態亦未再判定。
- **評估結論**：屬實，採納。實際空窗僅毫秒級（遠小於 DEC-053 處理的舊分頁情境），但修正同樣低廉（一次讀取由 2 欄改 7 欄），並一併補上移列重定位路徑未判定狀態的邏輯缺口。
- **決策與執行**：
  1. **Apps Script（`course_wishlist_plan_v3.md` 第三節，v3.3）**：2.9 寫入前核對由 `getRange(row, 1, 1, 2)` 改為 `getRange(row, 1, 1, 7)` 一次讀 A~G——編號、課名核對邏輯不變；新增 `finalStatus`，以本次讀取（或移列重定位後的最新快照）為準，緊貼寫入前再判 `已開課`／`已結束` 並回傳 `course_closed`。2.6 早期檢查保留（先於防重複／限流，且讓舊分頁重複送票情境優先回 `course_closed` 而非 `already_voted`，前端能把卡片即時轉停投）。殘餘取捨：2.9 讀取與 2.10 `setValue` 分屬兩次 API 呼叫，中間極小空窗在 Apps Script 下無法原子化，已於程式註解標明。
  2. **前端零改動**（`course_closed` 處理已於 DEC-053 就緒）。
  3. **文件同步**：v3 規格書沿革摘要（v3.3）、§三標頭功能摘要第 5 點、第五節 Step 4 補充 2。
- **業主側待辦**：與 DEC-053 相同——貼上第三節新版程式碼並部署**新版本**（兩版修正可一次部署完成，Web App 網址不變、`.env` 不變）。

---

## 2026-10-08 — DEC-055：許願池卡片版型調整——價格移至講師下方資訊區、新增 I 欄 duration 課程時數

- **背景**：
  - 業主回饋下一版需求：預定價格 UI 不要放在意象區左上角標籤；另需新增「課程時數」欄位，純文字、業主在試算表自由填寫描述，格式不寫死。
  - 討論中曾評估配色（原 K 欄 style）開放自訂色碼，因漸層雙色選擇負擔、格式驗證與可讀性約束等複雜度，本次不做，維持白名單鍵值。
- **決策與執行**：
  1. **試算表新增 I 欄 `duration`（課程時數）**：插入於 H（講師）與原 I（價格）之間，price／icon／style 順延為 J／K／L 欄；自由文字（如「4 堂 × 2 小時」），留空則卡片該行整行不顯示。
  2. **前端（`CourseWishlistCard.astro`／`wishlist.ts`／`wishlist.astro`）**：移除意象區左上角價格膠囊；講師行下方依序新增「課程時數｜…」與「課程費用｜…」兩行純文字（掛勾 `wish-duration`／`wish-price`，`hidden` 改掛整行 `<p>`，腳本以 `closest('p')` 切換顯示）；`SheetRow` 新增 `duration`；`updateCardContent` 空字串保留原值不覆寫、`createCard` 留空整行隱藏（沿用既有同步慣例）；骨架卡資訊區補兩行佔位對齊新版型；Demo 模式示範課程補 `duration` 示意值。
  3. **Apps Script（v3 規格書第三節，v3.4）**：`get_all` 新增 `duration` key（讀第 9 欄），`price`／`icon`／`style` 改讀第 10／11／12 欄；vote 路徑只讀 A~G，零改動。
  4. **文件同步**：`course_wishlist_plan_v3.md` 沿革摘要（v3.4）、欄位總表（新增 I 欄、J~L 順延、價格顯示位置改述）、業主操作規則第 3 條（F~K → F~L）、Apps Script 程式碼與標頭摘要（H~K → H~L）、第四節掛勾與欄位同步說明、第五節 Step 4 補充 3／Step 6~7 改寫／Step 9 驗收改寫並增列時數項；`content_inventory.md` §8.4 示範課程表新增「課程時數」欄。
- **業主側待辦**：~~① 試算表插入 I 欄 `duration` 並填入各課時數（J 欄預定價格一併補齊）；② Apps Script 貼上第三節現行版程式碼並部署**新版本**~~——**2026-10-08 兩項皆已完成**，已透過 API 實測確認（get_all 含 `duration` 且各欄對位正確、vote 驗證邏輯正常）；完成後依 v3 第五節 Step 9 驗收。
- **審查回饋採納（2026-10-08）**：外部審查指出 Step 6（插欄）先於 Step 7（部署）會讓舊腳本讀到錯位欄位；評估後確認「對調順序」同樣錯位（欄位依位置讀取，兩動作必然綁定），正解為**單一維護窗口緊接執行**——已於 v3 規格書 Step 7 下補警示，本次因網站未上線、窗口內無實際讀者，風險可忽略。
