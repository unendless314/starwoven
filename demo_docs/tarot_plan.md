# 星靈織語 Starwoven — 線上塔羅抽卡（AI 解讀）規格書 v0.7

> **文件狀態**：v0.7 **設計審查通過，待實作**（2026-10-20 第五輪外部 AI 審查 LGTM；歷經五輪審查，修正紀錄見沿革摘要與 `decisions.md` DEC-073）。對應決策 `decisions.md` DEC-073。
> **沿革摘要**：v0.1 初稿（2026-10-20）→ 第一輪設計審查 2 項 P1 採納：每日額度改為呼叫 AI 前同步保留（防等待期間併發穿透上限）、nginx 限流明確設定 `limit_req_status 429`（v0.2）→ 第二輪審查 1 項 P2 採納：nginx `client_max_body_size` 先行拒絕之 HTML 413 與 JSON 合約對齊，前端以狀態碼 413 判斷（v0.3）→ AI 供應商暫定 MiniMax，新增第五節第 3 小節「AI 供應商與銜接層」、伺服器環境變數清單（v0.4）→ 第三輪審查 1 項 P1、1 項 P2 採納：更正「額度用盡即停止服務」之錯誤假設（訂閱額度用盡後會先扣 Credit packs，開發者知情接受）、`AI_BUSY` 改為同時釋放全站與 IP 額度（v0.5）→ 新增第三節第 3 小節「參數管理」：A 環境變數／B `config.ts`／C nginx 三層單一來源、全部 `TAROT_*` 宣告為 secret 以支援免 build 調整、跨層一致性約束（v0.6）→ 第四輪審查 3 項 P1 採納：`TAROT_AI_API_KEY` 改選填（缺少即視同停用，確保無金鑰亦可 build）、推理強度以 `none` 明確停用、systemd 以 `EnvironmentFile` 載入；伺服器環境變數檔更名 `/etc/starwoven/app.env` 並新增本機／伺服器環境變數檔配置說明（v0.7）。
> **建立日期**：2026-10-20
> **定位**：**MVP Demo**——由開發者先做出可實際操作的成品上線，供業主評估 UI、體驗與商業定位；業主決策前**不加入主導航**，所有商業面參數（牌陣、次數、語氣、是否收費）皆視為可調整之暫定值。
> **核心目標**：訪客於 `/tarot` 選擇牌陣、輸入問題、完成洗牌抽牌儀式後，取得由雲端 AI 依「我方牌義資料＋品牌語氣」生成的解讀，並於結尾導向真人占卜師預約（LINE）。

---

## 一、 設計原則

1. **金鑰永不進前端**：AI API 金鑰只存在於 VPS 伺服器端環境變數；前端 bundle 不得含任何金鑰或供應商端點。
2. **靜態優先、動態最小化**：全站維持靜態輸出，**僅新增一支 on-demand API 路由**（`/api/tarot/reading`）；`/tarot` 頁本身仍為預先產生（prerender）的靜態 HTML。Node 服務故障時只影響抽卡解讀，其餘頁面由 nginx 照常提供。
3. **伺服器抽牌**：牌由後端以密碼學安全亂數抽出，前端的「選牌」動作為儀式性互動，不決定實際牌面（防竄改、防把 API 當作任意牌面的解讀器）。
4. **單一用途端點**：端點只接受「牌陣代碼＋限長問題」，系統提示詞寫死於伺服器，回應為固定 JSON 結構——無法被當作通用聊天 AI 使用，降低濫用誘因。
5. **不保存使用者內容（隱私）**：問題與解讀**不寫入任何資料庫、檔案或 log**；伺服器只記錄匿名統計（時間、牌陣、成功／失敗、耗時）。
6. **成本有硬上限**：三層防線——AI 供應商後台每月花費上限（最終保險）＞應用層每日全站次數上限＞nginx 依 IP 限流。
7. **不捏造內容**：牌義關鍵字、品牌語氣提示詞於 MVP 階段為**佔位內容**，於資料檔與頁面中明確標示「待占卜師審定」；牌面圖片以佔位視覺呈現。

---

## 二、 範疇

### 1. MVP 包含

| 項目 | 說明 |
| :--- | :--- |
| 頁面 | `/tarot` 單頁（靜態），沿用 `Layout.astro`，深淺雙模式皆完整適配，行動裝置優先 |
| 牌陣 | ① `single` 單張「今日指引」② `three` 三張「過去／現在／未來」 |
| 牌組 | 偉特塔羅 78 張（22 大阿爾克那＋56 小阿爾克那），含正逆位 |
| 問題輸入 | 選填，上限 **120 字**；留白即解讀為一般性指引 |
| AI 解讀 | 每張牌解讀＋整體訊息＋一句建議，固定 JSON 結構 |
| 轉換導流 | 結果區塊結尾固定「想深入聊聊？預約真人占卜師」＋既有 LINE 預約 URL |
| 防濫用 | nginx IP 限流＋應用層每日全站上限＋供應商月花費上限 |
| 安全回應 | 自傷相關提問改走固定關懷訊息與求助資源，不呼叫 AI |
| 追蹤 | GA4 事件（不含問題內容） |

### 2. MVP 明確不做（Out of Scope）

- 不加入主導航（`Navbar.astro` 不動），不放首頁入口；以直接網址供業主評估。
- 不做會員、登入、歷史紀錄、收藏、分享圖卡。
- 不做托特塔羅、凱爾特十字等大型牌陣、每日一牌推播。
- 不做付費／金流。
- 不做 78 張牌面圖（見第七節，佔位處理）。
- 不做串流逐字輸出（SSE）；以洗牌／翻牌動畫涵蓋等待時間，降低 nginx 與前端複雜度。
- 不使用 Google 試算表作設定來源（參數低頻變動，改程式碼重新部署即可；理由見 DEC-073）。

---

## 三、 系統架構

