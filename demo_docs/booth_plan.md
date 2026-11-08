# 星靈織語 Starwoven — 星靈出攤（首頁出攤公告）規格書 v0.2

> **文件狀態**：v0.2，設計審查通過；**已實作、已完成部分本機驗收（見 DEC-085；其餘第七節第 2 小節項目部署後補驗），待部署（Step 6）**（2026-11-08）。提示卡文案仍為佔位，待業主定稿（不阻塞上線）。已登錄 DEC-085。
> **建立日期**：2026-11-08
> **沿革摘要**：業主經常於外部市集擺攤，活動接洽成功之通知具時效性，經由開發者改程式碼、重新部署的流程太慢；希望業主自行於 Google 試算表更新，首頁即時呈現。經開發者與 AI 討論後整理為 v0.1。v0.2 依 v0.1 之設計審查（3 項 P2）及其覆核（2 項建議）修訂：後端驗證第 1 列標題（`SHEET_SCHEMA_MISMATCH`）、GA4 只送連結網域、補列 Apps Script 單點故障之接受標準與依失敗原因分流之處置流程。各項採納與取捨見**第十一節**。
> **核心目標**：首頁 Hero 原「品牌三大核心特色」三張卡片（DEC-060，AI 生成之 Demo 文案）**移除**，改為「星靈出攤」區塊——內容由 Google 試算表驅動，**業主改試算表、訪客重整網頁即更新，不需重新部署**。
> **技術路線**：沿用課程許願池（`course_wishlist_plan_v3.md`）已驗證之架構——Google Apps Script＋試算表為 SSOT，前端以 JSONP 讀取（DEC-067）；**只讀不寫**，許願池之投票、鎖、防重複、寫入核對等機制一律不需要。

---

## 一、 設計原則

1. **試算表 SSOT、只讀**：出攤資訊全部由試算表驅動，網站 SSR 不寫死任何活動；訪客端只讀取，不寫入試算表。
2. **人工維護責任**：**不做自動下架**（無結束日期欄位）。活動結束後由業主清除該列；網站不判斷資訊是否過期，避免為非必要功能增加維護複雜度。
3. **版面跟著資料走**：只顯示有填寫的格子，依活動數量自動排版；**不重複顯示「敬請期待」佔位格**。無任何活動時以單一提示卡呈現。
4. **壞掉也不難看、但查得到**：載入中顯示佔位框；載入失敗時對訪客靜默改顯示提示卡（不顯示錯誤訊息）。「載入失敗但實際有活動」時訪客會看到提示卡而非活動——此風險為採用本架構時業主即接受之取捨，提示卡文案（如「敬請期待」）不要求於此情境下仍完全正確。失敗原因須留下可追查之紀錄（GA4 事件＋瀏覽器主控台警告，第五節第 5、7 小節），供業主詢問時排查（第十節）。
5. **業主看到什麼、網頁就顯示什麼**：後端讀取儲存格的**顯示文字**（`getDisplayValues()`），避免試算表將 `2026/11/21`、`12:00` 自動轉為日期／時間型別後，程式讀出時區錯亂之字串。
6. **一個功能一個試算表檔案**：與許願池、星靈扭蛋各自獨立（故障、權限、部署互不影響）。
7. **不捏造內容**：提示卡文案由業主定稿；本文件與程式中之文案為佔位。

---

## 二、 範疇

### 1. 包含

- 首頁 Hero 文字區下方之三張品牌特色卡片移除，原位置改為「星靈出攤」區塊（小標題＋活動卡片）。
- 新試算表「星靈出攤」＋新 Apps Script Web App（`action=get_all`）。
- 前端 `src/scripts/booth.ts`（由 `index.astro` 頁面層級 `<script>` 引入）。
- 活動卡片可選填外部連結（主辦方 FB／IG 貼文等），整張卡片可點擊、另開新分頁。
- GA4 事件 `booth_link_click`、`booth_load_error`。
- 新環境變數 `PUBLIC_BOOTH_API_URL`。

### 2. 明確不做

- 自動下架、日期排序、日期格式驗證（原則 2、5）。
- 圖片／海報上傳（海報由連結導向主辦方貼文即可）。
- 超過 3 場活動之顯示、輪播或「更多活動」頁。
- 後端快取（`CacheService`）——資料量極小，且業主要求即時生效；如實測冷啟動過慢再評估（見第九節）。
- Demo 示範資料：未設定 API 網址時直接顯示提示卡，不編造示範活動。

---

## 三、 試算表結構（「星靈出攤」試算表，`Booth` 工作表）

### 1. 欄位

