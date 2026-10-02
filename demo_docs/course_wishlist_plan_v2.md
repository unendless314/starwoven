# 星靈織語 Starwoven — 課程許願池 v2 優化方案：全面試算表驅動

> **文件狀態**：v2.5 定稿，**前端已實施**（DEC-038；上線前三輪審查共 4 項 P1 修正見 DEC-039～DEC-041）；Step 1／2 業主側已完成，待部署上傳（Step 4）與 Step 5 瀏覽器驗收
> **建立日期**：2026-10-02（v2.0 初稿；同日依業主討論修訂 v2.1；同日經四輪外部審查修訂 v2.2、v2.3、v2.4、v2.5）
> **前置狀態**：v1 已上線於開發環境（DEC-034 ~ DEC-037，commit `2aebfd8`），**網站尚未正式公開**。目前僅 `total_votes` 會進站自動同步；課程清單、門檻、講師等內容仍寫死於 `src/pages/index.astro`，異動需重新 build 部署。
> **核心目標**：Google 試算表成為許願池的**單一資料來源（SSOT）**——老師在手機上改試算表，網頁重整即更新，**不需要重新部署**。
> **設計定調**：Apps Script 採**全量重寫**，前端**不保留 v1 回應格式的相容層**——乾淨、容易維護優先。計票定位為開課意向熱度參考（非金融級精確），不為追求零誤差而增加業主操作負擔。
> **核心身份原則（v2.3 確立）**：**一票只屬於「編號＋課名」這個組合**。訪客記憶、後端防重複、投票請求、寫入核對，前後端全部綁定同一組合；改名即新課。
> **入帳原則（v2.4 確立、v2.5 補完）**：**任何會讓前端重試的錯誤，都只能發生在票數寫入 D 欄之前**。D 欄入帳後的附屬寫入（flush、快取）失敗時，一律回傳成功。

---

## 〇、 修訂沿革

### v2.1（相對 v2.0，依業主討論結論）

1. **課程編號改為數字格子制（1~6）**：A 欄不再使用 `thoth_advanced` 等英文語意 id。試算表固定為 6 列格子，課程募集結束後**清空原格子、重用同編號**換上新課。
2. **新增「認名字」機制**：前端記住訪客投過的是「幾號的哪門課」（B 欄課名），**改名 = 新課程**，自動開放所有人重新許願——編號重用因此安全。
3. **列順序 = 顯示順序**：`get_all` 由「物件 keyed by id」改為**依列序回傳陣列**；業主在試算表上下移動列即可調整卡片順序。
4. **Apps Script 全量重寫**：不做 v1 相容層；`vote` 的 A 欄比對改為字串比對（支援數字編號），其餘防護機制原樣保留。
5. **動態卡片以 `<template>` 同構**：`index.astro` 內嵌一份以 `CourseWishlistCard` 實際渲染的 `<template>`，`createCard()` 以 clone 建立，保證與 SSR 卡片結構永遠一致（未來改卡片外觀只改元件檔一處）。
6. **GA4 事件加送 `course_name`**：數字編號在報表中無法辨識課程，補上課名參數。
7. **一次性已知影響**：A 欄由英文 id 改為數字編號後，訪客舊的許願記憶（以舊 id 為 key）自然失效，**全體訪客可重新許願一次**；試算表 D 欄累積票數不受影響。

### v2.2（相對 v2.1，依第一輪外部審查三項 P1 意見）

1. **後端防重複快取同步「認名字」**（採納 P1-1，簡化實作）：後端自行從試算表讀課名納入快取鍵，格子改名重用後舊課記錄不再命中，避免訪客被永久鎖在新課外。
2. **部署順序說法修正**（採納 P1-2 事實糾正）：網站尚未上線，無過渡期問題；第五節僅保留日後已上線時的安全順序備考，不加相容層。
3. **vote 寫入前核對列身分**（採納 P1-3 前半）：防止業主移列瞬間把票寫進別門課；不採納「業主操作時暫停投票」之營運流程。

### v2.3（相對 v2.2，依第二輪外部審查四項 P1 意見，全部採納）

> 四項意見收斂為一個原則：**一票綁定「編號＋課名」**，前後端所有判定都使用這個組合。