```
訪客瀏覽器
  └─ GET  /tarot                 → nginx 直接回傳靜態 HTML（/var/www/starwoven）
  └─ POST /api/tarot/reading     → nginx（limit_req 依 IP 限流）
                                     └─ proxy_pass → 127.0.0.1:4321（Astro Node 服務，systemd 常駐）
                                          1. 驗證 Origin、Content-Type、請求格式
                                          2. 檢查功能開關與每日全站上限
                                          3. 自傷關鍵字預檢 → 命中則回傳固定關懷訊息
                                          4. crypto 亂數抽牌（含正逆位）
                                          5. 組合系統提示詞＋牌義資料＋問題 → 呼叫雲端 AI
                                          6. 驗證 AI 回傳 JSON 結構 → 回傳前端
```

### 1. Astro 設定變更

- 安裝 Node 轉接器（實作時以 `npx astro add node` 安裝與 Astro 5 相容之 `@astrojs/node`），`mode: 'standalone'`。
- `astro.config.mjs` 維持 `output: 'static'`；僅 `src/pages/api/tarot/reading.ts` 宣告 `export const prerender = false`。其餘所有頁面（含 `/tarot`）照舊預先產生。
- 建置輸出結構改變：`dist/client/`（靜態檔）＋`dist/server/`（Node 服務入口 `entry.mjs`）。
- 環境變數採 **`astro:env` schema**（`envField`，`context: 'server'`、`access: 'secret'`），於執行期讀取，避免金鑰在建置時被內嵌進 bundle；宣告規則見本節第 3 小節（3）。

### 2. 檔案配置（預定）

| 路徑 | 用途 |
| :--- | :--- |
| `src/pages/tarot.astro` | 抽卡頁（靜態），版型與狀態區塊 |
| `src/scripts/tarot.ts` | 頁面互動邏輯（狀態機、動畫、呼叫 API），由頁面層級 `<script>` 引入（比照 `wishlist.ts`） |
| `src/pages/api/tarot/reading.ts` | API 端點（唯一 on-demand 路由） |
| `src/lib/tarot/cards.ts` | 78 張牌資料（前後端共用：前端顯示牌名、後端組提示詞） |
| `src/lib/tarot/spreads.ts` | 牌陣定義（代碼、張數、各位置名稱） |
| `src/lib/tarot/prompt.ts` | 系統提示詞與使用者訊息組裝 |
| `src/lib/tarot/ai.ts` | AI 呼叫入口：對外只暴露 `generateReading()`，依環境變數選擇供應商轉接器並負責 JSON 擷取與結構驗證 |
| `src/lib/tarot/providers/types.ts` | `ChatProvider` 介面與統一錯誤型別 `ProviderError` |
| `src/lib/tarot/providers/openai-compatible.ts` | MVP 唯一實作之轉接器：OpenAI 相容 Chat Completions 協定（MiniMax 使用；日後 OpenAI 亦可共用） |
| `src/lib/tarot/guard.ts` | 每日上限計數、自傷關鍵字預檢、輸入正規化 |
| `src/lib/tarot/config.ts` | **唯一程式常數檔**（前後端共用，只放可公開的值），見本節第 3 小節 |
| `src/lib/tarot/copy.ts` | 前端可見文案與錯誤碼 → 訊息對照表（前端使用） |
| `src/lib/tarot/server-config.ts` | 伺服器端唯一讀取 `astro:env/server` 之模組，匯出型別化設定物件 |

> ⚠️ `cards.ts`、`config.ts`、`copy.ts` 會被前端 import，**不得**放任何伺服器專用內容；提示詞與 AI 呼叫只能存在於僅被 API 路由 import 的模組。

### 3. 參數管理（單一來源原則）

> 目標：**任何一個參數只在一個地方定義**；改參數時只需改一處，不必在多個檔案搜尋同一個數字。規格書其他章節提及的數值皆為「預設值說明」，實作時一律引用本節所列之單一來源。

#### (1) 三層分類

| 層級 | 存放位置 | 適用參數 | 修改方式 |
| :--- | :--- | :--- | :--- |
| **A. 執行期設定** | VPS 環境變數檔 `/etc/starwoven/app.env`（本機為專案根目錄 `.env`），經 `astro:env` schema 讀取；配置見本小節（5） | 機密（金鑰）＋**營運上可能調整**的值：功能開關、每日上限、供應商、模型、推理強度 | 改檔案 → `systemctl restart starwoven-app`，**不需重新 build** |
| **B. 程式常數** | `src/lib/tarot/config.ts`（**唯一**常數檔，前後端共用） | 技術性、低頻變動、且多半需前後端一致的值：逾時、字數上限、body 上限、逆位開關、溫度、輸出長度 | 改檔案 → 重新 build 部署 |
| **C. 基礎設施設定** | `nginx/starwoven.conf` | nginx 自行讀取、程式無法提供的值：IP 限流速率、`client_max_body_size`、`proxy_read_timeout` | 改檔案 → `nginx -t` → reload |

**分層判斷規則**（新增參數時依序判斷）：① 是機密 → A；② 業主／營運者可能在不改程式的情況下要求調整 → A；③ 只有 nginx 能執行 → C；④ 其餘 → B。**不得**在 `config.ts` 以外的程式檔案中寫死數值常數。

> 不另設執行期讀取之 JSON／YAML 設定檔：A 層的環境變數檔已承擔「不重新 build 即可調整」的角色，再增加一個設定檔只會多一處需同步的來源。

#### (2) B 層：`config.ts` 常數清單

| 常數 | 預設值 | 使用方 | 說明 |
| :--- | :--- | :--- | :--- |
| `QUESTION_MAX_CHARS` | `120` | 前端（輸入框 `maxlength`、字數提示）＋後端（驗證） | 前後端引用同一常數，不得各自寫數字 |
| `REQUEST_BODY_MAX_BYTES` | `2048` | 後端（本機／nginx 遺漏時之防線） | 須與 C 層 `client_max_body_size 2k` 一致 |
| `SERVER_AI_TIMEOUT_MS` | `25000` | 後端（`AbortController`） | 逾時大小關係見下方 (4) |
| `CLIENT_REQUEST_TIMEOUT_MS` | `30000` | 前端 | 須大於 `SERVER_AI_TIMEOUT_MS` |
| `REVERSALS_ENABLED` | `true` | 後端（抽牌） | 業主決定不用逆位時改為 `false` |
| `AI_TEMPERATURE` | `0.8` | 後端（轉接器） | MiniMax 合法範圍 (0, 1] |
| `AI_MAX_OUTPUT_TOKENS` | 實作時依實測訂定 | 後端（轉接器） | 須足以容納推理＋JSON 輸出，避免截斷 |
| `READING_LENGTH` | 每張 80～150 字、`summary` 100～200 字、`advice` 40 字內 | 後端（提示詞＋結構驗證截斷） | 提示詞文字與驗證截斷引用同一組數值 |
| `TIMEZONE` | `'Asia/Taipei'` | 後端（每日上限重置） | |