| 欄 | 標題（第 1 列） | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| A | `主題` | ✅ | 活動名稱。**留空＝這一格不顯示**（整列略過） |
| B | `日期` | | 自由文字，原樣顯示（如 `2026/11/21-11/22`）；留空則該行不顯示 |
| C | `時間` | | 自由文字（如 `12:00-18:00`）；留空則該行不顯示 |
| D | `地點` | | 自由文字（如 `高雄美麗島商圈`）；留空則該行不顯示 |
| E | `連結` | | 主辦方活動頁／FB／IG 貼文網址。限 `https://` 或 `http://` 開頭；留空或格式不符 → 卡片照常顯示但不可點擊 |

- **第 1 列標題須與上表完全一致**（`主題`／`日期`／`時間`／`地點`／`連結`，前後空白不計）。後端每次讀取都會核對；不一致（如誤刪、插入欄位或改標題）即回傳 `SHEET_SCHEMA_MISMATCH`，首頁整區改顯示提示卡並留下錯誤紀錄——**寧可不顯示，也不顯示欄位錯位的日期、時間或地點**。
- **只讀第 2～4 列**（三格），依列順序顯示；第 5 列以下一律不讀。
- 中間可以空列：例如只填第 2、4 列，網頁顯示兩張卡片。
- 長度上限（防呆；正常使用不會觸及）：A～D 欄超過 100 字由後端截斷；E 欄網址最長 2,000 字，**不截斷**——超過或格式不符即不設連結（截斷網址會產生錯誤連結）。
- E 欄支援兩種填法：**直接貼網址**，或以「插入連結」將網址掛在文字底下（如格子顯示「FB 貼文」）——後端顯示文字不是網址時，改讀儲存格內之超連結。

範例（業主提供）：

| | A 主題 | B 日期 | C 時間 | D 地點 | E 連結 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2 | 巫呼呼市集－秋喜童話 | 2026/11/21-11/22 | 12:00-18:00 | 高雄美麗島商圈 | （選填） |
| 3 | | | | | |
| 4 | | | | | |

### 2. 業主操作規則（可原樣貼到試算表的說明分頁）

1. **新增出攤**：在第 2～4 列任一空列填入主題、日期、時間、地點，有活動貼文就把網址貼在「連結」欄。網頁重整後幾秒內出現。
2. **活動結束**：把那一列的內容整列清除（主題清空即不顯示）。⚠️ 網站不會自動下架過期活動，請記得清除。
3. **調整順序**：整列剪下、貼到想要的位置（第 2 列顯示在最前面）。
4. **最多 3 場**：第 5 列以下不會顯示。
5. **日期、時間照你想顯示的樣子打字即可**，格子裡看到什麼，網頁就顯示什麼。
6. **不要改第 1 列標題、不要插入或刪除欄位**：程式依欄位位置（A～E）讀取，並會核對第 1 列標題；一旦不符，首頁出攤區會整區改顯示提示卡（防止日期、地點錯位顯示）。改回原標題即恢復。
7. **工作表名稱請保持 `Booth`**。

---

## 四、 Apps Script（整段貼上）

> 部署方式：試算表 →「擴充功能 → Apps Script」→ 貼上以下程式碼 →「部署 → 新增部署作業 → 類型：網頁應用程式」，**執行身分：我**、**存取權：任何人** → 取得 Web App 網址（填入 `PUBLIC_BOOTH_API_URL`）。
> ⚠️ **日後更新程式碼**請用「部署 → 管理部署作業 → ✏️ 編輯 → 版本：新增版本 → 部署」，**Web App 網址不變**。切勿「刪除後重新部署」——網址會更換，須同步更新本機與 VPS 之 `.env` 並重新 build（許願池曾發生兩次，見 `course_wishlist_plan_v3.md` 第五節）。

