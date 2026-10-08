# 星靈織語 Starwoven — 課程許願池規格書 v3：全面試算表驅動

> **文件狀態**：v3.5（當前基準規格書），取代 `course_wishlist_plan_v2.md`（v2 已併入本檔後移除；歷史決策沿革見 `decisions.md` DEC-034~041、049~055、067）
> **建立日期**：2026-10-07（v3.0 整併定稿；v3.1 骨架卡改造 DEC-052；前身為 2026-10-02 之 v2.0 初稿，歷經 v2.1~v2.6 修訂）
> **沿革摘要**：v1 純前端 Demo（DEC-034~037）→ v2 全面試算表驅動（DEC-038；上線前審查修正 DEC-039~041）→ 許願池自首頁獨立為 `/wishlist` 分頁（DEC-049）→ G 欄 status 接上 UI 作手動下架開關、I 欄 category 改為 price 預定價格（DEC-050）→ 整併為本檔 v3.0 → SSR 移除寫死課程、改骨架卡＋載入失敗錯誤區塊（DEC-052，v3.1）→ vote 鎖內檢查 G 欄狀態，已開課／已結束拒收並回傳 course_closed（DEC-053，v3.2）→ 2.9 寫入前核對改讀 A~G，收票瞬間與移列重定位後的狀態以緊貼寫入前的複查為準（DEC-054，v3.3）→ 新增 I 欄 duration 課程時數（price／icon／style 順延為 J／K／L），價格自意象區左上角標籤移至講師下方資訊區純文字行（DEC-055，v3.4）→ 前後端傳輸改為 JSONP，修復行動裝置（iOS／Android）fetch 被 Apps Script 302 跨網域轉址阻擋導致全滅的問題（DEC-067，v3.5）。
> **核心目標**：Google 試算表成為許願池的**單一資料來源（SSOT）**——業主在手機上改試算表，網頁重整即更新，**不需要重新部署**。

---

## 一、 設計原則

1. **試算表 SSOT（單一資料來源）**：許願池的課程清單、票數、門檻、講師、課程時數、預定價格、圖示、配色、狀態與卡片排序全部由 Google 試算表驅動。`src/pages/wishlist.astro` 的 SSR **不寫死課程**（DEC-052：首屏骨架卡佔位、API 失敗顯示錯誤區塊；Demo 模式由元件內示範資料驅動）。
2. **核心身份原則**：**一票只屬於「編號＋課名」這個組合**。訪客記憶（localStorage）、後端防重複（快取鍵含課名雜湊）、投票請求（必帶 `course_name`）、寫入核對（鎖內比對 A、B 欄），前後端全部綁定同一組合；**改名即新課**，A 欄編號格子（1~6）重用因此安全。
3. **入帳原則**：**任何會讓前端重試的錯誤，都只能發生在票數寫入 D 欄之前**。D 欄入帳後的附屬寫入（flush、快取）失敗時，一律回傳成功——入帳後回傳錯誤反而**保證**前端重試、重複加票。
4. **乾淨優先**：Apps Script 採全量重寫，前端不保留 v1 回應格式的相容層；計票定位為開課意向熱度參考（非金融級精確），不為追求零誤差增加業主操作負擔。

---

## 二、 試算表結構（Wishlist 工作表）

### 1. 欄位總表

| 欄 | 名稱 | 誰可以改 | 說明 |
| :--- | :--- | :--- | :--- |
| A | `編號` | 業主（僅開課／換課時） | 數字 1~6，程式以此對應卡片；**募集中勿改** |
| B | `課程名稱` | 業主 | ⚠️ **募集中勿改（含修正錯字）**：改名 = 新課程，所有人可重新許願。建議 30 字內（後端拒收 100 字以上） |
| C | `底數` | 業主隨時 | 手動墊底數字（新課程避免 0 人尷尬） |
| D | `真實票數` | ❌ **程式專用** | 請勿手動修改 |
| E | `總票數` | 公式 `=C+D` | 僅供業主查看，程式自行計算、不讀此欄 |
| F | `開課門檻` | 業主 | 正整數才會被前端採用 |
| G | `狀態` | 業主 | **手動下架開關**：填 `已結束`＝卡片隱藏下架（清空即恢復上架）、填 `已開課`＝卡片保留但停止投票；兩種關鍵值後端 vote 亦一律拒收（回傳 `course_closed`）不計票；其他值（含空白）視同募集中。「✓ 達標籌備中」標籤仍由票數 ≥ 門檻自動推導 |
| H | `講師` | 業主 | 卡片顯示「企劃講師｜XXX」 |
| I | `課程時數` | 業主 | 自由文字（如「4 堂 × 2 小時」），顯示於講師下方「課程時數｜XXX」純文字行；留空則整行不顯示 |
| J | `預定價格` | 業主 | 自由文字（如「4 堂 2,000 元」），顯示於時數下方「課程費用｜XXX」純文字行；留空則整行不顯示 |
| K | `圖示` | 業主 | 意象區 Emoji（如 🃏 📖 👐 💫 🪙 🔢）；留空則新卡片預設 ✦ |
| L | `配色` | 業主 | 卡片漸層**鍵值**，僅限下表白名單；填錯或留空 → `blue` |