- 牌陣定義（`spreads.ts`）、牌義資料（`cards.ts`）、系統提示詞（`prompt.ts`）屬**內容資料**，各自單檔集中，不併入 `config.ts`。
- **前端可見文案**（錯誤訊息、隱私告知、免責聲明、安全關懷文案與求助專線）集中於 `src/lib/tarot/copy.ts`，錯誤碼 → 訊息以單一對照表維護；頁面與互動腳本不得散寫文案字串。
- ⚠️ `config.ts` 與 `copy.ts` 會被打包進前端，**只能放可公開的值**；不得 import `astro:env/server` 或任何伺服器模組。

#### (3) A 層：環境變數的讀取與驗證

- 變數清單見第五節第 3 小節（4）；**實作時清單只維護於 `astro.config.mjs` 的 `env.schema`**（型別、預設值、選填與否），規格書表格僅為說明，`.env.example` 依 schema 同步列出。
- **所有 `TAROT_*` 變數一律宣告為 `context: 'server'`、`access: 'secret'`**——包含非機密的上限與開關。理由：Astro 官方文件說明 server public 變數會「end up in your final server bundle」（即建置時固定），secret 變數則不進 bundle、於執行期讀取；只有宣告為 secret，才能達成「改環境變數檔＋重啟即生效、不需重新 build」。（實作時以 build 後搜尋 bundle 驗證：調整值不應出現在 `dist/server/` 內。）
- 除 `TAROT_AI_API_KEY` 外，其餘變數於 schema 設定**預設值**（即本規格書所列預設），環境變數檔可只覆寫需要調整的項目。
- **`TAROT_AI_API_KEY` 宣告為選填（`optional: true`），無預設值**。理由：Astro 於 `astro build` 時即驗證 secret，若設為必填，任何沒有金鑰的環境（新 clone、其他協作者或 AI 只為 build 靜態頁）都會 build 失敗——不能讓抽卡功能成為全站建置的前置條件。缺少金鑰時：
  - `server-config.ts` 將功能判定為停用（`enabled = TAROT_ENABLED && 金鑰非空`），端點回 `DISABLED`（503），其餘頁面不受影響；
  - 首次載入設定時寫入一行錯誤 log（`TAROT_AI_API_KEY missing; tarot disabled`），供部署後於 `journalctl` 檢查；
  - 部署驗收（第九節）須確認此錯誤 log **不存在**。
- 啟用 `env.validateSecrets: true`，服務**啟動時**即驗證型別（例如上限填了非數字），型別錯誤直接啟動失敗、systemd log 可見，不在第一個訪客請求時才失敗。
- **推理強度停用以明確哨兵值表示**：`TAROT_AI_REASONING_EFFORT` 預設 `low`；設為 **`none`** 時轉接器**不送出** `reasoning_effort` 參數（供不支援此參數之模型使用）。不以「留空」表示停用——Astro 將空字串視為未設定並套用預設值，留空仍會送出 `low`。`none` 為本系統自訂值，**不會原樣轉送供應商**（MiniMax 收到 `none` 會回 400）。schema 以列舉限定合法值：`none`／`low`／`medium`／`high`／`xhigh`／`max`。
- 伺服器端統一由 `src/lib/tarot/server-config.ts` 讀取 `astro:env/server` 並匯出型別化設定物件；其他後端模組只 import 此物件，**不得**各自讀取環境變數或 `process.env`。

#### (4) 跨層一致性約束

部分參數分屬不同層、但數值必須維持關係；以「雙向註解」標示——`config.ts` 該常數旁註明對應的 nginx 指令，`starwoven.conf` 該指令旁註明對應的 `config.ts` 常數，改任一處時依註解連動檢查。

| 約束 | 涉及位置 |
| :--- | :--- |
| 逾時：nginx `proxy_read_timeout`（35s）＞ `CLIENT_REQUEST_TIMEOUT_MS`（30s）＞ `SERVER_AI_TIMEOUT_MS`（25s） | C 層＋B 層 |
| body 上限：`client_max_body_size 2k` ＝ `REQUEST_BODY_MAX_BYTES`（2048） | C 層＋B 層 |
| body 上限須足以容納 `QUESTION_MAX_CHARS` 字（UTF-8 中文每字 3 bytes，120 字約 360 bytes，餘裕充足） | B 層內 |

- 驗收時（第九節）逐項核對上表；`config.ts` 內以啟動時斷言（assert）檢查 B 層內部的大小關係（例如前端逾時大於後端逾時），違反即建置／啟動失敗。

#### (5) 環境變數檔配置（本機 vs 伺服器）

依「誰、在何時讀取」分配，不依功能拆檔：

| 環境 | 檔案 | 內容 | 讀取者／時機 |
| :--- | :--- | :--- | :--- |
| 本機開發／建置 | 專案根目錄 **`.env`**（單一檔案，git-ignored） | `PUBLIC_*`（GA、許願池 API）＋ `TAROT_*`（供 `npm run dev` 測試） | Astro／Vite 於 `dev`、`build` 時自動載入 |
| VPS 執行期 | **`/etc/starwoven/app.env`**（權限 `600`） | 僅 `TAROT_*`＋`HOST`／`PORT` | systemd 經 `EnvironmentFile` 注入 Node 服務 |
| 版本控制 | `.env.example` | 全部變數名稱＋非機密範例值（`TAROT_AI_API_KEY` 留空） | 人工參考 |