1. **投票請求綁定課名**（採納 P1-1）：前端投票時快照並送出當下課名；後端鎖內確認試算表 A、B 欄仍與請求匹配，不符即回傳 `course_changed`（附目前課名），前端回滾、**不鎖定**、重新同步卡片後可重試。成功與 `already_voted` 回應均帶回後端確認過的課名，前端只以回應課名寫入 localStorage——修復「投票途中業主改名，訪客被錯誤鎖定到新課」的漏洞。
2. **寫入前同時核對編號與課名**（採納 P1-2）：v2.2 只核對 A 欄；v2.3 寫入前一次讀取目標列 A、B 兩欄，須仍等於請求的（編號, 課名）才寫入。
3. **課名雜湊後才進快取鍵**（採納 P1-3）：CacheService key 上限 250 字元；課名先以 SHA-256 壓成固定長度指紋再組鍵，避免「D 欄已加票但 `cache.put()` 失敗 → 前端回滾重試 → 重複加票」。
4. **殘餘寫入窗口誠實載明**（採納 P1-4 之措辭修正，不加機制）：ScriptLock 鎖不住業主的試算表 UI 操作，「寫入前核對」與實際寫入之間仍存在極小窗口。文件措辭由「趨近零」改為實話（見第六節）。

### v2.4（相對 v2.3，依第三輪外部審查兩項 P1 ＋ 一項 P2 意見，全部採納）

1. **D 欄入帳後的快取寫入改為獨立 try/catch**（採納 P1-1）：v2.3 的順序是「寫 D 欄 → 寫快取」，若快取寫入因服務抖動拋錯，外層回傳 `error`，前端誤判失敗而回滾重試，後端又無防重複紀錄 → **同一票重複加票**。修法：D 欄入帳後，`cache.put` 一律包在獨立 try/catch 中，失敗仍回傳 `success`（代價僅為該裝置 6 小時防重複暫時失效，可接受）。
2. **回應鎖定前再比對卡片當前課名**（採納 P1-2）：投票等待期間，慢到的 `get_all` 可能已先把卡片更新為新課；稍後舊課的 `success`／`already_voted` 回應抵達時，若仍鎖定會讓訪客對新課暫時無法許願。修法：回應抵達時先比對 `response.course_name` 與卡片當前 `data-course-name`，不一致即視同 `course_changed` 走同一路徑（回滾、清 pending、不寫記憶、不鎖定、重新同步）。
3. **限流快取鍵納入課名雜湊**（採納 P2）：`rate_limit_{編號}` 改為 `rate_limit_{編號}_{課名雜湊}`，換課後不沿用舊課的 10 秒限流窗口。

### v2.5（相對 v2.4，依第四輪外部審查一項 P1 意見，採納）

1. **`flush()` 納入「入帳後必回成功」保護路徑**（採納 P1-1）：v2.4 只保護了快取寫入，`SpreadsheetApp.flush()` 仍在未受保護路徑上——`setValue` 已可能入帳而 `flush` 拋錯時，外層回傳 `error` 會導致前端重試、重複加票。修法：`flush` 與快取寫入一併包入獨立 try/catch，失敗仍回傳 `success`。正確性依據：`setValue` 若真的失敗會自行拋錯（此時尚未入帳，回傳錯誤讓前端重試是安全的）；`setValue` 成功而 `flush` 抖動時，寫入幾乎確定已成立（未定案者亦由 Apps Script 於指令碼結束時自動套用），此時回傳錯誤反而**保證**重複加票。至此，D 欄入帳後的路徑上不再有任何可拋錯的外部呼叫。

---

## 一、 v1 現狀與 v2 差異

| 資料項目 | v1（現狀） | v2（本方案） |
| :--- | :--- | :--- |
| 票數（C 欄底數＋D 欄真實票） | ✅ 進站自動同步 | ✅ 維持 |
| 開課門檻（F 欄） | ❌ build 時寫死 | ✅ 進站同步 |
| 課程名稱（B 欄） | ❌ 寫死於 index.astro | ✅ 進站同步（兼作「新課判定位」，見第四節之 3） |
| 講師、分類標籤、圖示、卡片配色 | ❌ 寫死於 index.astro | ✅ 進站同步（新增 H~K 欄） |
| 新增／移除課程 | ❌ 需改程式碼部署 | ✅ 試算表增刪列即可 |
| 卡片顯示順序 | ❌ 需改程式碼部署 | ✅ 試算表列順序即顯示順序 |
| 課程編號（A 欄） | 英文語意 id（`thoth_advanced` 等） | 數字格子 1~6，可重用（改名即新課） |
| 一票的身份認定 | 前端記編號、後端記「編號＋裝置」 | **前後端皆綁定「編號＋課名」**：投票請求、防重複快取（課名雜湊）、寫入核對全部一致 |
| SSR 佔位課程（`index.astro` 的 `wishlistCourses`） | 主要資料來源 | 降為 **fallback**：首屏秒開、Demo 模式、API 失敗時使用 |