### 2. `配色` 白名單鍵值（前端映射既有 Tailwind 漸層，避免動態 class 被 purge）

| 鍵值 | 漸層色 | 視覺色系 / 建議領域 |
| :--- | :--- | :--- |
| `pink` | #F3D9E4 → #E3B7CC | 柔櫻粉（托特塔羅高階） |
| `blue` | #D9E9F6 → #B3D2EA | 月光藍（阿卡西深度工作坊，**預設 fallback**） |
| `teal` | #D5EDE7 → #A8D8CC | 湖水青（靈氣大師班） |
| `purple` | #E4DDF0 → #C4B4DC | 薰衣草紫（占星合盤） |
| `gold` | #FBEBC8 → #F5D98D | 晨曦金（金錢靈氣） |
| `orange` | #F8E0CD → #EFC09C | 珊瑚橘（靈數流年） |
| `sage` | #E2EBD8 → #C3D9B5 | 鼠尾草草本綠（藥草魔法、天然芳療、植萃手作） |
| `sand` | #EFE9E1 → #DDD2C4 | 燕麥暖沙大地色（水晶礦石、薩滿脈輪、接地冥想） |

### 3. 業主操作規則（可原樣貼到試算表的說明分頁）

1. **改內容**：直接改對應格子，網頁重整後幾秒內生效。
2. **調順序**：整列剪下、貼到想要的位置，網頁卡片順序就會跟著變。
3. **換新課（格子重用）**：改 B 欄課名 → C 欄填新底數、D 欄清零 → 更新 F~L 欄內容。改名瞬間所有人都能重新許願。
4. **募集中請勿**：改 B 欄課名（錯字也不行）、改 A 欄編號、動 D 欄數字。
5. **想少幾門課**：整列刪除（或清空 A 欄編號）即可；之後想加回來，補一列並使用 1~6 中目前沒在用的編號。
6. **排版建議**：電腦版一排 3 張卡片，課程數為 3、6、9 門時畫面最整齊；其他數量也能正常顯示。
7. **想下架或標記已開課（G 欄狀態）**：填 `已結束`＝整張卡片從網頁消失（資料不清除，清空該格即恢復上架）；填 `已開課`＝卡片保留但停止投票（按鈕顯示「✓ 已開課」）。兩種關鍵值在後端 vote 亦拒收不計票（回傳 `course_closed`），未重整的舊分頁或直接呼叫網址都會被擋下。⚠️ 值必須與關鍵字**完全一致**（含「已」字，前後勿加空白或其他字），填其他內容一律視同募集中。

---

## 三、 Apps Script（現行版，整段取代）

> 業主操作：Apps Script 編輯器內**全選舊程式碼刪除、貼上以下完整內容**，然後「部署 → 管理部署作業 → ✏️ 編輯 → 版本：新增版本 → 部署」。**Web App 網址不變**，`.env` 無需修改。