- **本機不拆檔**：Astro 只自動載入 `.env`（及 `.env.[mode]`），自行拆出 `tarot.env` 需額外載入機制，徒增複雜度。
- **VPS 不需要 `PUBLIC_*`**：`PUBLIC_*` 於 build 時已內嵌進 `dist/client/` 的前端程式碼，執行期無人讀取。
- **伺服器檔名以服務命名**（`app.env` 對應 `starwoven-app`）而非功能命名，日後同一 Node 服務增加其他 API 時不需更名。
- ⚠️ **任何環境變數檔不得放入 `/var/www/starwoven`**（nginx 對外提供之目錄）或 `/opt/starwoven-app/dist/` 內；部署上傳 `dist/` 時亦不得夾帶 `.env`。

---

## 四、 API 合約

### 1. 請求

`POST /api/tarot/reading`，`Content-Type: application/json`

```json
{
  "spread": "three",
  "question": "最近工作上該不該轉換跑道？"
}
```

| 欄位 | 型別 | 規則 |
| :--- | :--- | :--- |
| `spread` | string | 必填；白名單 `single` / `three` |
| `question` | string | 選填；去除首尾空白後 ≤ 120 字（以 Unicode 字元計）；移除控制字元；空字串視為無問題 |

請求 body 上限 2 KB；超過直接 413。正式環境由 nginx `client_max_body_size 2k` 先行攔截（回應為 nginx 預設 HTML，非 JSON）；端點本身仍保留同一上限檢查並回傳 JSON `PAYLOAD_TOO_LARGE`，作為本機開發（無 nginx）與 nginx 設定遺漏時的防線。

### 2. 成功回應（200）

```json
{
  "ok": true,
  "spread": "three",
  "cards": [
    { "position": "過去", "id": "major-16", "name": "高塔", "reversed": false },
    { "position": "現在", "id": "cups-03", "name": "聖杯三", "reversed": true },
    { "position": "未來", "id": "major-17", "name": "星星", "reversed": false }
  ],
  "reading": {
    "cards": ["……（對應每張牌的解讀，順序同 cards）"],
    "summary": "……整體訊息",
    "advice": "……一句溫柔的建議"
  },
  "notice": "本解讀由 AI 依牌義生成，僅供參考與自我覺察。"
}
```

### 3. 錯誤回應

| HTTP | `error` 代碼 | 前端顯示 | 情境 |
| :--- | :--- | :--- | :--- |
| 400 | `INVALID_REQUEST` | 「請重新選擇牌陣後再試一次」 | 格式錯誤、牌陣不在白名單、問題超長 |
| 403 | `FORBIDDEN_ORIGIN` | （不顯示細節，同通用錯誤） | Origin 非本站 |
| 413 | `PAYLOAD_TOO_LARGE` | 同 400 | body 超過上限（正式環境多為 nginx HTML 413） |
| 429 | `RATE_LIMITED` | 「抽牌太頻繁了，休息一下再回來吧」 | nginx 依 IP 限流 |
| 429 | `DAILY_LIMIT` | 「今日星靈休息中，明天再來抽牌吧」 | 達每日全站上限或該 IP 每日上限 |
| 503 | `DISABLED` | 「抽卡功能暫停中」 | 功能開關關閉 |
| 502 | `AI_FAILED` | 「星靈訊號不穩，請稍後再試」＋重試鈕 | AI 逾時、供應商錯誤、回傳結構驗證失敗 |
| 503 | `AI_BUSY` | 「星靈暫時休息中，請稍後再來」（無重試鈕） | 供應商回傳 429（訂閱額度與 Credit packs 皆用盡，或 RPM／TPM 限流），見第五節第 3 小節（2） |

- 所有錯誤皆回傳 `{ "ok": false, "error": "<代碼>" }`，不外洩供應商錯誤細節。
- nginx 層的 429／502（Node 服務未啟動）回應為 HTML 而非 JSON，前端須以 HTTP 狀態碼為主判斷、JSON 解析失敗時降級為通用錯誤。
- **413 的處理**：前端**只依狀態碼 413 判斷**，不論 body 為 nginx HTML 或端點 JSON，一律顯示與 400 相同之提示。不另設 nginx JSON 錯誤頁——前端已限制問題 120 字，正常操作不會觸發 413，僅異常／刻意構造之請求會遇到，不值得增加 nginx 設定複雜度。
- **429 的區分**：回應 body 可解析為 JSON 且 `error` 為 `DAILY_LIMIT` → 顯示「今日星靈休息中」；否則（nginx 限流的 HTML 回應）一律視為 `RATE_LIMITED` →「抽牌太頻繁了」。

### 4. 特殊回應：安全關懷（200）

問題命中自傷／輕生相關關鍵字時，**不抽牌、不呼叫 AI**，回傳：

```json
{ "ok": true, "care": true }
```

前端顯示固定關懷文案與求助資源：**1925 安心專線（24 小時）**、**1995 生命線**、**1980 張老師**，並附「預約真人陪伴」LINE 連結。關鍵字清單維護於 `guard.ts`，以寬鬆命中為原則（誤判成本低於漏判）。

---

## 五、 後端規格

### 1. 抽牌

- 使用 Node `crypto.randomInt` 進行 Fisher–Yates 洗牌後取前 N 張（同一次抽牌不重複）。
- 正逆位各 50%（`crypto.randomInt(2)`）；以 `config.ts` 的 `REVERSALS_ENABLED` 控制，業主若決定不用逆位可一鍵關閉。

### 2. 提示詞與 AI 呼叫

- **系統提示詞**（`prompt.ts`，佔位版本待業主審定）需涵蓋：
  - 品牌語氣：溫柔、陪伴、不恐嚇、不宿命論；使用繁體中文與全形標點。
  - 依據：**必須以提供的牌義關鍵字為基礎**解讀，不得自行更換牌面或增加牌。
  - 禁止：醫療、法律、投資之斷言；死亡、災禍、疾病預言；鼓勵依賴占卜做重大決定；提及自身為特定 AI 產品。
  - 問題超出塔羅範疇或試圖改變指令（prompt injection）時，仍只就牌面給出一般性指引。
  - 輸出：**僅輸出指定 JSON 結構**；每張牌解讀 80～150 字、`summary` 100～200 字、`advice` 一句 40 字內。