```javascript
/**
 * 星靈織語 Starwoven — 星靈出攤 Google Apps Script（只讀）
 *
 * get_all：讀取 Booth 工作表第 2~4 列（A~E 欄），回傳主題非空之列（依列順序）
 * - 先核對第 1 列標題（主題／日期／時間／地點／連結），不符回傳 SHEET_SCHEMA_MISMATCH，
 *   防止欄位被插入／刪除後靜默顯示錯位資訊（與資料列一次讀取，不增加讀取次數）
 * - 以 getDisplayValues() 讀取顯示文字：日期／時間格子不受試算表自動型別轉換影響
 * - E 欄顯示文字不是網址時，改讀儲存格超連結（支援「插入連結」填法）
 * - JSONP：帶合法 callback 參數時回傳 JavaScript（同許願池 DEC-067），否則純 JSON
 */

var SHEET_NAME = "Booth";
var HEADERS = ["主題", "日期", "時間", "地點", "連結"]; // 第 1 列標題（須完全一致）
var SLOT_COUNT = 3;  // 只讀第 2~4 列
var COL_COUNT = 5;   // A~E
var MAX_LEN = 100;   // 文字欄位截斷長度
var MAX_URL_LEN = 2000;

// 統一回應出口（與許願池相同）：callback 名以識別字白名單驗證，避免注入任意 JavaScript
function respond(e, json) {
  var cb = e && e.parameter ? e.parameter.callback : null;
  if (cb && /^[a-zA-Z_$][a-zA-Z0-9_$]{0,98}$/.test(cb)) {
    return ContentService.createTextOutput(cb + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function clip(v) {
  var s = String(v == null ? "" : v).trim();
  return s.length > MAX_LEN ? s.slice(0, MAX_LEN) : s;
}

function isHttpUrl(s) {
  return !!s && s.length <= MAX_URL_LEN && /^https?:\/\/[^\s]+$/i.test(s);
}

// E 欄網址：顯示文字本身是網址 → 採用；否則讀儲存格超連結（整格或第一段帶連結之文字）
function readUrl(shownText, richValue) {
  var text = String(shownText == null ? "" : shownText).trim();
  if (isHttpUrl(text)) return text;
  if (!richValue) return "";
  var link = richValue.getLinkUrl();
  if (!link) {
    var runs = richValue.getRuns();
    for (var i = 0; i < runs.length; i++) {
      if (runs[i].getLinkUrl()) { link = runs[i].getLinkUrl(); break; }
    }
  }
  link = String(link == null ? "" : link).trim();
  return isHttpUrl(link) ? link : "";
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action !== "get_all") {
    return respond(e, JSON.stringify({ status: "invalid_action" }));
  }
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return respond(e, JSON.stringify({ status: "error", code: "SHEET_NOT_FOUND" }));
    }
    // 第 1 列標題＋第 2~4 列資料一次讀取（顯示文字與超連結各一次）
    var range = sheet.getRange(1, 1, 1 + SLOT_COUNT, COL_COUNT);
    var shown = range.getDisplayValues();
    var rich = range.getRichTextValues();

    // 欄位結構核對：任一標題不符即拒絕回傳資料（寧可顯示提示卡，也不顯示錯位資訊）
    for (var c = 0; c < COL_COUNT; c++) {
      if (String(shown[0][c] == null ? "" : shown[0][c]).trim() !== HEADERS[c]) {
        return respond(e, JSON.stringify({ status: "error", code: "SHEET_SCHEMA_MISMATCH" }));
      }
    }

    var list = [];
    for (var r = 1; r < shown.length; r++) { // r = 0 為標題列
      var title = clip(shown[r][0]);
      if (!title) continue; // 主題空白 → 這一格不顯示
      list.push({
        title: title,                          // A 欄：主題
        date: clip(shown[r][1]),               // B 欄：日期（顯示文字）
        time: clip(shown[r][2]),               // C 欄：時間（顯示文字）
        location: clip(shown[r][3]),           // D 欄：地點
        url: readUrl(shown[r][4], rich[r][4])  // E 欄：連結（不合格式回傳空字串）
      });
    }
    return respond(e, JSON.stringify({ status: "success", data: list }));
  } catch (err) {
    return respond(e, JSON.stringify({ status: "error", code: "READ_FAILED" }));
  }
}
```

回應格式：

```json
{ "status": "success", "data": [
  { "title": "巫呼呼市集－秋喜童話", "date": "2026/11/21-11/22", "time": "12:00-18:00", "location": "高雄美麗島商圈", "url": "" }
] }
```

錯誤回應（`status: "error"`）之 `code`：

| `code` | 情境 |
| :--- | :--- |
| `SHEET_NOT_FOUND` | 找不到 `Booth` 工作表（被改名或刪除） |
| `SHEET_SCHEMA_MISMATCH` | 第 1 列標題與 `HEADERS` 不符（欄位被插入、刪除或改標題） |
| `READ_FAILED` | 讀取時發生其他例外（詳情見 Apps Script「執行作業」紀錄） |

---

## 五、 前端設計

### 1. 位置與結構（`src/pages/index.astro`）

- 位置：Hero 左側欄，「預約諮詢」按鈕下方，取代原「品牌三大核心亮點」區塊（保留其外層 `pt-6 sm:pt-8 border-t` 分隔線樣式）。
- 結構：
  1. **小標題**：膠囊標籤「✦ 星靈出攤 ✦」，位於卡片外、卡片容器正上方，**靠左對齊**（與 Hero 左側標題、按鈕對齊）；樣式比照首頁既有膠囊標籤，雙主題。小標題**常駐顯示**，不論下方是活動卡片、佔位框或提示卡。
  2. **卡片容器** `data-booth-grid`：SSR 只放一個佔位框（`data-booth-skeleton`，`animate-pulse`、高度約一張卡片）。
  3. **卡片模板** `<template id="booth-card-template">`：所有活動卡片一律 clone 建立（單一版型來源，比照許願池）。
  4. **提示卡** `#booth-empty`（SSR 預設 `hidden`）。
  5. `<noscript>`：直接顯示提示卡內容。
