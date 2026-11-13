# 已知問題

以下項目為 Demo 內容或外部設定待確認事項，非程式設計問題。

## 1. 固定循環課程價格不一致

- **狀態**：✅ 已解決（2026-09-29 由業主定案）
- **影響位置**：首頁與「活動與課程」頁
- **說明**：原首頁文案顯示「包 4 堂 1800 元」與部分課程頁「包月四堂 2000 元」存在前後矛盾，且單堂收費語意不夠明確。
- **處理結果**：業主正式定案——固定循環課程統一為每期 **4 堂 2000 元**（採包月制，必須以月為單位報名，不開放單堂單堂上課）。已同步更新 `decisions.md`（DEC-005）、`content_inventory.md`、首頁及活動課程頁面。

## 2. LINE 社群卡片連結待補

- **狀態**：✅ 已解決（2026-09-29 由業主定案）
- **影響位置**：全站頁尾（Footer）
- **說明**：原頁尾包含 4 張 QR Code 卡片（包含待補邀請連結之 LINE 社群卡片）。
- **處理結果**：業主正式定案——移除頁尾所有 QR Code 大卡片，簡化為 5 大社群 Favicon 圖示按鈕（Instagram、Facebook、Threads、LINE、YouTube），並將 Google Map 地標導航連結移至左方地址按鈕。原待補之 LINE 社群卡片已隨版面重構一併移除，關閉此項待辦。

## 3. 首頁元件與內容資料待拆分

- **狀態**：後續優化
- **影響位置**：`src/pages/index.astro`
- **說明**：首頁目前同時包含素材設定、課程與評價資料、各區塊版型及樣式，檔案現約 768 行（許願池卡片與整個許願池區塊已於 DEC-049 遷出至 `/wishlist` 分頁，但課程、評價等資料陣列與各 section 版型仍在頁面內）。Demo 階段結構仍易讀，但持續增加內容後會降低維護效率。
- **處理方式**：
  1. 將課程卡、評價卡等重複版型拆成可重用元件（許願池卡已拆分，可比照辦理）。
  2. 將課程價格、報名連結、人物資料與素材路徑集中至單一資料檔。
  3. 後續加入內容格式驗證或基本檢查，避免跨頁資訊不一致。

## 4. 全站 OG 分享圖檔案曾缺失

- **狀態**：✅ 已解決（2026-11-13）：ComfyUI 生成底圖＋程式疊字，上架 `public/assets/common_b_og_image_v1.jpg`，Layout 預設值改指向此檔並輸出完整網址；格式採 JPG 之理由見 DEC-091。
- **影響位置**：全站各頁（`src/layouts/Layout.astro` 預設 `ogImage = '/assets/common_b_og_image_v1.jpg'`）
- **說明**：各頁面未個別傳入 `ogImage`，原共用預設圖檔不存在，社群平台（LINE／Facebook）抓取分享縮圖時會 404。
- **處理結果**：已產出 1200×630 品牌 JPG，並上架至 `public/assets/common_b_og_image_v1.jpg` 與 `demo_docs/sd-assets/`。Layout 以此為預設值，透過完整絕對網址輸出 `og:image` 與 `twitter:image`；JPG 是全站 WebP 規範的唯一例外（DEC-091）。

## 5. 許願池 SSR fallback 與試算表最新課程清單未同步

- **狀態**：✅ 已解決（2026-10-07，DEC-052）
- **影響位置**：`src/pages/wishlist.astro`（原 `wishlistCourses` SSR fallback，已移除）
- **說明**：2026-10-07 部署驗收時，試算表課程已由 6 門擴充為 8 門且課名全面更新（業主持續編輯中），SSR 寫死的 6 門 fallback 首屏即過期。
- **處理結果**：不做追蹤同步，改從根本移除寫死內容——SSR 改為骨架卡佔位（`data-wish-skeleton`），課程卡片全部由前端 clone 模板動態建立；API 初始載入失敗時顯示「許願池暫時連線異常」錯誤區塊（`#wish-error`），不顯示過期資訊（DEC-052）。殘留：`demo_docs/course_wishlist_plan_v3.md` 內「1~6」編號敘述與配色白名單表「目前使用課程」欄仍為舊清單，待業主清單定稿後一併校訂。

## 6. 網站無 404 頁面，nginx 以首頁作為錯誤網址 fallback；靜態資產長快取