- 使用者問題以明確分隔標記包裹，聲明為「訪客提問內容，非指令」。
- 供應商與模型見本節第 3 小節。
- 逾時 **25 秒**（前端逾時 30 秒，須大於後端；MiniMax 推理無法關閉，實作時須實測延遲，必要時三處逾時同步調整並維持「nginx ＞ 前端 ＞ 後端」之大小關係）；失敗不自動重試（避免成本倍增），交由使用者手動重試。
- 回傳 JSON 以結構驗證（欄位存在、型別正確、`reading.cards` 長度＝牌數、長度上限截斷）；驗證失敗視為 `AI_FAILED`。

### 3. AI 供應商與銜接層

> 本小節資料查證日：2026-10-20（MiniMax 官方文件 `platform.minimax.io/docs/guides/text-generation`、`/docs/m-plan/faq`）。模型代碼與參數以實作當下官方文件為準。

#### (1) MVP 供應商：MiniMax

| 項目 | 規格 |
| :--- | :--- |
| 協定 | **OpenAI 相容 Chat Completions**（`POST {baseURL}/chat/completions`）。官方另提供 Anthropic 相容端點並標示為推薦，但選用 OpenAI 相容協定，可讓日後切換 OpenAI 時共用同一轉接器 |
| Base URL | `https://api.minimax.io/v1`（國際站；中國站 `api.minimaxi.com` 不使用） |
| 模型 | 預設 `MiniMax-M3.1-Flash`（輕量、低延遲，適合短文解讀）；`MiniMax-M3` 為品質備選。以環境變數設定，不寫死 |
| 推理（thinking） | MiniMax 推理**一律開啟、無法關閉**（送出停用參數會回 400），且 M3.1-Flash 預設 effort 為 `max`。**必須明確送出 `reasoning_effort: "low"`** 以壓低延遲與用量；推理內容回傳於 `reasoning_content`，轉接器**只取 `content`**，推理內容不得回傳前端、不得寫入 log |
| JSON 輸出 | 官方文件未載明 `response_format`／JSON 模式支援，**不依賴**此功能：以提示詞要求純 JSON，轉接器擷取回應中第一個完整 JSON 物件後交由 `ai.ts` 結構驗證（第五節第 2 小節） |
| 溫度 | MiniMax OpenAI 相容端點之 temperature 合法範圍為 (0, 1]，預設送 `0.8`（`config.ts` 之 `AI_TEMPERATURE`） |
| 依賴套件 | **不安裝供應商 SDK**，以 Node 內建 `fetch`＋`AbortController`（逾時）實作，避免新增依賴 |

#### (2) 金鑰類型：Demo 期間使用開發者之 MiniMax 訂閱金鑰（開發者決定，已知風險接受）

- **決定**：MVP Demo 期間（含部署於正式 VPS）使用開發者既有之 MiniMax 訂閱方案金鑰（Coding Plan，固定月費 10 USD）。按量計費金鑰待業務量成長、具營收後再評估切換——切換只需更換 `TAROT_AI_API_KEY`（及必要時 `TAROT_AI_BASE_URL`），不需改程式碼。
- **已知事實（MiniMax 官方 FAQ，2026-10-20）**：訂閱金鑰與按量計費金鑰不可互換；官方將訂閱方案定位為「individual, interactive developer use」，並建議正式環境採按量計費。
- **開發者之判斷與接受之風險**：本功能免費、不收費、初期流量極低，屬商業可行性驗證；在應用端尚無營收前以按量計費承擔驗證成本不符實務。條款灰色地帶之風險由開發者知情接受，記錄於 DEC-073。
- **額度用盡的實際行為（依 MiniMax 官方 FAQ）**：訂閱方案採 5 小時與每週用量窗口，且與開發者本人之開發工具共用額度。窗口額度用盡後，MiniMax **預設會繼續扣除帳號內的 Credit packs**，Credit packs 也用盡後才會被拒（HTTP 429）。故「額度用盡即停止服務」只在帳號無可用 Credit packs 時成立。
  - **開發者決定（知情接受）**：帳號現有 Credit packs 為官方贈送、未使用亦會到期失效，**接受被網站訪客流量扣用**，不另做用量防護設計。
  - ⚠️ **提醒**：日後若在同一帳號**自行購買** Credit packs（例如為開發工具加購），網站流量會一併扣用付費額度；購買前應先評估，必要時以 `TAROT_ENABLED=false` 暫停本功能或調低 `TAROT_DAILY_LIMIT`。
  - 不做備援供應商、不自動切換付費金鑰。最終被拒時：供應商回傳 HTTP 429 → 端點回 `AI_BUSY`，前端顯示「星靈暫時休息中，請稍後再來」（不顯示重試鈕，避免訪客連續重試）。
  - **`AI_BUSY` 同時釋放全站與 IP 保留額度**（與 `AI_FAILED` 不同）：供應商 429 代表請求被拒、未執行、未計費；若不釋放全站額度，供應商短暫 RPM／TPM 限流（官方說明通常約一分鐘恢復）期間的跨 IP 請求即可耗盡全站上限，供應商恢復後網站仍整天回 `DAILY_LIMIT`。
- **應用層每日全站上限的意義隨之調整**：該上限主要用途為**保護開發者自身的開發工具額度（及 Credit packs）**不被網站訪客耗盡；預設 300 次／日，開發者可依實際額度消耗以 `TAROT_DAILY_LIMIT` 調整。

#### (3) 銜接層設計（預留，MVP 只實作 OpenAI 相容轉接器）

```ts
// src/lib/tarot/providers/types.ts（介面）
interface ChatProvider {
  complete(req: {
    system: string;
    user: string;
    maxOutputTokens: number;
    temperature: number;
    signal: AbortSignal;          // 逾時控制
  }): Promise<{ text: string }>;  // 只回傳最終文字；推理內容一律丟棄
}
```