```javascript
/**
 * 星靈織語 Starwoven — 課程許願池 Google Apps Script（現行版）
 *
 * 核心原則：
 * A. 一票綁定「編號＋課名」——改名即新課。
 * B. 任何會讓前端重試的錯誤，都只能發生在票數寫入 D 欄之前；
 *    D 欄入帳後的附屬寫入（flush、快取）失敗時，一律回傳成功。
 *
 * 功能摘要：
 * 1. get_all 依「列順序」回傳陣列，並附 G 欄狀態（前端手動下架開關：
 *    已結束=隱藏、已開課=停止投票）與 H~L 欄卡片內容（講師/課程時數/預定價格/圖示/配色）
 * 2. A 欄編號支援純數字（1~6），一律以字串比對
 * 3. vote 請求必帶 course_name：後端鎖內確認 A、B 欄仍匹配才收票，
 *    不符回傳 course_changed；防重複快取鍵納入課名雜湊（改名即新課）
 * 4. vote 鎖內檢查 G 欄狀態：已開課／已結束回傳 course_closed（附 course_status）不計票
 *    ——手動下架開關的後端強制（前端停用按鈕僅為 UI，舊分頁或直接呼叫端點仍可能送票）
 * 5. vote 寫入前再次核對目標列 A~G（編號、課名與 G 欄狀態一次讀取），防止業主移列/改名/收票瞬間寫錯課或收下已關閉的票
 * 6. 課名以 SHA-256 雜湊後才進快取鍵（CacheService key 上限 250 字元）
 * 7. D 欄入帳後的附屬寫入（flush、快取）以獨立 try/catch 保護，失敗仍回傳成功（見原則 B）
 * 8. JSONP 支援：請求帶 callback 參數時回傳 JavaScript（callback(...)），
 *    供前端以 <script> 標籤載入——繞開行動瀏覽器對 Apps Script 302 跨網域
 *    轉址的 fetch/CORS 限制（DEC-067）；未帶 callback 時維持純 JSON 不變
 */

// 課名 SHA-256 雜湊：無論課名多長，快取鍵都是固定長度
function nameHash(s) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ("0" + ((b + 256) % 256).toString(16)).slice(-2); }).join("");
}

// 統一回應出口：有合法 callback 參數 → JSONP（JavaScript），否則純 JSON。
// 參數 json 為已 JSON.stringify 的字串；callback 名以白名單格式驗證（識別字規則），避免注入任意 JavaScript。
function respond(e, json) {
  var cb = e && e.parameter ? e.parameter.callback : null;
  if (cb && /^[a-zA-Z_$][a-zA-Z0-9_$]{0,98}$/.test(cb)) {
    return ContentService.createTextOutput(cb + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e.parameter.action;
  var courseId = e.parameter.course_id;
  var courseName = e.parameter.course_name; // 訪客投票時看到的課名（版本綁定用）
  var clientId = e.parameter.client_id;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Wishlist");
  var cache = CacheService.getScriptCache();

  // 1. get_all：依列序回傳全部課程卡片資料（陣列順序 = 網頁卡片顯示順序）
  if (action === "get_all") {
    var rows = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      var id = String(rows[i][0] == null ? "" : rows[i][0]).trim();
      if (!id) continue; // A 欄空白的列直接跳過（不顯示於網頁）
      var base = Number(rows[i][2]) || 0;
      var real = Number(rows[i][3]) || 0;
      list.push({
        id: id,                                                   // A 欄：編號（1~6）
        name: String(rows[i][1] == null ? "" : rows[i][1]),       // B 欄：課程名稱
        base_votes: base,                                         // C 欄：底數
        real_votes: real,                                         // D 欄：真實票數
        total_votes: base + real,                                 // 總票數（程式自算，不讀 E 欄）
        threshold: Number(rows[i][5]) || 0,                       // F 欄：開課門檻
        status: String(rows[i][6] == null ? "" : rows[i][6]),     // G 欄：狀態（手動下架開關：已結束=隱藏、已開課=停止投票）
        teacher: String(rows[i][7] == null ? "" : rows[i][7]),    // H 欄：講師
        duration: String(rows[i][8] == null ? "" : rows[i][8]),   // I 欄：課程時數
        price: String(rows[i][9] == null ? "" : rows[i][9]),        // J 欄：預定價格
        icon: String(rows[i][10] == null ? "" : rows[i][10]),     // K 欄：圖示
        style: String(rows[i][11] == null ? "" : rows[i][11])     // L 欄：配色
      });
    }
    return respond(e, JSON.stringify({ status: "success", data: list }));
  }

  // 2. vote：單一課程許願 +1（全流程排他鎖保護）
  if (action === "vote" && courseId) {
    // 2.1 驗證 client_id 格式與長度（長度 <= 64，避免 Cache key 過長造成寫入例外）
    if (!clientId || clientId.length > 64 || !/^[a-zA-Z0-9\-_]+$/.test(clientId)) {
      return respond(e, JSON.stringify({
        status: "error",
        code: "INVALID_CLIENT_ID",
        message: "訪客裝置識別碼無效"
      }));
    }

    // 2.2 驗證 course_name：必帶且長度合理（投票綁定「編號＋課名」）
    if (!courseName || courseName.length > 100) {
      return respond(e, JSON.stringify({
        status: "error",
        code: "INVALID_COURSE_NAME",
        message: "課程資訊有誤，請重新整理頁面"
      }));
    }

    // 2.3 獲取排他鎖（最多等待 10 秒）
    var lock = LockService.getScriptLock();
    try {
      var hasLock = lock.tryLock(10000);
      if (!hasLock) {
        return respond(e, JSON.stringify({
          status: "error",
          code: "SERVER_BUSY",
          message: "伺服器忙碌中，請稍候重試"
        }));
      }

      // 2.4 鎖內定位課程列（A 欄字串比對：試算表中的數字 1 與網址參數 "1" 可正確對上）
      // 抽出為函式，供 2.9 寫入前核對失敗時重新定位
      function findRow() {
        var d = sheet.getDataRange().getValues();
        for (var r = 1; r < d.length; r++) {
          if (String(d[r][0]) === String(courseId)) {
            return {
              rowIndex: r + 1,
              name: String(d[r][1] == null ? "" : d[r][1]),
              base: Number(d[r][2]) || 0,
              status: String(d[r][6] == null ? "" : d[r][6]).trim() // G 欄：手動下架開關（trim 後與關鍵值完全一致比對）
            };
          }
        }
        return null;
      }
      var target = findRow();
      if (!target) {
        return respond(e, JSON.stringify({ status: "error", message: "找不到指定課程" }));
      }

      // 2.5 版本核對：訪客投票時看到的課名 ≠ 試算表目前課名 → 課程已換，安全失敗（可重試、不計票、不記已投）
      if (target.name !== courseName) {
        return respond(e, JSON.stringify({
          status: "course_changed",
          course_id: courseId,
          course_name: target.name, // 附目前課名，供前端即時更新卡片
          message: "課程內容已更新，請重新許願"
        }));
      }

      // 2.6 狀態檢查（手動下架開關的後端強制）：已開課／已結束不計票、不記已投、不占限流額度
      // 防呆情境：訪客分頁停留期間業主收票（舊分頁按鈕仍可點），或直接呼叫公開 vote 端點
      if (target.status === "已開課" || target.status === "已結束") {
        return respond(e, JSON.stringify({
          status: "course_closed",
          course_id: courseId,
          course_name: target.name,
          course_status: target.status, // 附實際狀態值，供前端即時把卡片轉為停投或下架
          message: target.status === "已開課" ? "此課程已開課，感謝您的支持！" : "此課程許願已結束，感謝您的支持！"
        }));
      }

      // 2.7 【鎖內檢查 1】裝置防重複：快取鍵納入課名雜湊
      // 格子改名重用後，舊課的快取鍵（含舊課名雜湊）不再命中，訪客可對新課許願
      var cacheKey = "voted_" + courseId + "_" + nameHash(target.name) + "_" + clientId;
      if (cache.get(cacheKey)) {
        return respond(e, JSON.stringify({
          status: "already_voted",
          course_id: courseId,
          course_name: target.name, // 後端確認過的課名，前端只記這個
          message: "您已經為此課程許願過囉！"
        }));
      }

      // 2.8 【鎖內檢查 2】全域滑動視窗防暴衝（單課 10 秒上限 10 票；鍵含課名雜湊，換課後重新計算）
      var rateKey = "rate_limit_" + courseId + "_" + nameHash(target.name);
      var currentRate = Number(cache.get(rateKey)) || 0;
      if (currentRate >= 10) {
        return respond(e, JSON.stringify({
          status: "error",
          code: "RATE_LIMITED",
          message: "當前許願人數熱烈，系統保護中，請稍候 10 秒再試！"
        }));
      }

      // 2.9 寫入前核對：一次讀取目標列 A~G 欄，（編號, 課名）須仍匹配、G 欄狀態須仍可投票
      // 防止業主移列／改名／收票瞬間，快照列號或快照狀態已過期——2.6 判定後 G 欄仍可能被改，
      // 故狀態以此次緊貼寫入前的讀取為準；移列重定位後亦以最新快照重新判定
      var check = sheet.getRange(target.rowIndex, 1, 1, 7).getValues()[0];
      var finalStatus = String(check[6] == null ? "" : check[6]).trim();
      if (String(check[0]) !== String(courseId) || String(check[1] == null ? "" : check[1]) !== courseName) {
        target = findRow(); // 列已移動：重新定位一次（含最新課名與狀態）
        if (!target || target.name !== courseName) {
          return respond(e, JSON.stringify({
            status: "course_changed",
            course_id: courseId,
            course_name: target ? target.name : "",
            message: "課程內容已更新，請重新許願"
          }));
        }
        finalStatus = target.status;
      }

      // 寫入前狀態再確認：已開課／已結束即拒收（不計票、不記已投、不占限流）
      // 殘餘取捨：本讀取與 2.10 setValue 分屬兩次 API 呼叫，中間極小空窗在 Apps Script 下無法原子化
      if (finalStatus === "已開課" || finalStatus === "已結束") {
        return respond(e, JSON.stringify({
          status: "course_closed",
          course_id: courseId,
          course_name: target.name,
          course_status: finalStatus, // 附實際狀態值，供前端即時把卡片轉為停投或下架
          message: finalStatus === "已開課" ? "此課程已開課，感謝您的支持！" : "此課程許願已結束，感謝您的支持！"
        }));
      }

      // 2.10 執行寫入：只更新 D 欄（真實票數），絕不覆蓋業主設定之 C 欄底數
      // setValue 若真的失敗會自行拋錯 → 落入外層 catch 回傳 error（此時尚未入帳，前端重試是安全的）
      // ★ setValue 成功後即視為入帳，之後任何附屬失敗都必須回傳 success（見頭部原則 B）
      var currentRealVotes = Number(sheet.getRange(target.rowIndex, 4).getValue()) || 0;
      var newRealVotes = currentRealVotes + 1;
      sheet.getRange(target.rowIndex, 4).setValue(newRealVotes);

      // 2.11 入帳後附屬寫入（flush＋快取，獨立 try/catch）：失敗仍回傳 success
      // flush 抖動時寫入幾乎確定已成立（未定案者由 Apps Script 於指令碼結束時自動套用）；
      // 快取失敗僅暫時弱化防重複與限流——兩者若回傳 error，前端誤判重試反而保證重複加票
      try {
        SpreadsheetApp.flush(); // 即刻套用寫入
        cache.put(cacheKey, "true", 21600); // 該裝置對「此編號的此課名」6 小時內不重複累加
        cache.put(rateKey, String(currentRate + 1), 10); // 10 秒滑動視窗計數
      } catch (postCommitErr) {
        // 靜默略過：本票已成立，以 success 回應為準
      }

      return respond(e, JSON.stringify({
        status: "success",
        course_id: courseId,
        course_name: target.name, // 後端確認過的課名，前端只記這個
        votes: target.base + newRealVotes
      }));

    } catch (err) {
      return respond(e, JSON.stringify({ status: "error", message: err.toString() }));
    } finally {
      lock.releaseLock();
    }
  }

  return respond(e, JSON.stringify({ status: "invalid_action" }));
}
```