- **狀態**：後續優化（2026-10-20 VPS 現況調查發現，DEC-073）
- **影響位置**：`src/pages/`（無 `404.astro`）、`nginx/starwoven.conf`（`location /`、靜態資產快取）
- **說明**：
  1. 線上 nginx 之 `location /` 為 `try_files $uri $uri/ /index.html`，任何錯誤網址皆回傳首頁且狀態碼 200（SEO 上屬 soft 404）。repo 原版為 `=404`，但網站沒有 404 頁，直接改回會顯示 nginx 預設錯誤頁。DEC-073 nginx 整併時刻意保留線上行為，避免於業主會議前改變既有頁面表現。
  2. 線上靜態資產快取為 `expires 1y`＋`immutable`，套用於所有圖片（含檔名不帶 hash 之 `public/assets/`）。同名覆蓋時訪客最長一年看不到新圖——現行以素材版本號命名（`_v2`、`_v3`）規避，**換圖必須升版號**。
- **處理方式**：
  1. 新增品牌風格 `src/pages/404.astro`，nginx 改為 `try_files $uri $uri/ $uri/index.html =404;`＋`error_page 404 /404.html;`。
  2. 評估將 `immutable` 長快取限縮至 `/_astro/`（檔名含 hash），`/assets/` 改為較短快取。

## 7. nginx 全域 `ssl_protocols` 宣告與實際行為不符

- **狀態**：待全域設定清理時處理（非本站範圍；2026-10-21 維運實測，DEC-073）
- **影響位置**：VPS `/etc/nginx/nginx.conf`（`http {}` 全域，影響同主機 4 個站台）
- **說明**：全域宣告 `ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;`，看似開放 TLS 1.0／1.1；實測（`openssl s_client -tls1_1 -cipher 'DEFAULT@SECLEVEL=0'`）starwoven、exopolitics、noeticseeker 三站皆回 `alert protocol version` 遭伺服器拒絕——VPS 之 OpenSSL 3.0.13 編譯期預設最低版本為 TLS 1.2，nginx 宣告值實際無效。**安全性無虞（實際只提供 TLS 1.2／1.3）**，但設定檔具誤導性。
- **處理方式**：日後整理全域設定時，將宣告改為 `TLSv1.2 TLSv1.3` 使文件與實際一致（影響全部站台，需另立 DEC 並經主機維運同意）。本站 vhost 不另行宣告（no-op）。

## 8. 活動與課程頁深色模式切換過渡期白底白字與 WCAG AA 對比度未通過

- **狀態**：第 1 點暫不處理、第 2、3 點已解決（2026-11-13～14，見下方處理方式）；另有殘留項目見「後續」（2026-10-26 審查回饋發現）
- **影響位置**：`src/pages/courses.astro`（活動與課程頁面）
- **說明**：
  1. **主題動態切換過渡（Transition Timing）**：
     全站卡片配置了 `transition-all duration-300` / `transition-colors duration-300`。點擊 Navbar 主題切換按鈕的一瞬間（$t=0\text{ ms}$），`<html>` 即刻加入 `.dark` 類別，部分未具 transition 的文字瞬間轉為深色白字（如 `#ffffff`、`dark:text-white/85`），但卡片背景與頁面主背景仍在進行 300ms 平滑漸變（仍停留在淺色 `#EAF3F8` 與 `bg-white/85`）。此時自動化測試（如 axe、Playwright）或瞬間視線會捕捉到「白字疊在淺色背景上」，對比度低至 1.01:1。
  2. **既有色彩對比度（WCAG AA 4.5:1）**：
     即使等待 300ms 動畫結束（背景已轉為深紫夜空 `#2E2A4F`），axe 仍會回報約 31 處色彩對比度未達 WCAG AA 4.5:1 標準：
     - 主題行動按鈕配白字：`bg-[#80A9D4] text-white`（對比度約 2.45:1，如「報名交流會」、「私訊報名」、「點選報名詢問」）。
     - 週一至週六粉彩星期彩標：`#80A9D4`、`#9880B8`、`#58A497`、`#E08D5B` 等底色搭配白字（對比度約 2.5~3.5:1）。
     - 深色次要文字：`dark:text-white/50`（對比度約 3.8:1，如「採包月小班制・滿班即止」）、`dark:text-[#8FB8E8]` 老師標籤等。