- `ai.ts` 依 `TAROT_AI_PROVIDER` 選擇轉接器；MVP 僅接受 `openai-compatible`，其他值於服務啟動時即報錯（fail fast，不在請求時才失敗）。
- **切換 OpenAI**：同屬 OpenAI 相容協定，原則上只改環境變數（Base URL、模型、金鑰、推理強度）。屆時再評估以 OpenAI 的 `response_format`（JSON Schema）取代提示詞擷取 JSON——列為轉接器內部之選用能力，不影響 `ai.ts` 介面。
- **其他供應商**（Anthropic、Gemini 原生 API 等）：新增一個實作 `ChatProvider` 的檔案並登錄於 `ai.ts` 即可；提示詞組裝、JSON 擷取、結構驗證、額度保留、錯誤碼對應皆不需改動。
- 供應商錯誤（HTTP 4xx／5xx、逾時、網路錯誤、空回應）在轉接器內一律轉為統一的 `ProviderError`（帶 `kind: 'rate_limited' | 'failed'`；供應商 HTTP 429 為 `rate_limited`，其餘為 `failed`），由端點分別對應為 `AI_BUSY`／`AI_FAILED`；原始錯誤訊息只寫入伺服器 log（不含請求內容），不回傳前端。

#### (4) 伺服器環境變數（`astro:env` server secret／server 變數）

| 變數 | 範例 | 說明 |
| :--- | :--- | :--- |
| `TAROT_ENABLED` | `true` | 功能開關 |
| `TAROT_AI_PROVIDER` | `openai-compatible` | 轉接器選擇（MVP 唯一合法值） |
| `TAROT_AI_BASE_URL` | `https://api.minimax.io/v1` | 供應商端點 |
| `TAROT_AI_MODEL` | `MiniMax-M3.1-Flash` | 模型代碼 |
| `TAROT_AI_API_KEY` | （機密） | **secret、選填**（缺少即功能停用，見第三節第 3 小節（3））；Demo 期間為 MiniMax 訂閱金鑰，日後可換按量計費金鑰 |
| `TAROT_AI_REASONING_EFFORT` | `low` | 推理強度；設為 `none` 則不送此參數（供不支援推理之模型使用）；**留空無效**（會套用預設 `low`） |
| `TAROT_DAILY_LIMIT` | `300` | 每日全站上限 |
| `TAROT_IP_DAILY_LIMIT` | `10` | 每 IP 每日上限 |

- 皆**不得**以 `PUBLIC_` 開頭；`.env.example` 只列變數名稱與非機密範例值。
- 每日上限改為環境變數（原為程式常數），業主調整次數時只需改環境變數檔並重啟服務，不需重新 build。
- 本表為說明用途；**變數之單一來源為 `astro.config.mjs` 的 `env.schema`**，宣告方式與驗證規則見第三節第 3 小節（3）。

### 4. 防濫用與成本控制

| 層級 | 機制 | 預設值（暫定） |
| :--- | :--- | :--- |
| 供應商 | MiniMax 訂閱方案固定月費（10 USD）＋用量窗口＋帳號內 Credit packs | 窗口用盡後先扣 Credit packs（現有為贈送額度，開發者接受扣用），皆用盡才回 `AI_BUSY` |
| 應用層 | 每日全站 AI 呼叫次數上限（呼叫前保留，台灣時間 00:00 重置） | 300 次／日 |
| 應用層 | 每 IP 每日上限（以 nginx 傳入 `X-Real-IP` 判斷） | 10 次／日 |
| nginx | `limit_req` 依 IP | 每分鐘 3 次，burst 2 |
| 應用層 | 功能開關 `TAROT_ENABLED` 環境變數 | `true` |

- **額度保留（呼叫 AI 前）**：通過格式驗證、功能開關與自傷預檢後，於**呼叫 AI 之前**、在同一段同步程式碼內（中間不得有 `await`）完成「檢查全站與 IP 剩餘額度 → 雙雙遞增」。Node 為單執行緒，同步區段天然不可分割，故等待 AI 回應的 5～15 秒期間，後續請求看到的皆是已遞增的計數，無法併發穿透上限。
  - 任一額度不足 → 直接回 `DAILY_LIMIT`，不遞增、不呼叫 AI。
  - AI 成功 → 保留轉為正式計數，不需額外動作。
  - AI 失敗（`AI_FAILED`）→ **只釋放該 IP 的保留額度**（使用者重試不被扣次數）；**全站額度不釋放**——逾時或結構驗證失敗時請求已實際送出、供應商多半已扣用額度，全站上限應計入所有可能被扣用的 AI 呼叫。
  - 供應商限流（`AI_BUSY`，供應商 HTTP 429）→ **全站與 IP 保留額度皆釋放**——請求被拒、未扣用，理由見第五節第 3 小節（2）。
  - 安全關懷回應（`care`）與所有在保留前即被拒的請求（400／403／413／503）皆不消耗額度。
- 應用層計數存於 **Node 程序記憶體**；服務重啟即歸零。MVP 接受此限制（重啟頻率低，且供應商月上限為最終保險）；計數只存 IP 雜湊與次數，每日清空。
- 端點驗證 `Origin` 標頭須為 `https://starwoven.xyz` 或 `https://www.starwoven.xyz`（本機開發另允許 `http://localhost:4321`）；僅接受 `application/json`。
- 注意：Origin 檢查與 IP 限流都能被刻意繞過（換 IP、偽造標頭），**真正的硬上限是每日全站上限與供應商月上限**。

### 5. Log 與隱私

- 伺服器 log 只記：時間、牌陣、結果代碼、耗時、是否命中上限。**不記問題、不記解讀、不記完整 IP**。
- nginx access log 不含 POST body（預設即如此），維持現狀。
- 頁面於問題輸入框下方註明：「你的問題只用於本次解讀，我們不會保存；解讀由第三方 AI 服務生成。」
- 訪客問題會傳送至 MiniMax（國際站）處理；頁面告知文案已載明「解讀由第三方 AI 服務生成」。MiniMax 資料保留／訓練使用政策 **Demo 階段暫不查證**（開發者決定），若日後轉為正式營運再確認並調整告知文案。