---

## 四、 前端設計（摘要）

> 實作細節以程式碼為準：`src/components/CourseWishlistCard.astro`（卡片版型與樣式）、`src/scripts/wishlist.ts`（全部互動邏輯；由頁面層級 `<script>` 引入——元件僅被 `<template>` 使用時，Astro 會將元件腳本標籤插入 `<template>` 內成為 inert 永不執行，故不可放回元件）與 `src/pages/wishlist.astro`（頁面、骨架卡、`#wish-error`、`<template id="wish-card-template">`）。本節僅摘要關鍵機制。

- **卡片單一版型來源**：`wishlist.astro` 的卡片 Grid 容器帶 `data-wish-grid`；`<template>` 內嵌一份以佔位值實際渲染的卡片，**所有課程卡片一律 clone 此模板動態建立**（SSR 不寫死課程，未來調整外觀只需修改元件檔一處）。掛勾 class：`wish-title`／`wish-teacher`／`wish-duration`（課程時數行）／`wish-price`（課程費用行）／`wish-icon`／`wish-bar-fill`／`wish-progress-text`／`wish-pill-count`／`wish-reached`／`wish-btn`（＋`wish-btn-label`）／`data-wish-hero`；頁面元素掛勾：`data-wish-skeleton`（SSR 骨架卡）／`#wish-error`＋`#wish-error-reload`（載入失敗錯誤區塊）。時數／費用兩行的 `hidden` 掛在整行 `<p>` 上，腳本以 `closest('p')` 切換顯示。
- **JSONP 傳輸（DEC-067）**：`get_all` 與 `vote` 一律以 `<script>` 標籤 JSONP 呼叫 Apps Script（帶 `callback` 參數，後端 `respond()` 包成 `callback(...)` 回傳 JavaScript；callback 名於後端以識別字白名單驗證防注入）。原因：Apps Script 一律先 302 轉址至 `script.googleusercontent.com` 才回傳內容，行動瀏覽器（iOS 全系列 WebKit、Android Chrome）對跨網域轉址的 fetch/CORS 會拒絕（桌面正常），導致手機／平板全滅顯示「許願池暫時連線異常」；`<script>` 載入不受 CORS 管轄且自動跟隨轉址。逾時以計時器實現（get_all 12 秒／vote 8 秒），逾時後保留 noop 回呼讓遲到回應靜默落地；未帶 callback 的純 JSON 呼叫（如 curl 測試）行為不變。
- **進站同步 `syncFromSheet(list)`**：`get_all` 回應成功**且 `data` 為陣列**才執行（請求有 12 秒逾時；逾時／失敗／格式異常且頁面尚無卡片 → 顯示 `#wish-error` 錯誤區塊，詳下「首屏骨架卡」條）。**首次成功同步先 `removeSkeletons()` 移除骨架卡**，再依列序逐列處理：既有卡片 `updateCardContent`、新列 `createCard`、每張以 `appendChild` 歸位（**DOM 順序 = 試算表列順序**）；不在清單中的卡片 `display: none` 隱藏（不刪除，重新出現時由 `applyStatus` 依 G 欄狀態決定是否還原）。同步請求以遞增序號 `syncSeq` 防較舊回應亂序覆寫。
- **`updateCardContent` 欄位同步**：課名／講師／課程時數／預定價格／圖示以 `textContent` 賦值（無 HTML 注入風險），**空字串 → 既有卡片保留原值不覆寫**；門檻為正整數才採用；票數受守衛保護（`data-pending`／`data-voted` 中的卡片不覆寫，**改名即新課時例外**直接套用新課票數）；配色 `applyStyle()` 走白名單（鍵值非法 → 既有卡片保留原樣、新卡片預設 `blue`）。
- **G 欄 status 手動下架開關（`applyStatus`）**：每次同步將 `row.status` trim 後寫入 `data-wish-status` 並呼叫 `applyStatus`——`已結束`＝卡片 `display: none` 隱藏下架（清空即恢復上架）；`已開課`＝隱藏「✓ 達標籌備中」、按鈕停用顯示「✓ 已開課」（`is-closed` 綠色樣式 `#58A497`），且 `vote()` 入口有守衛禁止送票；其他值（含空白）＝募集中（還原達標標籤與按鈕正確態）。**卡片 display 統一由 `applyStatus` 管理**；`updateCardContent` 中須在 `renderCard` **之後**呼叫（避免達標標籤被重新顯示），`createCard` 中須在 `initCard` **之後**呼叫（蓋過已許願判定）。
- **「認名字」投票記憶**：localStorage `starwoven_wish_{編號}` 存**課程名稱**；已許願判定 = 儲存值 === 卡片當前課名（根元素 `data-course-name` 為唯一來源）。判定時機：初始化、get_all 同步後、投票結束。投票請求帶 `course_name` 快照；回應抵達**先比對回應課名與卡片當前課名**，不一致（含後端主動回傳 `course_changed`）→ 回滾、清 pending、**不寫記憶、不鎖定**、重新同步後可對新課許願；一致才走 `success`／`already_voted` 分支，且只以後端確認過的課名寫入 localStorage；`course_closed`（等待期間業主收票，後端鎖內狀態檢查拒收）→ 回滾、清 pending、不記已投，依後端回報的 `course_status` 即時把卡片轉停投（已開課）或下架（已結束），未附狀態值時保守視同已開課。
- **既有投票防護（v1 起沿用）**：樂觀更新、失敗回滾快照、`disabled`＋`data-pending` 雙重鎖定、`data-voted` 記憶體旗標、8 秒逾時自動斷開（DEC-067 起由 JSONP 計時器實現，語義不變）。
- **首屏骨架卡＋載入失敗錯誤區塊（DEC-052）**：SSR 不寫死課程——Grid 內為 6 張 `data-wish-skeleton` 灰階佔位卡（`animate-pulse`，雙主題），首次同步成功由 `removeSkeletons()` 移除；`get_all` 逾時（12 秒）／網路失敗／回應格式異常**且頁面尚無任何課程卡片**時，移除骨架卡並顯示 `#wish-error`（「許願池暫時連線異常」＋重新整理按鈕），另備 `<noscript>` 提示——**壞掉就明白顯示壞掉，不顯示過期內容**；已有卡片的背景再同步失敗則維持靜默。
- **Demo 模式**：未設 `PUBLIC_WISHLIST_API_URL` 時純前端模擬——示範課程常數 `DEMO_COURSES`（寫於元件 script，內容為示意、不與試算表同步）經同一 `syncFromSheet` 建卡，本機記票；下架開關僅在正式模式生效。注意：正式 build 因 API 網址已編譯為非空字串，`!API_URL` 分支被 minifier 死碼移除，僅無環境變數的 build 含 Demo 資料。
- **GA4**：`course_wish_click` 事件參數 `{ course_id, course_name, mode }`；`mode` 值含 `demo`／`live`／`already_voted`／`course_changed`／`course_closed`。GA 後台如需以 `course_name` 出報表，需另於 GA4 自訂維度登錄（選配，不影響功能）。