**v1 已實作、v2 不變的機制**：樂觀更新、失敗回滾快照、`disabled`＋`data-pending` 雙重鎖定、`data-voted` 記憶體旗標、8 秒逾時、後端 tryLock 排他鎖／滑動視窗速率限制。

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
| G | `狀態` | 業主 | 僅試算表內部管理；前端「✓ 達標籌備中」由票數 ≥ 門檻自動推導 |
| H | `講師` | 業主 | 卡片顯示「企劃講師｜XXX」 |
| I | `分類` | 業主 | 左上角分類標籤；留空則新卡片不顯示標籤 |
| J | `圖示` | 業主 | 意象區 Emoji（如 🃏 📖 👐 💫 🪙 🔢）；留空則新卡片預設 ✦ |
| K | `配色` | 業主 | 卡片漸層**鍵值**，僅限下表白名單；填錯或留空 → `blue` |

### 2. `配色` 白名單鍵值（前端映射既有 Tailwind 漸層，避免動態 class 被 purge）

| 鍵值 | 漸層色 | 目前使用課程 |
| :--- | :--- | :--- |
| `pink` | #F3D9E4 → #E3B7CC | 托特塔羅高階 |
| `blue` | #D9E9F6 → #B3D2EA | 阿卡西深度工作坊 |
| `teal` | #D5EDE7 → #A8D8CC | 靈氣大師班 |
| `purple` | #E4DDF0 → #C4B4DC | 占星合盤 |
| `gold` | #FBEBC8 → #F5D98D | 金錢靈氣 |
| `orange` | #F8E0CD → #EFC09C | 靈數流年 |

### 3. 業主操作規則（可原樣貼到試算表的說明分頁）

1. **改內容**：直接改對應格子，網頁重整後幾秒內生效。
2. **調順序**：整列剪下、貼到想要的位置，網頁卡片順序就會跟著變。
3. **換新課（格子重用）**：改 B 欄課名 → C 欄填新底數、D 欄清零 → 更新 F~K 欄內容。改名瞬間所有人都能重新許願。
4. **募集中請勿**：改 B 欄課名（錯字也不行）、改 A 欄編號、動 D 欄數字。
5. **想少幾門課**：整列刪除（或清空 A 欄編號）即可；之後想加回來，補一列並使用 1~6 中目前沒在用的編號。
6. **排版建議**：電腦版一排 3 張卡片，課程數為 3、6、9 門時畫面最整齊；其他數量也能正常顯示。

### 4. 業主操作：H~K 欄補齊用貼上區塊

⚠️ **只貼 H1:K7 這一塊**（從 H1 開始選取後貼上）。**A~G 欄維持現狀**——C／D 欄是線上累積的真實數字，覆蓋會造成票數損失。

```
teacher	category	icon	style
學長老師	塔羅進階	🃏	pink
古古老師	阿卡西紀錄	📖	blue
學長老師	靈氣研修	👐	teal
皮皮老師	占星專題	💫	purple
黎夢老師	靈氣專題	🪙	gold
皮皮老師	生命靈數	🔢	orange
```

另外手動將 A2:A7 的英文 id 依現有列序改為 `1`~`6`。改完這步，訪客舊的許願記憶失效、可重新許願一次（一次性影響，見第〇節 v2.1 之 7）。

---

## 三、 Apps Script（v2 全量重寫版，整段取代）

> 業主操作：Apps Script 編輯器內**全選舊程式碼刪除、貼上以下完整內容**，然後「部署 → 管理部署作業 → ✏️ 編輯 → 版本：新增版本 → 部署」。**Web App 網址不變**，`.env` 無需修改。