---

## 六、 前端規格（`/tarot`）

### 1. 頁面狀態機

```
選擇牌陣 → 輸入問題（選填）→ 洗牌動畫 → 扇形牌堆，訪客點選 N 張（儀式）
       → 送出請求（此時起顯示「星靈正在編織訊息…」等待動畫）
       → 依序翻牌（牌名＋正逆位）→ 逐段淡入解讀 → 導流 CTA ＋「再抽一次」
```

- **請求時機**：訪客點選完最後一張牌時送出；翻牌動畫在 API 回傳後才開始，避免「翻開的牌與後端抽出的不一致」。
- 等待期間以動畫填補（AI 回應預估 5～15 秒）；超過 30 秒顯示 `AI_FAILED` 錯誤與重試鈕。
- 送出期間鎖定按鈕防重複送出（比照許願池 pending 鎖）。
- 「再抽一次」回到選擇牌陣狀態，清空前次結果。

### 2. 視覺與無障礙

- 預設主題沿用 `Layout` 的 `auto`（內頁＝淺色水彩），深色模式完整適配；配色沿用既有 hex（`#2E2A4F`、`#8FB8E8`、`#FCE794` 等）。
- 標題 `font-huninn`；牌名同時顯示中英文。
- 逆位以牌面旋轉 180° 呈現，並以文字標示「逆位」（不只靠視覺）。
- 尊重 `prefers-reduced-motion`：減少動畫時改為直接淡入。
- 解讀區塊設 `aria-live="polite"`；點選牌可用鍵盤（Tab＋Enter／Space）操作。
- `<title>` 與 meta description 個別設定；**Demo 期間加 `noindex`**（`Layout.astro` 目前無此 prop，需新增選用 `noindex?: boolean`，屬共用元件變更）。

### 3. GA4 事件（不含問題內容）

| 事件 | 參數 |
| :--- | :--- |
| `tarot_start` | `spread` |
| `tarot_reading_success` | `spread`、`has_question`（布林） |
| `tarot_reading_error` | `error` 代碼 |
| LINE CTA 點擊 | 沿用 `GoogleAnalytics.astro` 既有 LINE 轉換事件監聽 |

---

## 七、 牌義資料與素材（佔位處理）

### 1. 牌義資料（`cards.ts`）

```ts
{
  id: 'major-00',            // major-00~21；wands/cups/swords/pentacles-01~14
  nameZh: '愚者',
  nameEn: 'The Fool',
  arcana: 'major',           // major | minor
  suit: null,                // wands | cups | swords | pentacles | null
  upright: ['新的開始', '自由', '冒險'],
  reversed: ['魯莽', '猶豫', '錯失時機'],
  image: null,               // null → 佔位視覺；日後填入 /assets/tarot_xxx_v1.webp
}
```

- 中文牌名採台灣常見譯名；關鍵字 MVP 階段以通用牌義填入，**檔案頂端與本節皆標示「佔位內容，待占卜師（以恩、達達）審定」**。
- 宮廷牌命名（侍者／騎士／皇后／國王）與譯名差異待占卜師確認。

### 2. 牌面圖片

- MVP **不製作 78 張牌面**：統一使用品牌牌背（CSS／SVG 繪製，沿用全站佔位視覺風格），翻牌後牌面為「佔位卡」——顯示中英文牌名、大小阿爾克那／花色符號、正逆位標示。
- 後續選項（待業主決定，屆時另立 DEC）：① 1909 年 Pamela Colman Smith 原版偉特牌（一般認為已屬公有領域；不得使用後世重繪、上色之受版權保護版本）② ComfyUI 自繪 78 張品牌風格牌面。
- 任何牌面圖上架仍須依 `AGENTS.md` 素材規範：WebP、命名代碼登錄 `image_prompts.md`、人工把關。

---

## 八、 部署變更（Hetzner VPS）

### 1. 伺服器端

- 安裝 Node.js LTS（arm64）。
- 目錄規劃：
  - `/var/www/starwoven/` ← `dist/client/` 內容（**nginx root 不變**）
  - `/opt/starwoven-app/` ← 完整 `dist/`（Node 服務自 `dist/server/entry.mjs` 啟動）
- 環境變數檔 `/etc/starwoven/app.env`（權限 `600`，擁有者 root；systemd 以 root 讀取後注入服務程序，服務帳號本身不需讀取權限）：第五節第 3 小節（4）中需覆寫的變數，加上 `HOST=127.0.0.1`、`PORT=4321`。
- systemd unit `starwoven-app.service`：
  - **`EnvironmentFile=/etc/starwoven/app.env`**——環境變數檔不會自行進入 Node 程序環境，未設定此行則 `astro:env/server` 讀不到任何 `TAROT_*`（金鑰缺少 → 功能停用；其餘回落預設值）。
  - `User=` 指定非 root 服務帳號、`Restart=on-failure`、`WantedBy=multi-user.target`（開機自動啟動）；`ExecStart=/usr/bin/node /opt/starwoven-app/dist/server/entry.mjs`（node 路徑以實際安裝位置為準）。
  - 只監聽 `127.0.0.1`。
  - 修改 `app.env` 後須 `systemctl restart starwoven-app` 才生效；修改 unit 檔本身則需先 `systemctl daemon-reload`。
- `EnvironmentFile` 格式注意：每行 `KEY=value`，不支援 `export` 前綴與 shell 變數展開；值含空白時以雙引號包住。

### 2. nginx（`nginx/starwoven.conf`）

- **檔案頂層（`server {}` 之外）**新增 `limit_req_zone`——該指令只能位於 `http` context；本檔經 `sites-enabled` 被 include 於 `http {}` 內，故置於檔案頂層有效。
- `server {}` 內新增 `location /api/`：`limit_req`＋**`limit_req_status 429;`**（nginx 預設拒絕碼為 503，未設定時前端無法顯示「抽牌太頻繁」提示）、`proxy_pass http://127.0.0.1:4321`、傳遞 `X-Real-IP`、`client_max_body_size 2k`、`proxy_read_timeout 35s`。
- ⚠️ nginx 陷阱：`location` 內若出現任何 `add_header`，**server 層的安全標頭將不再繼承**。`/api/` 區塊不新增 `add_header`；若必須新增，需重列全部安全標頭。
- 本變更修改既有 server block，與 `AGENTS.md`「never edit existing server blocks」規則衝突，**由 DEC-073 明文授權例外**；`location /reiki`、`/akashic` 301 與靜態快取規則不動。