---

## 五、 實施與驗收清單

- [x] **Step 1（業主）**：試算表 A2:A7 改為數字 `1`~`6`（對應現有列序）；H1:K7 貼上講師／分類（後改為價格）／圖示／配色——2026-10-02 完成（已透過 API 實測確認欄位正確）
- [x] **Step 2（業主）**：Apps Script **整段取代**為 v2 全量版 → 部署——2026-10-02 完成。實際執行時為「刪除舊部署後重新部署」，**Web App 網址已更換**，`.env` 的 `PUBLIC_WISHLIST_API_URL` 已同步更新（注意：VPS 上的 `.env` 需另行更新後再 build）；已實測 get_all 陣列格式、INVALID_COURSE_NAME 拒收、course_changed 回應、真實投票寫入 D 欄均正常
- [x] **Step 3（開發）**：前端實作 v2 設計（template、hooks、`data-course-name`、`syncFromSheet`、`createCard`、`applyStyle`、認名字＋綁定投票、回應先比對再分支、`course_changed` 處理、GA4）——2026-10-02 完成（DEC-038；上線前審查修正 DEC-039~041）
- [x] **Step 4（開發）**：欄位調整前端實作——G 欄 status 接上 UI 作手動下架開關（`applyStatus` 統一管理 display、`is-closed` 按鈕態、`vote()` 守衛）、I 欄 category → price（掛勾 `wish-price`、SSR 六門課 `price` 留空不虛構）——2026-10-07 完成（DEC-050），`npm run build` 已通過
- [x] **Step 4 補充（開發，DEC-053）**：程式碼審查 P1 修正——vote 鎖內新增 G 欄狀態檢查，`已開課`／`已結束` 回傳 `course_closed`（附 `course_status`）不計票、不記已投、不占限流；前端 `vote()` 新增 `course_closed` 分支即時把卡片轉停投或下架——2026-10-07 完成，`npm run build` 已通過；**業主需貼上第三節新版程式碼並部署 Apps Script 新版本（Web App 網址不變、`.env` 不變）**
- [x] **Step 4 補充 2（開發，DEC-054）**：審查第二輪 P1——2.9 寫入前核對由讀 A、B 兩欄改為讀 A~G，G 欄狀態以緊貼寫入前的讀取為準再拒收一次（涵蓋 2.6 判定後業主收票的毫秒級空窗、移列重定位後未再判定狀態兩個缺口）；前端零改動——2026-10-07 完成，`npm run build` 已通過；與 DEC-053 一併部署新版本即可
- [x] **Step 4 補充 3（開發，DEC-055）**：卡片版型調整——預定價格自意象區左上角標籤移至講師下方資訊區，改為「課程費用｜…」純文字行；其上方新增「課程時數｜…」行（試算表新 I 欄 `duration` 自由文字）；兩行留空皆整行隱藏（`hidden` 掛整行 `<p>`，腳本以 `closest('p')` 切換）；骨架卡補兩行佔位對齊新版型——2026-10-08 完成，`npm run build` 已通過；Step 6（插欄填值）與 Step 7（部署 Apps Script 新版本）業主已於同日完成並經 API 實測確認（部署前過渡期間時數行維持隱藏、價格行保留舊值，不壞畫面）
- [x] **Step 5（業主）**：試算表 I1 標題由 `category` 改為 `price`（程式依欄位位置讀取，改標題不影響運作）——2026-10-07 完成
- [x] **Step 6（業主）**：試算表在 H（講師）與原 I（價格）之間**插入一欄**作為新 I 欄 `duration`（課程時數）——原 price／icon／style 順延為 J／K／L 欄（程式依欄位位置讀取，標題名稱不影響運作）；I 欄填入各課時數、J 欄填入各課預定價格（皆自由文字，如「4 堂 × 2 小時」、「4 堂 2,000 元」；留空的課程該行不顯示）——2026-10-08 完成（已透過 API 實測確認欄位對位正確）
- [x] **Step 7（業主）**：Apps Script **整段取代**為第三節現行版程式碼（`get_all` 新增 `duration` key 讀第 9 欄，`price`／`icon`／`style` 改讀第 10／11／12 欄）→ 部署為**新版本**（Web App 網址不變，`.env` 不用改）——2026-10-08 完成（get_all 回應含 `duration` 且各欄對位正確；vote 端點驗證邏輯正常）
  - ⚠️ **Step 6 與 Step 7 屬單一維護窗口操作，須緊接執行**：欄位依**位置**讀取，「先插欄後部署」會讓舊腳本把時數當價格、價格當圖示顯示；「先部署後插欄」則反過來把價格當時數、配色鍵值當圖示——兩種順序都會錯位，不存在安全先後。本次網站尚未上線，窗口內僅業主自行測試會看到異常，影響可忽略；日後已上線再做類似插欄改版時，兩步須挑低流量時段前後腳完成（同 §五末「部署順序說明」備考精神）