- 互動邏輯置於 `src/scripts/booth.ts`，由頁面層級 `<script>` 引入（同許願池；不可放在只被 `<template>` 使用之元件內，否則腳本為 inert 永不執行）。

### 2. 依活動數量自動排版

| 活動數 | 桌機／平板（`sm` 以上） | 手機 |
| :--- | :--- | :--- |
| 3 | 三欄並排 | 單欄堆疊 |
| 2 | 兩欄並排 | 單欄堆疊 |
| 1 | 一張寬卡（日期、時間、地點橫向排列，`flex-wrap`） | 單張卡片 |
| 0（或載入失敗、未設定 API） | 一張提示卡 | 一張提示卡 |

- 欄數 class 以**完整字串常數**寫在 `booth.ts`（如 `'grid-cols-1 sm:grid-cols-3'`），確保 Tailwind 自動掃描收進 CSS bundle（同許願池配色白名單之教訓）。
- 只有 1 張時，資訊列改橫排之 class 同樣以完整字串常數切換。

### 3. 活動卡片

- 內容：**主題**（粗體，最多 2 行，超出以 `line-clamp-2` 截斷）＋最多三行資訊：日曆圖示＋日期、時鐘圖示＋時間、定位圖示＋地點（inline SVG，與既有卡片圖示風格一致）。某欄留空 → 整行不顯示。
- 外觀沿用原品牌卡片樣式（`bg-white/60 dark:bg-white/5`、`backdrop-blur-md`、`rounded-2xl`、月光藍邊框），雙主題皆須涵蓋。
- **連結**：模板根元素為 `<a>`（無 `href` 時為不可點擊之一般區塊，不可聚焦）。前端以 `new URL()` 再驗證一次，**協定為 `https:` 或 `http:` 才設定** `href`、`target="_blank"`、`rel="noopener noreferrer"`；有連結之卡片：
  - 右下角顯示「活動詳情 ↗」小字；
  - 懸停效果（邊框加深、輕微上浮）僅套用於帶 `href` 之卡片；
  - 附 `sr-only`「（另開新分頁）」。
- 全部文字以 `textContent` 賦值（無 HTML 注入風險）。

### 4. 提示卡（0 場活動、載入失敗、未設定 API 共用）

- 文案（**佔位，待業主定稿**）：
  - 主文：`✦ 最新出攤資訊將於官方 LINE 公告`
- **純文字、不附連結**（開發者決定）：同一畫面已有 Hero「預約諮詢」按鈕、導覽列「預約諮詢」與右下角 LINE 浮動按鈕，皆連至同一官方 LINE；提示卡再加連結屬重複（比照 DEC-082 移除重複 LINE 按鈕之原則）。提示卡內無可互動元素，不需懸停／焦點樣式。
- 業主可改用「敬請期待」等語氣；載入失敗時同樣顯示此卡（原則 4），不另設錯誤文案。

### 5. 載入流程（`booth.ts`）

1. 未設定 `PUBLIC_BOOTH_API_URL` → 移除佔位框、顯示提示卡，**不發網路請求**（記錄原因 `no_api_url`）。
2. 以 JSONP 呼叫 `${API_URL}?action=get_all`，**逾時 12 秒**（Apps Script 冷啟動偶有 10 秒級延遲）。
3. 回應 `status === 'success'` 且 `data` 為陣列 → 取前 3 筆（防呆），依筆數套用欄數 class、clone 模板建卡；0 筆 → 提示卡（屬正常狀態，**不**記錄為失敗）。
4. 逾時／網路錯誤／格式異常 → 提示卡（對訪客靜默，不顯示錯誤、不自動重試），並記錄失敗原因：
   | 原因代碼 | 情境 |
   | :--- | :--- |
   | `timeout` | 12 秒內無回應 |
   | `network` | 腳本載入失敗（網址錯誤、Apps Script 部署被刪除或權限非「任何人」、網路中斷） |
   | `bad_response` | 有回應但非 `success` 或 `data` 非陣列；後端之 `code`（`SHEET_NOT_FOUND`／`SHEET_SCHEMA_MISMATCH`／`READ_FAILED`，見第四節）一併附上，無則為空字串 |
   | `no_api_url` | build 時未設定環境變數 |
   - 記錄方式：`console.warn('[booth] load failed:', reason, detail)`＋GA4 事件 `booth_load_error`（參數 `{ reason, code }`，見第 7 小節）。