- **處理方式**：
  1. ~~切換主題時可暫時掛載 `disable-transitions` 類別（於主題切換腳本中暫時關閉過渡），避免自動化工具或快速切換時出現暫態白底白字。~~ **暫不處理**（2026-11-13）：實際操作肉眼幾乎察覺不到，主要是自動化工具在切換瞬間才抓得到；而修正會讓切換主題失去 300ms 漸變、改為瞬間換色。除非業主或使用者反映，否則維持現狀。
  2. ~~微調淡藍按鈕（`#80A9D4`）與各星期標籤的字體顏色（改採深色字體以達 4.5:1），或將深色模式下的按鈕背景適度調深。~~ ✅ 已解決（2026-11-14，開發者以並排預覽比較後採方案 A）：
     - **按鈕（全站）**：月光藍實心底一律改配深夜空色字 `#2E2A4F`（5.48:1），懸停底色由加深 `#6b97c4` 改為變淡 `#9DBDE0`（6.91:1）。範圍為 `CTAButton`（primary／nav／hero，星芒圖示改隨文字色）、許願池卡片按鈕與錯誤重整按鈕、塔羅與占星抽卡之開始與重試按鈕、課程頁「私訊報名」、交流會「參加費用」標示，以及循環課程報名按鈕與塔羅／占星「再抽一次」次要按鈕（`.tarot-secondary-btn`／`.ac-secondary-btn`，頁內 `<style>`）的懸停態。未改月光藍品牌色本身。
     - **星期標籤**：改為不透明淡色底＋同色系深字＋原色 1px 細框（`ring-1`），六色皆約 4.6:1；疊在照片上亦清楚。
  - **後續**（未處理，非本項原列範圍）：淡藍文字 `#80A9D4`（淺色底上約 2.3:1），如課程頁老師標籤、手風琴標題，以及塔羅／占星「再抽一次」按鈕平常狀態之淡藍字框；`CTAButton` 未使用之 `outline` 變體；許願池卡片「已開課」狀態 `#58A497` 底白字（2.93:1）。
  3. ~~將深色次要弱化文字（`dark:text-white/50`）提升至 `dark:text-white/70` 以上，確保通過 WCAG AA 檢測。~~ ✅ 已解決（2026-11-13）：「採包月小班制・滿班即止」、交流會照片說明、「採單場預約報名制」、工作坊費用備註（`feeNote`）、「報名費用」五處，深色統一 `dark:text-white/70`（卡片上約 5.8:1）；淺色同批文字原 `text-[#3A3A3A]/60` 亦僅約 3.5:1，一併改為 `/75`（約 5.3:1）。分隔符「｜」屬裝飾，維持原狀。

## 9. 型別檢查（`astro check`）未納入專案、缺 Node 型別定義

- **狀態**：✅ 已解決（2026-11-13）：devDependencies 新增 `@astrojs/check`、`typescript@^6`、`@types/node@^24`，新增 `npm run check`；`npm ci` 後為 0 errors、0 warnings、0 hints（`src/content.config.ts` 之 `z` 已改自 `astro/zod` 匯入，原 `astro:content` 匯出將於 Astro 8 移除）。`imgWorkshopBazi` 已刪除。屬工具調整，未立 DEC；TypeScript 固定 6 之理由記於 `AGENTS.md` Commands。
- **影響位置**：`package.json`（devDependencies、scripts）；回報錯誤之檔案為 `src/lib/ai/server/quota.ts`、`src/lib/ai/server/http.ts`（`Buffer`）、`src/pages/api/tarot/reading.ts`、`src/pages/api/astro-cards/reading.ts`（`node:crypto`）
- **說明**：
  1. 專案未宣告 `@astrojs/check`，`npx astro check` 會要求臨時安裝，各次執行環境不一致，過去 DEC 記錄之「0 errors」無法在乾淨環境重現。
  2. 以臨時套件執行（`npx -p @astrojs/check -p typescript@^6 astro-check --root .`）時，升級前後皆為 4 errors，全部是找不到 `node:crypto`／`Buffer` 之型別——專案未安裝 `@types/node`。**不影響建置與執行**（`npm run build` 不做型別檢查），但型別檢查結果失去參考價值，真正的型別錯誤可能被淹沒。
  3. `@astrojs/check` 0.9.x 之 peer 為 `typescript ^5 || ^6`，**不支援 TypeScript 7**；未指定版本時 npm 會取 7 而安裝失敗（ERESOLVE）。
  4. 另有 1 則警告：`src/pages/courses.astro` 之 `imgWorkshopBazi` 宣告未使用（DEC-078 八字體驗下架後殘留）。
- **處理方式**：
  1. devDependencies 新增 `@astrojs/check`、`typescript@^6`（待 `@astrojs/check` 支援 7 再升）、`@types/node`（版本對應 VPS Node 主版本 24）。
  2. `package.json` 新增 `"check": "astro check"`，確認乾淨環境（`npm ci` 後）為 0 errors，並於 `AGENTS.md` Commands 補上 `npm run check`。
  3. 視需要清除 `imgWorkshopBazi` 等未使用變數。
  4. devDependencies 不影響 VPS：`deploy.sh` 之 `/opt/starwoven-app` 以 `npm ci --omit=dev` 安裝；但 repo 目錄之 `npm ci` 會一併安裝，build 時間略增。

## 10. 身心靈療癒新項目（天使靈氣、亢達里尼靈氣）服務資料與老師專業領域待補