### 3. 部署流程（新）

1. 本機 `npm run build`
2. 上傳 `dist/client/` → `/var/www/starwoven/`（同既有流程，僅來源路徑改變）
3. 上傳 `dist/` → `/opt/starwoven-app/`，執行 `systemctl restart starwoven-app`
4. `nginx -t` 通過後 `systemctl reload nginx`（僅 nginx 設定有變時）

### 4. 回滾方案

- **只停用抽卡**：`TAROT_ENABLED=false` 後重啟服務（前端顯示「抽卡功能暫停中」）；或直接 `systemctl stop starwoven-app`（`/api/` 回 502，其餘頁面正常）。
- **完全退回純靜態**：git revert 本功能 commit → 重新 build → 上傳；nginx 移除 `location /api/` 與 `limit_req_zone` → reload。因 nginx root 未變更，退回不需調整其他設定。

---

## 九、 驗收標準

1. `npm run build` 通過；`dist/client/` 內既有 11 頁產出與變更前一致（`/tarot` 為新增第 12 頁）。
2. 前端 bundle 搜尋不到金鑰、供應商網域與系統提示詞內容。
3. 本機 `npm run dev` 下兩種牌陣皆可完成完整流程；深淺模式、手機（iOS Safari、Android Chrome）、桌面各實測一次。
4. 錯誤路徑逐一實測：超長問題（400）、錯誤 Origin（403）、連續請求（nginx 429）、每日上限（暫調低為 2 驗證 `DAILY_LIMIT`）、`TAROT_ENABLED=false`（503）、停止 Node 服務（前端顯示通用錯誤、其他頁面正常）、AI 逾時（以極短逾時模擬 502）。
5. 自傷關鍵字測試句命中關懷訊息、未呼叫 AI。
6. 伺服器 log 抽查：無問題原文、無解讀內容、無完整 IP。
7. 線上 `/tarot` 含 `noindex`、未出現在導覽列；既有頁面（含 `/reiki` 301、許願池）運作正常。
8. 部署後 `journalctl -u starwoven-app` 無 `TAROT_AI_API_KEY missing` 錯誤；在無 `.env` 的乾淨 clone 執行 `npm run build` 可通過。以 MiniMax 訂閱金鑰實測：`reasoning_effort: low` 下單次解讀延遲落在逾時設定內、回應不含推理內容；以模擬供應商 429 驗證前端顯示 `AI_BUSY` 提示。
9. 參數管理：程式碼中除 `config.ts` 外搜尋不到寫死的逾時、字數、上限數值；第三節第 3 小節（4）跨層約束逐項核對通過；`TAROT_AI_REASONING_EFFORT=none` 時請求不含 `reasoning_effort` 參數；於 VPS 修改 `TAROT_DAILY_LIMIT` 並重啟服務（不重新 build）後新值生效；`dist/server/` 內搜尋不到金鑰與 `TAROT_*` 調整值。

---

## 十、 待業主決定事項（不阻擋 MVP 實作）

1. AI 解讀定位：免費引流／付費服務？是否與「離線文字占卜一題 300 元」衝突？占卜師們是否接受 AI 解牌？
2. 是否上線至主導航、名稱（線上抽卡／星靈抽牌…）與位置。
3. 牌陣種類、是否使用逆位。
4. 牌義關鍵字與系統提示詞語氣審定（建議由偉特塔羅占卜師以恩、達達負責）。
5. 牌面圖路線（公有領域原版／ComfyUI 自繪）。
6. 每月 AI 預算上限與每日次數上限。
7. （日後，具營收時）是否由 MiniMax 訂閱金鑰切換為按量計費金鑰或其他供應商。

---

## 十一、 給設計審查者的重點（Review Checklist）

請先閱讀 `AGENTS.md`、`decisions.md`（DEC-067、DEC-073）、`nginx/starwoven.conf`、`astro.config.mjs`、`src/layouts/Layout.astro`，再就下列面向審查：

1. **架構**：`output: 'static'`＋單一 `prerender = false` 路由＋Node standalone 的組合在 Astro 5 是否成立；建置輸出與部署目錄規劃是否有遺漏。
2. **金鑰安全**：`astro:env` secret 是否確保執行期讀取、不被內嵌；前後端共用模組是否可能把伺服器內容打包進前端。
3. **API 合約**：輸入驗證、錯誤碼完整性、nginx 層非 JSON 錯誤的前端處理。
4. **防濫用與成本**：三層上限是否足夠；記憶體計數重啟歸零的風險是否可接受；Origin 檢查的實際效力。
5. **提示詞安全**：prompt injection 防護、輸出結構驗證、自傷預檢的設計。
6. **隱私**：log 規劃是否真的不留問題內容；頁面告知文案是否足夠。
7. **nginx**：`limit_req_zone` 位置、`add_header` 繼承陷阱、逾時設定與前後端逾時的大小關係。
8. **回滾**：兩種回滾路徑是否可行、是否影響既有頁面。
9. **範疇**：是否有超出 MVP 的設計應刪減，或遺漏的必要項目。
10. **AI 供應商（v0.4 新增）**：`ChatProvider` 介面是否足以銜接其他供應商而不過度設計；不依賴 JSON 模式之擷取＋驗證策略；推理內容的隔離；訂閱金鑰額度用盡時之 `AI_BUSY` 路徑（金鑰類型為開發者已定案之決定，**不在審查範圍**）；環境變數設計。
11. **參數管理（v0.6 新增，第三節第 3 小節）**：三層分類是否清楚、是否仍有參數未歸入單一來源；全部 `TAROT_*` 宣告為 secret 以達成執行期調整之推論是否正確；跨層一致性約束是否完整。