5. 任何情況皆先移除佔位框；容器加上 `data-booth-state`（`loading`／`ok`／`empty`／`error`），供開發者工具一眼判斷目前狀態。
- JSONP 工具函式**複製**自 `wishlist.ts`（callback 前綴改為 `__boothJsonp_`），不從許願池 import，避免改動已穩定之許願池程式；兩者如需抽出共用模組另立 DEC。

### 6. 版面跳動

- 桌機：容器保留最小高度（約一張卡片高），資料抵達時版面不跳動或僅微幅變化。
- 手機：卡片單欄堆疊，2～3 場時高度必然大於佔位框，會將下方 Hero 輪播圖往下推——僅發生於首次載入之 1～3 秒內，為純靜態架構之已知取捨（第九節）。

### 7. GA4

- 點擊帶連結之活動卡片時送出 `booth_link_click`，參數 `{ booth_title, destination_host }`。
  - `destination_host` **只送網域**（`new URL(url).hostname`，如 `www.facebook.com`），**不送完整網址**：主辦方報名連結可能含預填欄位、識別碼或追蹤參數，原樣送入 GA4 有隱私與資料保留疑慮，也會造成高基數報表。卡片實際連結維持原值不變。
  - `booth_title` 為公開之活動名稱，照常送出。
- 載入失敗時送出 `booth_load_error`，參數 `{ reason, code }`（第 5 小節；`code` 含 `SHEET_SCHEMA_MISMATCH` 等後端錯誤碼）。用途為事後排查：可於 GA4 報表觀察失敗次數與原因分布（偶發逾時 vs. 全面失效）。`no_api_url` 亦送出，以便發現線上 build 漏設環境變數。
  - 如需於 GA4 報表以 `reason` 分組，需另於 GA4 後台登錄自訂維度（選配，不影響功能；同許願池 `course_name`）。
  - GA 尚未載入完成或被訪客阻擋時，事件不送出——此為盡力而為之紀錄。
- `GoogleAnalytics.astro` 既有之 document 層級外連監聽以子字串比對 `line.me`／`iopenmall.tw`／`maps.app.goo.gl`，命中時會以**完整 href** 送出 `destination`，違反上述「只送網域」。故出攤卡片之 click handler 送出 `booth_link_click` 後呼叫 `stopPropagation()`，不讓事件冒泡至該監聽（不 `preventDefault`，連結照常開啟；不修改 `GoogleAnalytics.astro`）。

---

## 六、 環境變數

- `PUBLIC_BOOTH_API_URL`：Apps Script Web App 網址。build 時編譯進前端（同 `PUBLIC_WISHLIST_API_URL`），**修改後須重新 build＋部署**。
- 未設定 → 首頁顯示提示卡（安全降級，不影響 build）。
- 需同步：本機 `.env`、`.env.example`（新增空白項目與註解）、VPS repo 目錄之 `.env`。

---

## 七、 實施與驗收清單

### 1. 實施步驟

- [x] **Step 1（業主／開發者）**：建立「星靈出攤」試算表，工作表命名 `Booth`，第 1 列填入 A～E 標題，貼上第三節第 2 小節之操作規則至說明分頁；共用編輯權限給業主（帳號歸屬見第八節）。
- [x] **Step 2**：貼上第四節 Apps Script → 部署為網頁應用程式（執行身分：我；存取權：任何人）→ 取得網址。
- [x] **Step 3**：curl 實測：`?action=get_all`（純 JSON）、`?action=get_all&callback=cb`（JSONP，回傳 `cb({...});`）、`?action=get_all&callback=foo.bar`（非法但可抵達 Apps Script 之 callback）降級回傳純 JSON；`?action=get_all&callback=cb();alert(1)//`（含括號，URL 編碼後送出）預期由 **Google 層回傳 HTTP 400**，不會抵達 `respond()`（同許願池 DEC-067 實測）、`?action=xxx` 回傳 `invalid_action`；暫改 B1 標題為 `日期X` → 回傳 `SHEET_SCHEMA_MISMATCH`，改回即恢復。
- [x] **Step 3 補充**：依實際建立試算表之 Google 帳號類型（個人／Workspace），查閱 Google 官方 Apps Script 配額頁，將與網頁應用程式相關之限制（如同時執行數）記錄於第九節。**不得沿用未查證之數字。**
- [x] **Step 4（開發）**：前端實作（`index.astro` 移除品牌卡、新增星靈出攤區塊；`src/scripts/booth.ts`）；`npm run build` 通過、0 警告。
- [ ] **Step 5（開發）**：本機 `.env` 填入網址，`npm run dev` 瀏覽器驗收（下方清單）。
- [ ] **Step 6（部署）**：VPS `.env` 新增 `PUBLIC_BOOTH_API_URL` → `git pull` → `scripts/deploy.sh`。
  - 部署順序：**先完成 Step 2，再部署前端**。若前端先上線、網址未設定，首頁顯示提示卡（安全，不壞畫面）。