```javascript
/**
 * 星靈織語 Starwoven — 課程許願池 Google Apps Script（v2 全量版）
 *
 * 核心原則：
 * A. 一票綁定「編號＋課名」——改名即新課。
 * B. 任何會讓前端重試的錯誤，都只能發生在票數寫入 D 欄之前；
 *    D 欄入帳後的附屬寫入（flush、快取）失敗時，一律回傳成功。
 *
 * 相對 v1 的差異：
 * 1. get_all 改為依「列順序」回傳陣列，並附 H~K 欄卡片內容（講師/分類/圖示/配色）
 * 2. A 欄編號支援純數字（1~6），一律以字串比對
 * 3. vote 請求必帶 course_name：後端鎖內確認 A、B 欄仍匹配才收票，
 *    不符回傳 course_changed；防重複快取鍵納入課名雜湊（改名即新課）
 * 4. vote 寫入前再次核對目標列的編號與課名，防止業主移列/改名瞬間寫錯課
 * 5. 課名以 SHA-256 雜湊後才進快取鍵（CacheService key 上限 250 字元）
 * 6. D 欄入帳後的附屬寫入（flush、快取）以獨立 try/catch 保護，失敗仍回傳成功（見原則 B）
 */

// 課名 SHA-256 雜湊：無論課名多長，快取鍵都是固定長度
function nameHash(s) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ("0" + ((b + 256) % 256).toString(16)).slice(-2); }).join("");
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
        status: String(rows[i][6] == null ? "" : rows[i][6]),     // G 欄：狀態（僅內部管理）
        teacher: String(rows[i][7] == null ? "" : rows[i][7]),    // H 欄：講師
        category: String(rows[i][8] == null ? "" : rows[i][8]),   // I 欄：分類
        icon: String(rows[i][9] == null ? "" : rows[i][9]),       // J 欄：圖示
        style: String(rows[i][10] == null ? "" : rows[i][10])     // K 欄：配色
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: list }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. vote：單一課程許願 +1（全流程排他鎖保護）
  if (action === "vote" && courseId) {
    // 2.1 驗證 client_id 格式與長度（長度 <= 64，避免 Cache key 過長造成寫入例外）
    if (!clientId || clientId.length > 64 || !/^[a-zA-Z0-9\-_]+$/.test(clientId)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        code: "INVALID_CLIENT_ID",
        message: "訪客裝置識別碼無效"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.2 驗證 course_name：必帶且長度合理（投票綁定「編號＋課名」）
    if (!courseName || courseName.length > 100) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        code: "INVALID_COURSE_NAME",
        message: "課程資訊有誤，請重新整理頁面"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.3 獲取排他鎖（最多等待 10 秒）
    var lock = LockService.getScriptLock();
    try {
      var hasLock = lock.tryLock(10000);
      if (!hasLock) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "SERVER_BUSY",
          message: "伺服器忙碌中，請稍候重試"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2.4 鎖內定位課程列（A 欄字串比對：試算表中的數字 1 與網址參數 "1" 可正確對上）
      // 抽出為函式，供 2.8 寫入前核對失敗時重新定位
      function findRow() {
        var d = sheet.getDataRange().getValues();
        for (var r = 1; r < d.length; r++) {
          if (String(d[r][0]) === String(courseId)) {
            return {
              rowIndex: r + 1,
              name: String(d[r][1] == null ? "" : d[r][1]),
              base: Number(d[r][2]) || 0
            };
          }
        }
        return null;
      }
      var target = findRow();
      if (!target) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "找不到指定課程" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 2.5 版本核對：訪客投票時看到的課名 ≠ 試算表目前課名 → 課程已換，安全失敗（可重試、不計票、不記已投）
      if (target.name !== courseName) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "course_changed",
          course_id: courseId,
          course_name: target.name, // 附目前課名，供前端即時更新卡片
          message: "課程內容已更新，請重新許願"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2.6 【鎖內檢查 1】裝置防重複：快取鍵納入課名雜湊
      // 格子改名重用後，舊課的快取鍵（含舊課名雜湊）不再命中，訪客可對新課許願
      var cacheKey = "voted_" + courseId + "_" + nameHash(target.name) + "_" + clientId;
      if (cache.get(cacheKey)) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "already_voted",
          course_id: courseId,
          course_name: target.name, // 後端確認過的課名，前端只記這個
          message: "您已經為此課程許願過囉！"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2.7 【鎖內檢查 2】全域滑動視窗防暴衝（單課 10 秒上限 10 票；鍵含課名雜湊，換課後重新計算）
      var rateKey = "rate_limit_" + courseId + "_" + nameHash(target.name);
      var currentRate = Number(cache.get(rateKey)) || 0;
      if (currentRate >= 10) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "RATE_LIMITED",
          message: "當前許願人數熱烈，系統保護中，請稍候 10 秒再試！"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // 2.8 寫入前核對：一次讀取目標列 A、B 兩欄，須仍等於請求的（編號, 課名）
      // 防止業主移列／改名瞬間，快照列號已指向別門課
      var check = sheet.getRange(target.rowIndex, 1, 1, 2).getValues()[0];
      if (String(check[0]) !== String(courseId) || String(check[1] == null ? "" : check[1]) !== courseName) {
        target = findRow(); // 列已移動：重新定位一次
        if (!target || target.name !== courseName) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "course_changed",
            course_id: courseId,
            course_name: target ? target.name : "",
            message: "課程內容已更新，請重新許願"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // 2.9 執行寫入：只更新 D 欄（真實票數），絕不覆蓋業主設定之 C 欄底數
      // setValue 若真的失敗會自行拋錯 → 落入外層 catch 回傳 error（此時尚未入帳，前端重試是安全的）
      // ★ setValue 成功後即視為入帳，之後任何附屬失敗都必須回傳 success（見頭部原則 B）
      var currentRealVotes = Number(sheet.getRange(target.rowIndex, 4).getValue()) || 0;
      var newRealVotes = currentRealVotes + 1;
      sheet.getRange(target.rowIndex, 4).setValue(newRealVotes);

      // 2.10 入帳後附屬寫入（flush＋快取，獨立 try/catch）：失敗仍回傳 success
      // flush 抖動時寫入幾乎確定已成立（未定案者由 Apps Script 於指令碼結束時自動套用）；
      // 快取失敗僅暫時弱化防重複與限流——兩者若回傳 error，前端誤判重試反而保證重複加票
      try {
        SpreadsheetApp.flush(); // 即刻套用寫入
        cache.put(cacheKey, "true", 21600); // 該裝置對「此編號的此課名」6 小時內不重複累加
        cache.put(rateKey, String(currentRate + 1), 10); // 10 秒滑動視窗計數
      } catch (postCommitErr) {
        // 靜默略過：本票已成立，以 success 回應為準
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        course_id: courseId,
        course_name: target.name, // 後端確認過的課名，前端只記這個
        votes: target.base + newRealVotes
      })).setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "invalid_action" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 四、 前端設計（`src/components/CourseWishlistCard.astro` ＋ `src/pages/index.astro`）

### 1. 結構掛勾（Hooks）

- `index.astro` 許願卡 Grid 容器加 `data-wish-grid`（供動態插入與排序搬移）。
- 元件模板補上掛勾 class：`wish-title`（課名 h3）、`wish-teacher`（講師 span）、`wish-category`（分類標籤）、`wish-icon`（Emoji）、`data-wish-hero`（漸層容器，供配色替換）。
- 卡片根元素新增 `data-course-name`：**卡片當前課名的唯一來源**——SSR 初始寫入、`updateCardContent` 同步時更新、`createCard` 建立時填入；`vote()` 一律由此取值，不依賴畫面文字。
- `index.astro` 新增 `<template id="wish-card-template">`，內嵌一個以佔位值實際渲染的 `<CourseWishlistCard>`——`<template>` 內容為 inert 不會顯示，但 HTML 結構完整存在。**動態卡片一律 clone 此模板，與 SSR 卡片永遠同構**；未來調整卡片外觀只需修改元件檔一處。

### 2. `syncFromSheet(list)` 同步邏輯（取代現有 get_all handler）

`get_all` 回應成功**且 `data` 為陣列**才執行；格式不符（例如 Apps Script 尚未更新）→ 整段略過、維持 SSR 顯示（防禦性檢查，非 v1 相容層）。

1. **依 `list` 順序逐列處理**：
   - 已存在的卡片（依 `id` 比對）→ `updateCardContent(card, row)`。
   - 找不到對應卡片 → `createCard(row)`（clone template、`textContent` 填值、`initCard()` 綁定投票邏輯）。
   - 每張處理完以 `grid.appendChild(card)` 放回——既有節點會被搬移，**最終 DOM 順序 = 試算表列順序**。
2. **不在 `list` 中的卡片** → `card.style.display = 'none'` 隱藏；重新出現在 `list` 中時還原顯示。
3. `updateCardContent(card, row)`：
   - **票數**：受 DEC-036 守衛保護——`data-pending`／`data-voted` 中的卡片**不覆寫票數**。
   - **門檻**：`threshold` 為正數才採用，不受上述守衛限制。
   - **課名／講師／分類／圖示**：`textContent` 賦值（無 HTML 注入風險）；**空字串 → 既有卡片保留原值不覆寫**。課名有更新時同步寫入 `data-course-name`。
   - **配色 `applyStyle()`**：白名單 map（完整 class 字串置於元件 script，Tailwind v4 自動內容掃描會收進 CSS bundle）；先移除白名單全部漸層 class，再加上新鍵值對應者。**鍵值不在白名單 → 既有卡片保留原樣、新卡片用 `blue`**。
   - 課名更新後執行「認名字」檢查（見下節）。
4. `createCard(row)` 預設值：`icon` 空 → `✦`；`style` 空或非法 → `blue`；`category` 空 → 隱藏標籤；`threshold` 非正數 → 不採用（保留模板值 1）。
5. 抽出 `initCard(card)`（renderCard、已許願判定、click handler 綁定），SSR 卡片與動態卡片共用同一份初始化邏輯。
6. 外層進入條件由 `cards.length > 0` 放寬為「有卡片或有 `data-wish-grid` 容器」，確保 SSR 清空時仍能從試算表長出全部卡片。

### 3. 「認名字」投票記憶與綁定投票（支援編號格子重用）

**核心原則：一票只屬於「編號＋課名」這個組合，前後端一致。**

- localStorage `starwoven_wish_{編號}` 的儲存值由 `'true'` 改為**課程名稱**。
- **已許願判定 = 儲存值 === 卡片當前課名**（`data-course-name`）。
- 三個判定時機（第一輪審查已確認此三時機本身合理）：
  - **初始化**：以 SSR 課名比對（此時若業主已換課，SSR 仍是舊名 → 舊訪客按鈕短暫維持鎖定 1~3 秒，待 get_all 回來後修正）。
  - **get_all 同步後**：以試算表課名再次比對；名不同 → 清除旗標與 `data-voted`、按鈕解鎖回預設態，所有人（含投過舊課者）可對新課許願。
  - **投票結束**：寫入課名（來源與條件見下）。
- **投票請求綁定課名**：`vote()` 從 `data-course-name` 快照課名，隨請求送出 `course_name`。
- **回應處理（v2.4 修正）——先比對、再分支**：回應抵達時，先比對 `response.course_name` 與卡片**當前** `data-course-name`：
  - **不一致**（等待期間 `get_all` 已把卡片更新為新課）→ 視同 `course_changed`，走同一路徑：回滾、清 `data-pending`、**不寫 localStorage、不鎖定**，重新執行一次 `get_all` 同步（卡片換成新課內容），按鈕回復可點。
  - **一致** → 依原分支處理：
    - `success`：以回應帶回的 `course_name`（後端確認過的版本）寫入 localStorage、鎖定按鈕。
    - `already_voted`：回滾樂觀 +1、以回應 `course_name` 寫入、鎖定按鈕。後端快取鍵含課名雜湊，`already_voted` 只會在「同一門課」時出現，故此時寫入是正確的。
    - `course_changed`（後端主動回傳）：同上「不一致」路徑。
- **後端亦認名字**：防重複快取鍵為 `voted_{編號}_{課名雜湊}_{裝置}`（後端自行讀試算表課名、SHA-256 後組鍵），且投票請求的課名須與試算表當前課名一致才收票——前後端規則完全一致。
- **不需遷移程式**：A 欄改數字編號後，舊 key（`starwoven_wish_thoth_advanced` 等）自然作廢成為無害殘留，全體訪客重新許願一次即可（一次性）。

### 4. SSR fallback 定位

- `index.astro` 的 `wishlistCourses` **保留**：首屏即時渲染、Demo 模式、API 失敗降級。
- `id` 改為 `'1'`~`'6'`，內容與試算表大致對齊即可；**部署前把 `votes` 更新為當時試算表真實總票**，減少首屏跳動幅度。

### 5. 維持不變

- G 欄 `status` 仍僅供試算表內部管理。
- Demo 模式（未設 `PUBLIC_WISHLIST_API_URL`）行為不變（本機記票；認名字以 SSR 課名為準）。
- 投票、防刷、回滾等既有邏輯零更動。

### 6. GA4

`course_wish_click` 事件參數改為 `{ course_id: 編號, course_name: 課名, mode }`，`mode` 新增 `course_changed` 情境值。GA 後台如需以 `course_name` 出報表，需另於 GA4 自訂維度登錄（選配，不影響功能）。

---

## 五、 實施與驗收清單

- [x] **Step 1（業主）**：A2:A7 改為數字 `1`~`6`（對應現有列序）；H1:K7 貼上第二節之 4 的區塊——2026-10-02 完成（已透過 API 實測確認欄位正確）
- [x] **Step 2（業主）**：Apps Script **整段取代**為第三節程式碼 → 部署為**新版本**——2026-10-02 完成。實際執行時為「刪除舊部署後重新部署」，**Web App 網址已更換**，`.env` 的 `PUBLIC_WISHLIST_API_URL` 已同步更新（注意：VPS 上的 `.env` 需另行更新後再 build）；已實測 get_all 陣列格式、INVALID_COURSE_NAME 拒收、course_changed 回應、真實投票寫入 D 欄均正常
- [x] **Step 3（開發）**：前端實作第四節設計（template、hooks、`data-course-name`、`syncFromSheet`、`createCard`、`applyStyle`、認名字＋綁定投票、回應先比對再分支、`course_changed` 處理、GA4）——2026-10-02 完成（DEC-038）
- [ ] **Step 4**：`npm run build` → 上傳 `dist/` 至 VPS（build 已通過，待上傳）
- [ ] **Step 5 驗收**：
  - [ ] 改 B 欄課名 → 重整首頁已更新
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
- [x] **Step 6**：登錄 `decisions.md`（DEC-038）並將本文件狀態改為「已實施」——2026-10-02 完成

### 部署順序說明

**目前網站尚未正式上線，無過渡期問題**：Step 1~4 全部完成、Step 5 驗收通過後再一次公開即可，無需任何相容層。

備考（僅供日後「網站已上線」時做類似改版參考，本次不適用）：

1. 先更新 Apps Script——其字串比對同時認得英文舊編號與數字新編號，舊前端投票完全不受影響，僅 `get_all` 因格式變更而暫停同步（舊前端會整段略過，畫面維持原值，不壞）。注意：此備考假設該版本前端的 vote 請求已帶 `course_name`；若否，後端會回 `INVALID_COURSE_NAME`，屬預期之安全失敗。
2. 再挑低流量時段，「試算表改編號」與「新前端部署」前後腳完成；切換的幾分鐘內投票會失敗，但訪客僅看到「連線稍候，點此重試」，重試即成功，無白屏或錯誤畫面。

---

## 六、 已知取捨（非問題）

- **首屏短暫顯示 SSR 舊值**：get_all 需 1~3 秒，此為純靜態架構的固有特性；v1 即如此。
- **「改名 = 新課」**：募集中改課名（含修錯字）會讓已許願者可再投一次。票數本身不減少；若在意，業主可用 C 欄底數微調。本功能定位為開課意向熱度參考，此失真可接受。
- **A 欄改數字編號的一次性重置**：舊許願記憶失效，全體訪客可重新許願一次；D 欄票數不受影響。
- **移除卡片的隱藏依賴 API 成功**：get_all 失敗時 fallback 為 SSR 清單原樣顯示（寧可多顯示，不可空白）。
- **殘餘寫入窗口（誠實版）**：ScriptLock 鎖不住業主的試算表 UI 操作；「寫入前核對」（第三節 2.8）與實際寫入之間仍存在極小窗口，**無法完全歸零**。發生時的結果：多數情況投票安全失敗（訪客看到可重試提示，重試即成功）；極低機率一票寫錯列，業主在試算表手動修正即可。此為意向熱度參考功能之可接受誤差，不再加機制（如暫停開關）防堵。
- **入帳後附屬寫入失敗的降級**：`setValue` 本身失敗會拋錯，此時尚未入帳，回傳錯誤讓前端重試是安全的；入帳後的 `flush`／快取失敗則靜默略過、照常回傳成功（`flush` 未套用者由 Apps Script 於指令碼結束時自動補寫）。代價：極端情況下該裝置 6 小時防重複與該次限流計數暫時失效，同一訪客可能多投一票——屬可接受誤差，優於誤判失敗造成確定的重複加票。