- [x] **Step 4 補充 4（開發，DEC-067）**：行動裝置全滅修復——Apps Script 新增 `respond()` 統一出口支援 JSONP（帶合法 `callback` 參數時回傳 JavaScript，否則純 JSON 不變）；前端 `wishlist.ts` 的 `get_all`／`vote` 由 fetch 改為 `<script>` 標籤 JSONP 傳輸（逾時、序號防亂序、回滾等防護語義不變）——2026-10-08 完成，`npm run build` 已通過；**業主需貼上第三節新版程式碼並部署 Apps Script**。⚠️ 部署新版後端**之前**若先部署新前端，手機會依然全滅且桌面也會壞（舊後端不認得 `callback` 參數、回傳純 JSON 無法執行）——**必須先部署 Apps Script，再上傳新 `dist/`**；舊前端搭配新後端不受影響（不帶 `callback` 維持純 JSON）。**執行紀錄**：業主採刪除重建方式部署，Web App 網址已更換，`.env` 已同步更新（2026-10-08，curl 實測 JSON／JSONP／拒收／callback 白名單全數通過）
- [ ] **Step 8（開發）**：`npm run build` → 上傳 `dist/` 至 VPS
- [ ] **Step 9（瀏覽器驗收）**：
  - [ ] G 欄填 `已結束` → 重整後該卡片消失；清空該格 → 重整後恢復顯示
  - [ ] G 欄填 `已開課` → 卡片保留，按鈕變「✓ 已開課」綠色且不可點、「✓ 達標籌備中」標籤隱藏；清空 → 按鈕與標籤恢復正常
  - [ ] 後端拒收（DEC-053）：G 欄填 `已開課` 後以**未重整的舊分頁**點許願（或直接 curl `?action=vote&course_id=…&course_name=…&client_id=…`）→ 回傳 `course_closed`、D 欄票數不增加、卡片即時轉「✓ 已開課」停用態；G 欄填 `已結束` 時直接投票同樣被拒、卡片即時隱藏
  - [ ] J 欄填入預定價格 → 重整後講師下方「課程費用｜…」行原樣顯示該文字（不再出現於意象區左上角）；留空的課程（新卡片）整行不顯示
  - [ ] I 欄填入課程時數 → 重整後講師下方「課程時數｜…」行原樣顯示該文字；留空的課程整行不顯示
  - [ ] Apps Script 尚未部署新版本前（前端仍收不到 `duration`／`price` key）：既有卡片對應行保留現值、不壞畫面
  - [ ] 改 B 欄課名 → 重整許願池頁面已更新
  - [ ] 改 F 欄門檻 → 進度條分母與比例更新
  - [ ] 新增一列測試課程 → 重整後依列序出現新卡片，且可正常投票
  - [ ] 刪除該列 → 重整後卡片消失
  - [ ] 整列剪下貼上移動 → 卡片順序跟著變
  - [ ] 格子重用：1 號改名＋D 清零 → 投過舊課的瀏覽器可重新許願（前端「認名字」放行，後端快取亦不因舊課阻擋）
  - [ ] 改名瞬間投票：以 mock／手動方式讓投票撞上業主改名 → 回傳 `course_changed`、前端回滾不鎖定、卡片自動更新為新課、可重新許願
  - [ ] 投票等待期間 `get_all` 先抵達並換名卡片 → 舊課的 `success`／`already_voted` 回應抵達時**不鎖定新課**、卡片重新同步、可對新課許願
  - [ ] 超長課名（100 字以上）不影響投票與防重複（後端拒收；正常長度課名的快取鍵為固定長度雜湊）
  - [ ] 程式審閱確認：D 欄 `setValue` 之後的 `flush` 與快取寫入均在獨立 try/catch 中，失敗仍回傳 `success`
  - [ ] 既有功能回歸：投票 +1、鎖定、重新整理維持已許願、鍵盤 Enter/Space 連按不穿透
  - [ ] 首屏顯示骨架卡（不見任何寫死課程）→ `get_all` 成功後骨架卡消失、全部卡片動態建立且外觀一致（DEC-052）
  - [ ] 模擬 API 失敗（斷網或暫改 `.env` 網址為無效值後 build 預覽）→ 骨架卡消失、顯示「許願池暫時連線異常」錯誤區塊，重新整理按鈕可動
  - [ ] Demo 模式回歸（無 API 網址 build）→ 示範課程建卡、投票 +1、重整後票數累計正常
  - [ ] 行動裝置實測（DEC-067）：Android Chrome 與 iPhone/iPad Safari 開啟 `/wishlist` → 骨架卡消失、課程卡片正常顯示（不再出現「連線異常」）；投票 +1 正常；桌面瀏覽器回歸正常