### 2. 瀏覽器驗收

- [ ] 填 3 場 → 三欄並排（桌機）／單欄堆疊（手機）
- [ ] 填 2 場 → 兩欄；填 1 場 → 寬卡、資訊橫排；全部清空 → 單一提示卡，**不出現多個「敬請期待」**
- [ ] 只填第 2、4 列 → 顯示兩張，順序正確
- [ ] 第 5 列有資料 → 不顯示
- [ ] 日期欄填 `2026/11/21`、時間欄填 `12:00`（會被試算表轉型之值）→ 網頁顯示與格子所見完全相同
- [ ] 日期／時間／地點任一留空 → 該行不顯示，卡片不留空白行
- [ ] E 欄直接貼網址 → 卡片可點、另開新分頁、顯示「活動詳情 ↗」
- [ ] E 欄以「插入連結」掛在文字下 → 同上
- [ ] E 欄填 `javascript:alert(1)`、`www.example.com`（無協定）、亂打文字 → 卡片照常顯示但不可點擊
- [ ] 主題填入含 `<b>` 等 HTML 字樣 → 原樣顯示為文字
- [ ] 超長主題 → 最多 2 行、截斷不破版
- [ ] 斷網或暫改網址為無效值 → 佔位框消失、顯示提示卡、訪客畫面無錯誤訊息；主控台出現 `[booth] load failed: network`、容器 `data-booth-state="error"`、GA4 DebugView 出現 `booth_load_error`
- [ ] 試算表三列皆清空 → 提示卡、`data-booth-state="empty"`、**不**送出 `booth_load_error`
- [ ] 刪除 B 欄（日期）或於 A、B 間插入一欄 → 首頁**不顯示錯位資訊**，改顯示提示卡；主控台 `[booth] load failed: bad_response SHEET_SCHEMA_MISMATCH`、`data-booth-state="error"`、GA4 `booth_load_error` 之 `code` 為 `SHEET_SCHEMA_MISMATCH`；復原欄位後重整即恢復
- [ ] 工作表改名 → 同上，`code` 為 `SHEET_NOT_FOUND`
- [ ] 未設定 `PUBLIC_BOOTH_API_URL` 之 build → 直接顯示提示卡、無網路請求
- [ ] 深色／淺色模式各檢查一次（首頁預設深色）
- [ ] 行動裝置實測：Android Chrome、iPhone Safari 正常載入（JSONP）
- [ ] GA4 DebugView：點活動卡片出現 `booth_link_click`；E 欄填含查詢參數之網址（如 `https://example.com/form?name=test#x`）→ 事件參數 `destination_host` 僅為 `example.com`，無路徑／查詢參數；卡片實際開啟之網址為完整原值
- [ ] 回歸：Hero 標題、預約諮詢按鈕、右側輪播、許願池頁面皆不受影響

---

## 八、 待決事項

### 1. 待業主決定

1. **提示卡文案**（第五節第 4 小節）。目前為佔位。
2. **試算表帳號歸屬**：建議比照扭蛋規格——MVP 由開發者帳號建立試算表與 Apps Script，共用編輯權限給業主；日後再評估移轉官方帳號（移轉時 Apps Script 須於新帳號重新部署，網址會變）。

### 2. 同步文件（實作時）

- `content_inventory.md` 第 1.1 節：移除「三大品牌核心特色」，改登錄「星靈出攤」區塊（小標題、提示卡定稿文案；活動內容以試算表為 SSOT，不登錄）。
- `AGENTS.md`：首頁 IA（「Hero」後註明星靈出攤）、Environment variables 新增 `PUBLIC_BOOTH_API_URL`。
- `.env.example`：新增 `PUBLIC_BOOTH_API_URL=`。
- 共用表面：**不修改** Layout、Navbar、`global.css`、`GoogleAnalytics.astro`、nginx、VPS Node 服務。

---

## 九、 已知取捨