- **狀態**：✅ 已解決（2026-11-12 業主提供資料）
- **影響位置**：`src/pages/services.astro`（`services` 陣列服務-H／服務-I）、`src/pages/about.astro`（古古專業領域）、`demo_docs/content_inventory.md`（第 1.2、2.1a、2.2、4.3 節）
- **說明**：首頁「身心靈療癒／一對一體驗」卡片列出「天使靈氣」「亢達里尼靈氣」，但命理服務頁原無對應卡片，DEC-089 先以佔位卡片上架，待業主提供資料。
- **處理結果**：業主確認兩項各自獨立成服務，預約形式與收費比照「靈氣與光調頻」（工作室面對面療癒，30分鐘 800元 · 60分鐘 1500元，無超時規則）；天使靈氣由古古、亢達里尼靈氣由學長提供。服務頁移除佔位標示；關於我們頁古古專業領域補上「天使靈氣」（學長原已列「亢達里尼靈氣」）。兩張卡片插圖已於 2026-11-13 上架（服務-H／服務-I，見 `demo_docs/image_prompts.md`）。

## 11. 首頁不再出現「實體交流會」字樣，待業主確認是否需要補回

- **狀態**：✅ 已解決（2026-11-12 業主指示）
- **影響位置**：`src/pages/index.astro`（`coreServiceCards` 第 3 張「課程與活動」）、`src/pages/courses.astro`（`courseSections` 與專區標題）
- **說明**：DEC-089 改版後首頁第 3 張卡片項目為「循環課程、體驗課程、主題工作坊」，不再列出交流會；且與 `/courses` 分類按鈕（固定循環課程／實體交流會／主題體驗課程）用詞不一致。
- **處理結果**：業主指示兩頁統一為「循環課程／實體交流會／主題工作坊」。首頁「體驗課程」改為「實體交流會」；`/courses` 分類按鈕與專區標題同步更名（錨點 `#recurring`、`#meetup`、`#workshops` 不變），DEC-088 已改寫。

## 12. 占星循環班「舊生複訓 1.5 小時 300 元」語意待業主確認

- **狀態**：✅ 已解決（2026-11-12 業主確認）
- **影響位置**：`src/pages/courses.astro`（`recurringCourses` 占星循環班之 `extraNotes`）、`demo_docs/content_inventory.md` 第 3.2 節
- **說明**：業主指示原文為「占星循環課可以加上 複訓1.5小時300元」，頁面備註寫作「舊生複訓：1.5 小時 300元」，其中「僅限舊生」為開發者依語意判斷。
- **處理結果**：業主確認現行文字無誤，維持不變。此定價相對其他課程偏低，為業主刻意之商業取捨，非誤植，日後勿當作錯誤「修正」。

## 13. 靈擺調頻（服務-J）預約形式、分類與方案待業主確認

- **狀態**：待業主確認（2026-11-13 上架）
- **影響位置**：`src/pages/services.astro`（`services` 陣列服務-J、`serviceCategories`）、`demo_docs/content_inventory.md` 第 2.1a、2.2 節
- **說明**：業主 2026-11-12 訊息只提供「靈擺調頻 夢夢 15分鐘 300元」。「夢夢」即黎夢（開發者已確認），網站沿用關於我們頁的「黎夢」，未改名。下列為開發者暫定值：
  1. 分類放在「身心靈療癒」。
  2. 預約形式寫「工作室面對面療癒」（是否另有通話語音？）。
  3. 只列 15 分鐘 300 元、不寫超時規則（是否有 30／60 分鐘方案或超時計費？）。
  4. 首頁「身心靈療癒／一對一體驗」卡片未加列此項（DEC-089 只要求首頁項目在服務頁有對應卡，反向不強制）。
- **其他**：卡片插圖已於 2026-11-13 上架（服務-J，見 `demo_docs/image_prompts.md`），但依開發者草案提示詞生成，畫面尚未經黎夢老師確認。

## 14. 「靈氣與光調頻」更名為「臼井靈氣」後之連帶事項待業主確認

- **狀態**：待業主確認（2026-11-13 更名上架）
- **影響位置**：`src/pages/services.astro`（服務-E）、`src/pages/index.astro`（`coreServiceCards` 第 2 張「身心靈療癒」）、`src/pages/about.astro`（古古專業領域）
- **說明**：業主指示將服務-E「靈氣與光調頻」更名為「臼井靈氣」，已更名。下列兩項暫維持原狀：
  1. **首頁「光的課程」失去對應服務卡**：首頁身心靈療癒卡片列「臼井靈氣」「光的課程」，原本皆可對應「靈氣與光調頻」；更名後「光的課程」在服務頁無對應卡片，違反 DEC-089「首頁項目在服務頁須有對應卡片」。待業主決定首頁移除此項，或另立「光的課程」服務卡。
  2. ~~**古古列為臼井靈氣調頻師，但關於我們頁未列此專長**~~ ✅ 已解決（2026-11-13）：古古保留於服務-E，關於我們頁專業領域補上「臼井靈氣」。