### 部署順序說明

**目前網站尚未正式上線，無過渡期問題**：Step 1~8 全部完成、Step 9 驗收通過後再一次公開即可，無需任何相容層。

備考（僅供日後「網站已上線」時做類似改版參考，本次不適用）：

1. 先更新 Apps Script——其字串比對同時認得英文舊編號與數字新編號，舊前端投票完全不受影響，僅 `get_all` 因格式變更而暫停同步（舊前端會整段略過，畫面維持原值，不壞）。注意：此備考假設該版本前端的 vote 請求已帶 `course_name`；若否，後端會回 `INVALID_COURSE_NAME`，屬預期之安全失敗。
2. 再挑低流量時段，「試算表改編號」與「新前端部署」前後腳完成；切換的幾分鐘內投票會失敗，但訪客僅看到「連線稍候，點此重試」，重試即成功，無白屏或錯誤畫面。

---

## 六、 已知取捨（非問題）

- **首屏顯示骨架卡**：get_all 需 1~3 秒，此為純靜態架構的固有特性；SSR 不寫死課程（DEC-052），改以骨架卡佔位，避免顯示過期內容。
- **「改名 = 新課」**：募集中改課名（含修錯字）會讓已許願者可再投一次。票數本身不減少；若在意，業主可用 C 欄底數微調。本功能定位為開課意向熱度參考，此失真可接受。
- **A 欄改數字編號的一次性重置**（2026-10-02 已執行）：舊許願記憶已失效，全體訪客可重新許願一次；D 欄票數不受影響。
- **API 失敗即明白顯示失敗**：get_all 初始載入失敗時不再降級顯示寫死清單，改顯示「許願池暫時連線異常」錯誤區塊（DEC-052；壞掉就顯示壞掉，不拿過期資訊充數）。已有卡片的背景再同步失敗仍靜默維持現狀。
- **殘餘寫入窗口（誠實版）**：ScriptLock 鎖不住業主的試算表 UI 操作；「寫入前核對」（第三節 2.8）與實際寫入之間仍存在極小窗口，**無法完全歸零**。發生時的結果：多數情況投票安全失敗（訪客看到可重試提示，重試即成功）；極低機率一票寫錯列，業主在試算表手動修正即可。此為意向熱度參考功能之可接受誤差，不再加機制（如暫停開關）防堵。
- **入帳後附屬寫入失敗的降級**：`setValue` 本身失敗會拋錯，此時尚未入帳，回傳錯誤讓前端重試是安全的；入帳後的 `flush`／快取失敗則靜默略過、照常回傳成功（`flush` 未套用者由 Apps Script 於指令碼結束時自動補寫）。代價：極端情況下該裝置 6 小時防重複與該次限流計數暫時失效，同一訪客可能多投一票——屬可接受誤差，優於誤判失敗造成確定的重複加票。