- **首次載入需 1～3 秒**（冷啟動偶有更久）：純靜態網站讀取試算表之固有特性。期間顯示佔位框；手機版資料抵達時下方輪播會被往下推。
- **Apps Script 為首頁出攤區之單一故障點**：與許願池（僅 `/wishlist` 訪客呼叫）不同，**每位首頁訪客**（含會執行 JavaScript 之爬蟲）都會呼叫一次公開之 Apps Script；MVP 不快取、不重試。尖峰流量、機器人或 Google 配額限制時，出攤區退化為提示卡——**首頁其餘部分不受影響**。
  - **接受標準**：
    - 可接受：零星 `timeout`（GA4 中偶發、開發者重整即恢復、無法穩定重現）——不處理。
    - 須處理：同一 `reason`／`code` **持續出現**，或開發者可自行穩定重現失敗——依第十節依原因分流排查。
  - **配額**（2026-11-08 查證；試算表與 Apps Script 建立於**個人 Google 帳號**〔以非 Gmail 信箱註冊，配額同 consumer／gmail.com〕；來源：Google 官方 Apps Script 配額頁 `developers.google.com/apps-script/guides/services/quotas`）：
    - 官方頁面未列網頁應用程式／`doGet` 專屬配額，適用一般執行限制；以下個人帳號與 Workspace 相同：
    - **同時執行數：每位使用者 30**（Web App「執行身分：我」→ 所有訪客請求皆計入建立者帳號；超過時錯誤訊息為 "There are too many scripts running simultaneously for this Google user account."）——為本功能最可能觸及之限制，觸及時前端表現為 `timeout`／`network`。
    - 同時執行數：每個指令碼 1,000；單次執行時間上限 6 分鐘（本功能單次執行為秒級，不會觸及）。
    - 每日配額（觸發條件總執行時間 90 分鐘／日、URL Fetch 20,000 次／日）僅適用觸發條件與 `UrlFetchApp`，本功能皆未使用。
    - 注意：同一帳號下之其他 Apps Script（如許願池若同帳號部署）共用「每位使用者 30」之同時執行數。
  - **最後手段**：如 Apps Script 長時間無法恢復而需緊急公告，回到原流程——開發者暫時將公告寫入程式碼、重新部署。
  - **選配**：GA4「自訂洞察」可設定 `booth_load_error` 事件數異常時寄信通知；不列為上線必要條件。
- **後端快取之效果有限**：Apps Script `CacheService` 短快取（如 60 秒）只省去讀取試算表的時間，**每次請求仍會執行一次 Apps Script**，對同時執行數或執行次數類之配額幫助有限；代價為業主改完最多延遲快取時間才生效。僅於 `timeout` 持續出現且查明為讀取過慢時評估採用。
- **不自動下架**：過期活動會持續顯示，直到業主清除（原則 2，業主接受）。
- **載入失敗時顯示提示卡**：實際有活動但載入失敗時，訪客看不到活動資訊、只看到提示卡（如「敬請期待」），文案於此情境不完全正確——業主採用本架構時即接受此風險；提示卡文字引導至官方 LINE 作為補救，失敗原因以 GA4＋主控台記錄供排查（第十節）。
- **欄位結構核對之代價**：業主僅修改標題文字（如「主題」改「活動主題」）也會使整區改顯示提示卡——此為刻意設計（操作規則第 6 條），以錯誤紀錄取代靜默錯位。
- **JSONP 工具函式與許願池重複一份**：刻意不共用以免動到許願池；約 25 行，維護成本低。
- **最多 3 場**：Hero 版面空間有限；業主同時有超過 3 場出攤時，須自行挑選最近的 3 場。

---

## 十、 故障排查（業主反映「首頁出攤資訊沒出來」時）

### 1. 先取得失敗原因

- **自己重現**：以桌機瀏覽器開啟首頁 → 開發者工具（F12）：
  - Elements：搜尋 `data-booth-state`——`ok`＝正常、`empty`＝試算表沒有可顯示的列（非程式問題）、`error`＝載入失敗、停在 `loading`＝仍在等待或腳本未執行。
  - Console：找 `[booth] load failed:`，後接 `reason` 與 `code`（第五節第 5 小節表格）。
- **無法重現**（只在業主或訪客端發生）：查 GA4 `booth_load_error` 事件之 `reason`／`code` 與發生時段。

### 2. 依原因分流處置

| 狀態／原因 | 先查 | 處置 |
| :--- | :--- | :--- |
| `empty` | 試算表內容 | 活動是否填在**第 2～4 列**、**A 欄主題**是否有填 |
| `bad_response`＋`SHEET_SCHEMA_MISMATCH` | 第 1 列標題、欄位順序 | 標題須為 `主題／日期／時間／地點／連結`；欄位被插入／刪除則復原 |
| `bad_response`＋`SHEET_NOT_FOUND` | 工作表名稱 | 改回 `Booth` |
| `bad_response`＋`READ_FAILED` | Apps Script「執行作業」紀錄 | 依錯誤訊息處理 |
| `bad_response`（無 `code`） | 直接開啟 `<PUBLIC_BOOTH_API_URL>?action=get_all` | 確認網址指向本功能之 Apps Script（非許願池等其他部署） |
| `network` | Web App 權限與網址 | 直接開啟 API 網址：出現 Google 登入頁或「找不到網頁」→ 部署被刪除或存取權不是「任何人」；重新部署會換網址，須更新 `.env` 並重新 build＋部署 |
| `no_api_url` | 部署環境 | VPS repo 目錄 `.env` 補上 `PUBLIC_BOOTH_API_URL` 後重新 build＋部署 |
| `timeout`（零星） | — | 已知取捨，不處理（第九節接受標準） |
| `timeout`（持續） | 冷啟動、配額、讀取速度 | 依序：Apps Script「執行作業」看執行時間 → 對照第九節記錄之配額 → 評估 `CacheService` 短快取 → 最後手段為暫時寫死公告 |
| 只有手機失敗、桌機正常 | 前端傳輸方式 | 確認仍走 JSONP（未誤改為 fetch，DEC-067 之教訓） |

---

## 十一、 設計審查之回應（v0.2 修訂背景）

### A. v0.1 審查（3 項 P2）

1. **[P2] 欄位被插入、刪除時會靜默顯示錯誤資訊——採納。** 欄位依位置讀取，業主誤刪「日期」欄時，時間會被當日期、地點被當時間顯示，且 API 仍回 `success`、無任何錯誤紀錄。錯位的日期或地點可能讓客人跑錯現場，比顯示提示卡更糟。修正：Apps Script 核對第 1 列標題，不符回傳 `SHEET_SCHEMA_MISMATCH`，前端走既有失敗流程（第四節、第五節第 5 小節）。標題與資料一次讀取，不增加讀取次數。
2. **[P2] 不要把完整連結送進 GA4——採納。** `booth_link_click` 之 `destination` 改為 `destination_host`，只送網域；卡片實際連結不變（第五節第 7 小節）。
3. **[P2] 首頁流量使 Apps Script 成為單點——部分採納（文件化，不新增機制）。** 風險屬實，但以本站流量規模、失敗時僅出攤區退化為提示卡（首頁其餘不受影響），以及「業主更新後免部署」之核心需求衡量，不新增快取、重試或告警機制；改於第九節明訂接受標準、配額查證要求與最後手段，GA4 自訂洞察告警列為選配。

### B. v0.2 方向覆核（2 項建議）

1. **不寫死未查證之配額數字——採納。** 改為實作／部署前依帳號類型查閱官方配額頁並記錄（第七節 Step 3 補充、第九節）。
2. **故障處理應依 `reason`／`code` 分流——採納。** 第十節改為「先取得原因、再依原因分流」之對照表，僅 `timeout` 持續出現時才優先查冷啟動、配額與快取。
3. 覆核另提醒 `SHEET_SCHEMA_MISMATCH` 須同步列入失敗碼表、GA `code`、排查表與驗收案例——已同步（第四節錯誤碼表、第五節第 5／7 小節、第七節、第十節）。
4. 覆核意見中提示卡文案「應避免暗示沒有活動」：與現行一致——佔位文案「最新出攤資訊將於官方 LINE 公告」不暗示沒有活動；原則 4 保留業主選擇語氣之空間。

### C. v0.2 覆核（3 項 P3，皆採納，屬文件修正）

1. **DEC-085 標題與規格書版本未同步**：`decisions.md` 之 DEC-085 標題與「規格書」欄改為 v0.2／待覆核。
2. **E 欄網址長度規則釐清**：第三節第 1 小節改為「A～D 欄最多 100 字（截斷）；E 欄網址最多 2,000 字，不截斷，超過或格式不符即不設連結」，與第四節程式一致。
3. **JSONP curl 驗證參數補全**：第七節 Step 3 明寫 `?action=get_all&callback=cb`，避免照字面執行成無 `action` 之請求而得到 `invalid_action`。

### D. v0.2 第二次覆核（1 項 P2，採納）

1. **非法 callback 之驗收預期與既有實測衝突**：原寫「`callback=cb();alert(1)//` 回傳純 JSON」，但 DEC-067 許願池實測紀錄已指出含括號／尖括號之 callback 由 Google 層以 HTTP 400 拒絕，`respond()` 根本不會執行。第七節 Step 3 改為：以 `callback=foo.bar` 驗證「非法但可抵達 Apps Script → 降級純 JSON」；含括號之案例保留，預期結果改為 Google 層 HTTP 400。

### E. 實作 code review（2026-11-08，2 項，皆採納）

1. **[P1] 共用外連監聽會上傳完整活動連結**：原第五節第 7 小節將「被共用監聽額外記一筆」視為可接受，未察覺該監聽送出完整 href。改為卡片 click handler 呼叫 `stopPropagation()`（第五節第 7 小節）。已確認站內無其他 document 層級 click 監聽，不影響其他功能。
2. **[P3] 規格書與 DEC 實作狀態未更新**：文件狀態列與 DEC-085 標題／狀態改為「已實作、待部署」。
3. **覆核 [P3] 文件狀態清理**：DEC-085「待業主決定」移除已決定之帳號歸屬、原設計審查狀態標為歷史；Step 5 驗收清單未全數完成，用語由「通過本機驗收」改為「已完成部分本機驗收」，未驗項目部署後補驗。
