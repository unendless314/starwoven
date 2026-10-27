# 星靈織語 Starwoven — AI 互動功能共用基礎設施規格書 v0.5

> **文件狀態**：v0.5 **設計審查通過；第一階段已上線（驗收通過）**（2026-10-27），可進入第二階段（DEC-080）。對應決策 `decisions.md` DEC-079。
> **沿革**：v0.1 初稿 → 第一輪設計審查 7 項（P1×1、P2×3、P3×3）全數採納（v0.2）：遷移對照表補上呼叫端 import 規則（`tarot.astro` 之 `CARE_COPY` 等）；端點欄位驗證改為「未知欄位忽略」以維持 v0.9 合約；遷移改稱「新舊變數並存」並明載部署重啟數秒之 502 非零停機；回應標頭要求限定 Node 產生之回應；可觀察差異增列缺金鑰 log 字串；未登錄 `/api/*` 之回應依是否符合靜態副檔名分述；`tarot_plan.md` 殘留之 `/api/` 指引更正。→ 第二輪審查 1 項 P2 採納（v0.3）：呼叫端清單補上檔案內部引用（`tarot/copy.ts` 之 `ErrorCode` 型別、`tarot/config.ts` 之斷言），parity 驗收新增 `astro check` 0 errors（`npm run build` 不做型別檢查）。→ 第三輪審查 1 項 P2 採納（v0.4）：溫度範圍斷言明定為共用函式 `assertAiTemperature`，遷移清單補列 `tarot/config.ts` 之第三個斷言；另逐一盤點 `src/lib/tarot/` 全部 export 與內部引用，補明 `guard.ts` 之 `Reservation` 型別與內部依賴。→ 第四輪審查無新問題，設計審查通過。→ 第一階段實作（v0.5）：依實作補明兩處介面細節——`postReading` 新增第三參數 `isValid`（各功能成功回應結構檢查，原塔羅 `isValidReading` 之呼叫點）、`http.ts` 新增 `errorResponse(code)`（錯誤碼 → `ERROR_STATUS` 之 JSON 回應）；本機 parity 驗收結果見 DEC-079。
> **定位**：線上塔羅抽卡（`tarot_plan.md`）與後續 AI 互動小遊戲（第一個為占星抽卡，規格另立 `astro_cards_plan.md`）共用之伺服器基礎設施——AI 供應商銜接、參數管理、防濫用與額度、輸入守門、API 慣例、nginx、部署。各功能規格書只寫該功能專屬內容（資料、提示詞、API 欄位、頁面），共用部分一律引用本文件。
> **來源**：本文件第三、五～八節之內容原屬 `tarot_plan.md` v0.9（已經五輪外部審查與雲端維運 agent 核對），v0.1 搬移時依「多功能共用」改寫；搬移前之審查紀錄保留於 `tarot_plan.md` 沿革摘要與 `decisions.md` DEC-073／DEC-074，本文件不重複。
> **實作分兩階段**：
> - **第一階段（DEC-079）**：純重構——將塔羅程式中的共用部分抽出至 `src/lib/ai/`，**塔羅之 API 合約、頁面與行為不變**；部署並驗收後才進入第二階段。遷移計畫見第九節。
> - **第二階段（DEC-080，另立）**：新增占星抽卡，只新增檔案與設定區塊，不再修改塔羅程式。新增功能檢查清單見第十節。

---

## 一、 設計原則（全部 AI 功能共同遵守）

1. **金鑰永不進前端**：AI API 金鑰只存在於 VPS 伺服器端環境變數；前端 bundle 不得含任何金鑰、供應商端點或系統提示詞。
2. **靜態優先、動態最小化**：全站維持 `output: 'static'`；每個 AI 功能**只新增一支 on-demand API 路由**，功能頁面本身仍為預先產生之靜態 HTML。Node 服務故障時只影響 AI 功能，其餘頁面由 nginx 照常提供。
3. **伺服器決定結果**：抽牌等隨機結果由後端以 `node:crypto` 亂數產生；前端互動為儀式性，不決定實際結果（防竄改、防把 API 當作任意輸入的解讀器）。
4. **單一用途端點**：端點只接受「功能代碼（牌陣等）＋限長問題」，系統提示詞寫死於伺服器，回應為固定 JSON 結構——無法被當作通用聊天 AI 使用。
5. **不保存使用者內容（隱私）**：問題與解讀**不寫入任何資料庫、檔案或 log**；伺服器只記錄匿名統計。
6. **成本有上限**：供應商訂閱方案額度＞各功能每日全站上限＞各功能每 IP 每日上限＞nginx 依 IP 限流（第六節）。
7. **不捏造內容**：牌義、提示詞語氣等內容資料於審定前為佔位內容，資料檔與頁面明確標示「待審定」。
8. **共用基礎設施、各自內容與頁面**：只共用「各功能明顯完全相同」的伺服器機制；內容資料、提示詞、結構驗證、前端頁面與動畫各功能獨立，不做設定檔驅動之通用占卜引擎（第二節第 3 小節）。

---

## 二、 架構與程式配置

### 1. 系統架構

```
訪客瀏覽器
  └─ GET  /<feature>                 → nginx 直接回傳靜態 HTML（/var/www/starwoven）
  └─ POST /api/<feature>/reading     → nginx（location /api/<feature>/，各功能獨立 limit_req zone）
                                         └─ proxy_pass → 127.0.0.1:4321（同一個 Astro Node 服務，systemd starwoven-app）
                                              1. 共用請求檢查（Origin、Content-Type、body 上限、JSON 物件）
                                              2. 功能欄位驗證（各功能）
                                              3. 功能開關（各功能開關 ＋ 共用金鑰存在）
                                              4. 自傷關鍵字預檢（共用）→ 命中則回固定關懷回應
                                              5. 同步保留額度（各功能各一份計數，共用實作）
                                              6. crypto 亂數產生結果（各功能）
                                              7. 呼叫 AI（共用）→ 解析標記＋結構驗證（各功能）→ 回傳
```

- 所有 AI 功能由**同一個 Node 服務**提供（不為每個功能新增 systemd 服務）。
- 路由命名：頁面 `/<feature>`、端點 `POST /api/<feature>/reading`。`<feature>` 為功能代碼（`tarot`、`astro-cards`）。

### 2. 目錄與 import 規則

以**目錄**劃分「伺服器專用」與「可被前端 import」，不靠逐檔記憶：

| 目錄 | 性質 | 內容 |
| :--- | :--- | :--- |
| `src/lib/ai/server/` | **伺服器專用**（只可被 `src/pages/api/**` 及其他 `server/` 模組 import） | AI 設定讀取、供應商轉接器、AI 呼叫、標記解析工具、額度計數、輸入守門、端點 HTTP 工具 |
| `src/lib/ai/shared/` | 前後端共用（**只能放可公開的值**） | 共用常數、錯誤碼與 HTTP 狀態對照、安全關懷文案、前端 API 呼叫與 GA 工具 |
| `src/lib/<feature>/` | 各功能 | 前後端共用檔（常數、文案、資料）＋伺服器專用檔（提示詞、解析驗證、功能設定讀取），伺服器專用檔以檔頭 ⚠️ 註明 |
| `src/pages/api/<feature>/reading.ts` | 伺服器 | 各功能端點（`prerender = false`） |
| `src/scripts/<feature>.ts` | 前端 | 各功能頁面互動腳本 |

- `src/lib/ai/shared/` 與各功能之前後端共用檔**不得** import `astro:env/server`、`src/lib/ai/server/` 或任何伺服器模組。
- 驗收（第九節第 3 小節）以 build 後搜尋前端 bundle 驗證：無金鑰、供應商網域、系統提示詞、自傷關鍵字清單。

#### `src/lib/ai/server/` 模組

| 檔案 | 對外 API（概念） | 說明 |
| :--- | :--- | :--- |
| `config.ts` | `aiServerConfig` | **唯一讀取共用 `AI_*` 環境變數之模組**；匯出型別化設定（供應商、端點、模型、金鑰、推理強度、`keyPresent`）。金鑰缺少時寫一行錯誤 log（第三節第 4 小節） |
| `providers/types.ts` | `ChatProvider`、`ChatRequest`、`ProviderError` | 原塔羅同名檔，內容不變 |
| `providers/openai-compatible.ts` | `createOpenAICompatibleProvider()`、`stripThinking()` | 原塔羅同名檔，內容不變 |
| `generate.ts` | `generateText({ system, user, maxOutputTokens, temperature })` | 依 `AI_PROVIDER` 選擇並快取轉接器、以 `SERVER_AI_TIMEOUT_MS` 控制逾時，回傳剝除推理後之純文字；失敗一律拋 `ProviderError` |
| `tagged.ts` | `extractTagged(text, tag)`、`truncateChars()`、`isNonEmptyString()` | 標記式輸出之通用擷取工具（第五節第 4 小節）；欄位組合與驗證規則由各功能決定 |
| `quota.ts` | `createDailyQuota({ dailyLimit, ipDailyLimit })` → `{ reserve(ipHash) }`；`hashIp()` | 每日額度計數**工廠**，每個功能建立自己的一份（第六節） |
| `guard.ts` | `normalizeQuestion(raw, maxChars)`、`isSelfHarmQuestion()` | 輸入正規化與自傷預檢；關鍵字清單全站一份 |
| `http.ts` | `readJsonRequest()`、`jsonResponse()`、`errorResponse()`、`logResult()`、`callWithReservation()` | 端點共用之請求檢查、回應、匿名 log 與「呼叫 AI＋依錯誤類型釋放額度」（第四節第 1 小節、第六節第 2 小節） |

#### `src/lib/ai/shared/` 模組

| 檔案 | 內容 |
| :--- | :--- |
| `config.ts` | 共用常數（第三節第 2 小節）與跨常數斷言 |
| `errors.ts` | `ErrorCode` 型別、`ERROR_STATUS`（錯誤碼 → HTTP 狀態）、`isErrorCode()`（第四節第 2 小節） |
| `care.ts` | `CARE_COPY`：安全關懷文案與求助專線（全站一份，原塔羅 `copy.ts`） |
| `client.ts` | `postReading(path, body, isValid)`：前端呼叫端點、逾時、錯誤碼判斷與降級規則（第四節第 4 小節；`isValid` 為各功能成功回應之結構檢查）；`trackEvent()`：GA4 事件 |

### 3. 共用與不共用的界線

| 層 | 共用（`src/lib/ai/`） | 各功能獨立 |
| :--- | :--- | :--- |
| AI 呼叫 | 供應商轉接器、逾時、剝除推理內容、標記擷取工具 | 系統提示詞、輸出標記名稱、字數規範、結構驗證 |
| 防濫用 | 額度計數實作（工廠）、IP 雜湊、保留／釋放規則 | 上限數值、功能開關、nginx zone |
| 輸入守門 | 問題正規化、自傷關鍵字 | 問題字數上限、是否必填、其他欄位驗證 |
| 端點 | 請求檢查順序、錯誤碼、回應格式、匿名 log | 端點檔案、請求／成功回應欄位 |
| 前端 | API 呼叫與錯誤判斷、GA 工具、安全關懷文案 | 頁面、互動狀態機、動畫、版面、其餘文案 |

- **不共用前端狀態機與頁面**：各功能之儀式互動差異大（塔羅扇形牌堆、占星三疊牌），強行抽象會讓兩邊都更難修改。
- **判斷原則**：只有「兩個功能逐行相同、且任一處修改另一處也必須跟著改」的邏輯才進 `src/lib/ai/`。第三個功能出現前，不為假想需求增加抽象層。

---

## 三、 參數管理（單一來源原則）

> 目標不變（原 `tarot_plan.md` v0.9 第三節第 3 小節）：**任何一個參數只在一個地方定義**。

### 1. 三層分類

| 層級 | 存放位置 | 適用參數 | 修改方式 |
| :--- | :--- | :--- | :--- |
| **A. 執行期設定** | VPS `/etc/starwoven/app.env`（本機為專案根目錄 `.env`），經 `astro:env` schema 讀取 | 機密（金鑰）＋營運上可能調整的值：共用之供應商／模型／推理強度；各功能之開關與每日上限 | 改檔案 → `systemctl restart starwoven-app`，**不需重新 build** |
| **B. 程式常數** | 共用：`src/lib/ai/shared/config.ts`；各功能：`src/lib/<feature>/config.ts` | 技術性、低頻變動、多半需前後端一致的值 | 改檔案 → 重新 build 部署 |
| **C. 基礎設施設定** | `nginx/starwoven.conf` | nginx 自行讀取的值：各功能 IP 限流速率、`client_max_body_size`、`proxy_read_timeout` | 改檔案 → `nginx -t` → reload |

**分層判斷規則**（新增參數時依序判斷）：① 是機密 → A；② 業主／營運者可能在不改程式的情況下要求調整 → A；③ 只有 nginx 能執行 → C；④ 所有 AI 功能必須一致 → B 共用；⑤ 其餘 → B 該功能。**不得**在上述常數檔以外的程式檔案中寫死數值常數。

> **例外（沿用 2026-10-21 程式碼審查之補充）**：純視覺動畫時長集中於各功能頁面腳本之單一常數物件（例：`src/scripts/tarot.ts` 的 `RITUAL_TIMING`），不移入常數檔。

### 2. B 層：共用常數（`src/lib/ai/shared/config.ts`）

| 常數 | 預設值 | 使用方 | 說明 |
| :--- | :--- | :--- | :--- |
| `REQUEST_BODY_MAX_BYTES` | `2048` | 後端（nginx 遺漏時之防線） | 須與**每個** AI location 之 `client_max_body_size 2k` 一致 |
| `SERVER_AI_TIMEOUT_MS` | `25000` | 後端（`generateText` 之 `AbortController`） | 大小關係見本節第 5 小節 |
| `CLIENT_REQUEST_TIMEOUT_MS` | `30000` | 前端（`postReading`） | 須大於 `SERVER_AI_TIMEOUT_MS` |
| `TIMEZONE` | `'Asia/Taipei'` | 後端（每日額度重置） | 全部功能同一時區 |
| `ALLOWED_ORIGINS` | `https://starwoven.xyz`、`https://www.starwoven.xyz` | 後端（`readJsonRequest`） | 可公開值 |
| `DEV_ORIGIN` | `http://localhost:4321` | 後端（僅 dev 模式生效） | |
| `assertAiTemperature(value, feature)` | 合法範圍 `(0, 1]` | 各功能 `config.ts` 於模組層呼叫 | MiniMax OpenAI 相容端點限制。以函式提供（不匯出範圍常數），範圍只定義在這一處；不合法時 throw `[<feature>/config] AI_TEMPERATURE must be in (0, 1]`（塔羅沿用 v0.9 之錯誤訊息） |

- 逾時與 body 上限設為**共用**：所有 AI 功能共用同一套 nginx 逾時與前後端逾時之大小關係，避免每個功能各自維護一組跨層約束。若日後某功能確需不同逾時，再將該常數下放至功能層並另立 DEC。
- 跨常數斷言（違反即建置／啟動失敗）：`CLIENT_REQUEST_TIMEOUT_MS > SERVER_AI_TIMEOUT_MS`。

### 3. B 層：各功能常數（`src/lib/<feature>/config.ts`）規範

每個功能之常數檔至少定義下列項目（數值見各功能規格書）：

| 常數 | 說明 |
| :--- | :--- |
| `QUESTION_MAX_CHARS` | 問題字數上限（Unicode 字元計），前端與後端共用；並斷言 `REQUEST_BODY_MAX_BYTES ≥ QUESTION_MAX_CHARS × 4 + 256` |
| `AI_TEMPERATURE` | 以 `assertAiTemperature(AI_TEMPERATURE, '<feature>')` 斷言；功能層不得自行內嵌範圍判斷 |
| `AI_MAX_OUTPUT_TOKENS` | 依該功能輸出長度實測決定（須容納推理＋輸出） |
| `READING_LENGTH` | 各段落字數，提示詞文字與結構驗證截斷引用同一組數值 |
| `READING_API_PATH` | `/api/<feature>/reading` |

- 溫度與輸出長度歸屬**功能層**：輸出篇幅與文風因功能而異，且這兩個值與該功能提示詞、結構驗證耦合。
- 功能之內容資料（牌陣、牌義、提示詞）各自單檔集中，不併入常數檔；前端可見文案集中於該功能 `copy.ts`。

### 4. A 層：環境變數

**唯一清單為 `astro.config.mjs` 的 `env.schema`**；本表為說明。全部宣告為 `context: 'server'`、`access: 'secret'`（理由沿用原規格：server public 變數會在建置時進入 server bundle，secret 才於執行期讀取，才能「改環境變數檔＋重啟即生效」）。

#### (1) 共用（`AI_*`，由 `src/lib/ai/server/config.ts` 唯一讀取）

| 變數 | 預設 | 說明 | 原變數名（v0.9） |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | `openai-compatible` | 轉接器選擇（列舉，目前唯一合法值） | `TAROT_AI_PROVIDER` |
| `AI_BASE_URL` | `https://api.minimax.io/v1` | 供應商端點（`url: true`） | `TAROT_AI_BASE_URL` |
| `AI_MODEL` | `MiniMax-M3.1-Flash` | 模型代碼 | `TAROT_AI_MODEL` |
| `AI_API_KEY` | （無預設，**選填**） | 機密；缺少時**全部 AI 功能**停用（各端點回 `DISABLED`） | `TAROT_AI_API_KEY` |
| `AI_REASONING_EFFORT` | `low` | 列舉 `none`／`low`／`medium`／`high`／`xhigh`／`max`；`none` 為自訂哨兵值＝不送出 `reasoning_effort`（留空無效，會套用預設） | `TAROT_AI_REASONING_EFFORT` |

- **所有功能共用同一組供應商設定**（同一把金鑰）。某功能確需不同模型時，再為該功能新增選填覆寫變數並另立 DEC；目前不預留。
- 金鑰選填之理由沿用原規格（DEC-073 第四輪審查）：不讓 AI 功能成為全站 build 之前置條件。缺少時 `config.ts` 首次載入寫入一行錯誤 log：**`AI_API_KEY missing; AI features disabled`**（取代 v0.9 之 `TAROT_AI_API_KEY missing; tarot disabled`；第一階段允許之可觀察差異之一，見第九節第 1 小節），部署腳本與驗收檢查此 log 不存在。

#### (2) 各功能（`<PREFIX>_*`，由該功能 `server-config.ts` 唯一讀取）

| 變數 | 說明 |
| :--- | :--- |
| `<PREFIX>_ENABLED` | 功能開關；功能啟用＝`<PREFIX>_ENABLED && aiServerConfig.keyPresent` |
| `<PREFIX>_DAILY_LIMIT` | 該功能每日全站上限 |
| `<PREFIX>_IP_DAILY_LIMIT` | 該功能每 IP 每日上限 |

- 塔羅之前綴為 `TAROT_`（變數名稱與預設值不變：`TAROT_ENABLED=true`、`TAROT_DAILY_LIMIT=300`、`TAROT_IP_DAILY_LIMIT=10`）。
- **前綴不得與框架或共用變數衝突**：不得使用 `PUBLIC_`（會進前端）、`AI_`（共用）、`ASTRO_`（Astro 自身使用，例如 `ASTRO_KEY`）、`NODE_`、`HOST`／`PORT`。
- 皆不得以 `PUBLIC_` 開頭；`.env.example` 依 schema 同步列出（`AI_API_KEY` 留空）。

#### (3) 讀取與驗證規則（沿用原規格）

- 伺服器端讀取只經 `src/lib/ai/server/config.ts`（共用）與各功能 `server-config.ts`；其他模組不得各自讀取 `astro:env/server` 或 `process.env`。
- 啟用 `env.validateSecrets: true`。⚠️ 驗證時機：只在 `astro dev`／`astro build` 啟動時驗證；Node 服務執行期間 secret 於**被讀取時**才驗證，而 on-demand 路由模組於第一個請求才載入——`app.env` 填錯不會使服務啟動失敗，而是首個 API 請求才報錯。對策：部署腳本重啟後對**每個 AI 端點**送出冒煙請求（第八節第 3 小節）。

### 5. 跨層一致性約束

以「雙向註解」標示——常數旁註明對應的 nginx 指令，nginx 指令旁註明對應常數。

| 約束 | 涉及位置 |
| :--- | :--- |
| 逾時：**每個** AI location 之 `proxy_read_timeout`（35s）＞ `CLIENT_REQUEST_TIMEOUT_MS`（30s）＞ `SERVER_AI_TIMEOUT_MS`（25s） | C 層＋B 層共用 |
| body 上限：**每個** AI location 之 `client_max_body_size 2k` ＝ `REQUEST_BODY_MAX_BYTES`（2048） | C 層＋B 層共用 |
| body 上限須足以容納各功能 `QUESTION_MAX_CHARS` | B 層共用＋B 層功能（功能常數檔斷言） |
| 每日 AI 呼叫總上限＝各功能 `<PREFIX>_DAILY_LIMIT` 之和，須在開發者訂閱額度可承受範圍內 | A 層各功能（人工核對，第六節第 4 小節） |

### 6. 環境變數檔配置（本機 vs 伺服器）

沿用原規格，僅變數名稱更新：

| 環境 | 檔案 | 內容 | 讀取者／時機 |
| :--- | :--- | :--- | :--- |
| 本機開發／建置 | 專案根目錄 **`.env`**（git-ignored） | `PUBLIC_*`＋`AI_*`＋各功能 `<PREFIX>_*` | Astro／Vite 於 `dev`、`build` 時載入 |
| VPS 執行期 | **`/etc/starwoven/app.env`**（目錄 `700`、檔案 `600`，root） | `AI_*`＋各功能 `<PREFIX>_*`＋`HOST`／`PORT` | systemd 經 `EnvironmentFile` 注入 |
| 版本控制 | `.env.example` | 全部變數名稱＋非機密範例值 | 人工參考 |

- VPS 不需要 `PUBLIC_*`（build 時已內嵌）；任何環境變數檔不得放入 `/var/www/starwoven` 或 `/opt/starwoven-app/dist/`。
- 不在 schema 內的變數（例如遷移期間殘留之舊名 `TAROT_AI_*`）Astro 不讀取、不驗證，殘留無害（第九節第 4 小節利用此性質做新舊變數並存之遷移）。

---

## 四、 共用 API 慣例

### 1. 端點處理順序（各功能端點須依此順序）

1. **共用請求檢查**（`readJsonRequest`）：`Origin` 須在允許清單（dev 另允許 `DEV_ORIGIN`）→ `Content-Type` 須為 `application/json` → `Content-Length` 與實際 body bytes 皆 ≤ `REQUEST_BODY_MAX_BYTES` → 可解析為 JSON **物件**（非陣列、非 null）。任一失敗回對應錯誤碼。
2. **功能欄位驗證**：只取出該功能定義之欄位逐一驗證（缺少或值不合法 → `INVALID_REQUEST`）、`normalizeQuestion(raw, QUESTION_MAX_CHARS)`。**未知欄位一律忽略、不回 400**（沿用 v0.9 行為；改為拒絕屬 API 合約變更，須另立 DEC）。
3. **功能開關**：未啟用 → `DISABLED`。
4. **自傷預檢**：命中 → 回 `{ "ok": true, "care": true }`，不產生結果、不呼叫 AI、不消耗額度。
5. **同步保留額度**：不足 → `DAILY_LIMIT`（第六節）。
6. **產生結果**（crypto 亂數）→ **呼叫 AI**（`callWithReservation`，依錯誤類型釋放額度）→ 解析與結構驗證（失敗視為 `AI_FAILED`）→ 回成功回應。
- 其他 HTTP 方法一律 405 `{ "ok": false, "error": "INVALID_REQUEST" }`（不屬於 API 合約）。
- **端點（Node）產生之**所有回應帶 `Content-Type: application/json; charset=utf-8`、`Cache-Control: no-store`（由 `jsonResponse` 統一設定）。
- nginx named location 產生之 JSON 錯誤（第 3 小節）只有 `default_type application/json`，無 charset、無 `Cache-Control`——沿用 v0.9 現況，不補：內容為純 ASCII，且為 POST 錯誤回應、不會被快取；若為此在 named location 加 `add_header`，server 層安全標頭將不再繼承（第八節第 2 小節）。

### 2. 錯誤碼總表（`src/lib/ai/shared/errors.ts`）

所有錯誤皆回傳 `{ "ok": false, "error": "<代碼>" }`，不外洩供應商錯誤細節。前端顯示文案由各功能 `copy.ts` 對照（同一代碼在不同功能可有不同措辭）。

| HTTP | `error` 代碼 | 產生者 | 情境 | 前端重試鈕 |
| :--- | :--- | :--- | :--- | :--- |
| 400 | `INVALID_REQUEST` | 端點 | 格式錯誤、必要欄位缺少或值不合法、問題超長 | 無 |
| 403 | `FORBIDDEN_ORIGIN` | 端點 | Origin 非本站 | 無（顯示通用錯誤） |
| 413 | `PAYLOAD_TOO_LARGE` | nginx／端點 | body 超過上限 | 無 |
| 429 | `RATE_LIMITED` | nginx | 依 IP 限流 | 無 |
| 429 | `DAILY_LIMIT` | 端點 | 該功能每日全站或該 IP 每日上限 | 無 |
| 503 | `DISABLED` | 端點 | 功能開關關閉或金鑰缺少 | 無 |
| 502 | `AI_FAILED` | 端點 | AI 逾時、供應商錯誤、結構驗證失敗 | **有** |
| 502 | `SERVICE_DOWN` | nginx | Node 服務未啟動或無回應 | 無（顯示通用錯誤） |
| 504 | `GATEWAY_TIMEOUT` | nginx | 超過 `proxy_read_timeout` | **有** |
| 503 | `AI_BUSY` | 端點 | 供應商拒絕（HTTP 429，或 MiniMax `base_resp` 1002／1008／1039） | 無 |

- 新增錯誤碼須同步本表、`errors.ts` 與**每個**功能之 `copy.ts`（`Record<ErrorCode, …>` 型別強制補齊）。

### 3. nginx 層 JSON 錯誤頁

- 沿用原規格（同主機 exopolitics `/v1/` 已驗證之 `error_page` → named location 慣例）：429／413／502／504 由 nginx 回傳同格式 JSON。
- named location **全部 AI 功能共用一組**，名稱由 `@tarot_*` 改為 **`@ai_429`／`@ai_413`／`@ai_502`／`@ai_504`**。
- ⚠️ AI location **不得開啟 `proxy_intercept_errors`**——端點自身之 `DAILY_LIMIT`（429）、`AI_FAILED`（502）、`DISABLED`／`AI_BUSY`（503）須原樣穿透；`error_page` 預設只作用於 nginx 自身產生之錯誤。

### 4. 前端判斷規則（`postReading`）

- 一律**以 JSON `error` 代碼為準**（同一狀態碼可能來自 nginx 或端點）。
- body 無法解析為 JSON、或 `error` 不是已知代碼時，依狀態碼降級：413 → `PAYLOAD_TOO_LARGE`、429 → `RATE_LIMITED`、其餘 → 通用錯誤（`code: null`）。
- 前端逾時（`CLIENT_REQUEST_TIMEOUT_MS`）→ `AI_FAILED`（含重試鈕）；其他網路錯誤 → 通用錯誤。
- 回傳型別：`{ kind: 'ok', data } | { kind: 'care' } | { kind: 'error', code: ErrorCode | null }`；成功資料之型別與結構檢查（`isValid`）由各功能定義，`ok: true` 但結構不符者視同無法辨識之回應，依狀態碼降級。
- 送出期間鎖定按鈕防重複送出（各功能頁面腳本負責）。

### 5. 安全關懷回應

- 問題命中自傷／輕生關鍵字時回 `{ "ok": true, "care": true }`（HTTP 200），前端顯示 `CARE_COPY`：**1925 安心專線（24 小時）**、**1995 生命線**、**1980 張老師**，並附「預約真人陪伴」LINE 連結。
- 關鍵字清單全站一份（`src/lib/ai/server/guard.ts`），寬鬆命中為原則（誤判成本低於漏判）；清單只存在伺服器，不進前端 bundle。

---

## 五、 AI 呼叫層

> 第 1～2 小節為原 `tarot_plan.md` v0.9 第五節第 3 小節（1）（2）之搬移，查證日 2026-10-20（MiniMax 官方文件 `platform.minimax.io/docs/guides/text-generation`、`/docs/m-plan/faq`）。模型代碼與參數以實作當下官方文件為準。

### 1. 供應商：MiniMax

| 項目 | 規格 |
| :--- | :--- |
| 協定 | **OpenAI 相容 Chat Completions**（`POST {baseURL}/chat/completions`），日後切換 OpenAI 可共用同一轉接器 |
| Base URL | `https://api.minimax.io/v1`（國際站；中國站 `api.minimaxi.com` 不使用） |
| 模型 | 預設 `MiniMax-M3.1-Flash`；`MiniMax-M3` 為備選（延遲約兩倍、輸出 tokens 較多，切換須同步調高各功能 `AI_MAX_OUTPUT_TOKENS` 並重新評估逾時，實測見 `tarot_plan.md` 第五節第 3 小節） |
| 推理（thinking） | 一律開啟、無法關閉；必須明確送出 `reasoning_effort`（預設 `low`）。推理內容位置因模型而異（Flash：`reasoning_content` 欄位；M3：`content` 開頭之 `<think>` 區塊）——轉接器**只取 `content` 並剝除所有 `<think>…</think>`**；推理內容不得回傳前端、不得寫入 log |
| 業務錯誤 | HTTP 200 內之 `base_resp.status_code` 非 0 視為錯誤：1002（RPM 限流）、1008（餘額不足）、1039（TPM 限流）→ `rate_limited`，其餘 → `failed` |
| 溫度 | OpenAI 相容端點合法範圍 (0, 1] |
| 依賴套件 | 不安裝供應商 SDK，以 Node 內建 `fetch`＋`AbortController` 實作 |

### 2. 金鑰類型（開發者決定，已知風險接受；原 DEC-073）

- Demo 期間使用開發者之 MiniMax **訂閱方案金鑰**（Coding Plan，固定月費 10 USD）；具營收後再評估切換按量計費（只換 `AI_API_KEY`，必要時 `AI_BASE_URL`）。
- 官方定位訂閱方案為「individual, interactive developer use」並建議正式環境採按量計費；條款灰色地帶之風險由開發者知情接受。
- **額度用盡的實際行為**：訂閱方案採 5 小時與每週用量窗口，與開發者本人之開發工具**共用額度**；窗口用盡後預設續扣帳號內 Credit packs，皆用盡才回 HTTP 429 → 各端點回 `AI_BUSY`。
  - 現有 Credit packs 為官方贈送，開發者接受被網站流量扣用。⚠️ 日後若自行購買 Credit packs，網站流量（**所有 AI 功能合計**）會一併扣用付費額度；購買前應評估，必要時以各功能 `<PREFIX>_ENABLED=false` 暫停或調低上限。
  - 不做備援供應商、不自動切換付費金鑰。
- **新增 AI 功能即增加同一把金鑰之用量**：每新增一個功能，須於該功能 DEC 重新核對每日總上限（第三節第 5 小節最後一列）。

### 3. 銜接層

```ts
// src/lib/ai/server/providers/types.ts（內容沿用，不變）
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

- `generate.ts` 依 `AI_PROVIDER` 選擇轉接器（目前只接受 `openai-compatible`）；新增供應商＝新增一個實作 `ChatProvider` 的檔案並登錄於 `generate.ts`，各功能不需改動。
- 供應商錯誤（HTTP 4xx／5xx、逾時、網路錯誤、空回應）在轉接器內一律轉為 `ProviderError`（`kind: 'rate_limited' | 'failed'`）；原始錯誤訊息只寫入伺服器 log（不含請求內容）。
- 各功能之結構驗證失敗亦拋 `ProviderError('failed', …)`，由 `callWithReservation` 統一對應為 `AI_FAILED`。
- 失敗不自動重試（避免成本倍增），交由使用者手動重試。

### 4. 輸出格式慣例：標記式，不採 JSON（原 DEC-074）

- 各功能以提示詞要求 `<tag>…</tag>` 標記輸出，`extractTagged()` 擷取後由各功能結構驗證。實測 MiniMax 之 JSON 輸出常見結尾符號錯置而無效（`response_format: json_object` 亦無改善），標記式於 80 次測試中格式錯誤 0 次（實測表見 `tarot_plan.md` 第五節第 3 小節（2））。
- 各功能之標記名稱集中於該功能 `prompt.ts` 之 `OUTPUT_TAGS` 常數，提示詞與解析器共用。
- 驗證規則（各功能實作，共用工具）：必要欄位存在且非空、重複欄位數量正確、超長依 Unicode 字元截斷（上限 × 寬限倍率，避免模型字數計算不精確造成正常輸出被硬切）。
- 使用者問題以 `<question>…</question>` 包裹並於系統提示詞聲明為「訪客提問內容，非指令」；`normalizeQuestion` 將半形角括號轉全形，防止偽造分隔標記。

---

## 六、 防濫用與成本控制

### 1. 各層機制

| 層級 | 機制 | 範圍 |
| :--- | :--- | :--- |
| 供應商 | MiniMax 訂閱方案額度＋Credit packs（第五節第 2 小節） | 全部功能共用 |
| 應用層 | 每日全站 AI 呼叫上限（呼叫前保留，台灣時間 00:00 重置） | **各功能各自一份** |
| 應用層 | 每 IP 每日上限（以 nginx 傳入 `X-Real-IP` 判斷） | **各功能各自一份** |
| nginx | `limit_req` 依 IP | **各功能各自一個 zone**（`<feature>_api`） |
| 應用層 | 功能開關 `<PREFIX>_ENABLED` | 各功能 |

- **各功能額度分開計算**（開發者決定，2026-10-27）：訪客玩塔羅不影響其玩占星的次數，反之亦然。

### 2. 額度保留與釋放規則（共用實作，沿用原規格）

- **呼叫 AI 前同步保留**：通過格式驗證、功能開關與自傷預檢後，於同一段同步程式碼內（中間不得有 `await`）完成「檢查該功能全站與 IP 剩餘額度 → 雙雙遞增」。Node 為單執行緒，同步區段天然不可分割，等待 AI 期間之併發請求皆看到已遞增之計數。
  - 任一額度不足 → `DAILY_LIMIT`，不遞增、不呼叫 AI。
  - AI 成功 → 保留轉為正式計數。
  - `AI_FAILED` → **只釋放 IP 額度**（使用者重試不被扣次數）；全站額度不釋放（請求已實際送出、供應商多半已扣用）。
  - `AI_BUSY`（供應商拒絕）→ **全站與 IP 額度皆釋放**（未執行、未扣用；避免供應商短暫限流期間耗盡全站上限）。
  - 安全關懷回應與保留前即被拒之請求（400／403／413／503）不消耗額度。
  - 跨日後計數已清空，遲到之釋放不作用於新的一天；同一保留只能釋放一次。
- 釋放規則集中於 `callWithReservation()`，各功能端點不得自行呼叫釋放函式——此規則為歷次審查之重點（DEC-073 第一、三輪），集中一處可避免各功能實作不一致。

### 3. 計數儲存

- 存於 Node 程序記憶體，服務重啟即歸零（MVP 接受：最壞情況為當日額外消耗一份全站上限）。
- 只存 IP 雜湊（`sha256(程序啟動時之隨機 salt ＋ IP)` 取前 32 字元）與次數，每日清空。各功能之計數互相獨立，`hashIp` 共用同一 salt。

### 4. 總量核對

- 每日最壞 AI 呼叫數＝Σ 各功能 `<PREFIX>_DAILY_LIMIT`（另加服務重啟造成之歸零）。目前：塔羅 300；占星於 DEC-080 定。
- Origin 檢查與 IP 限流都能被刻意繞過，**真正的硬上限是各功能每日全站上限之和與供應商訂閱額度**。

---

## 七、 Log 與隱私

- 伺服器 log 只記：時間、功能、功能代碼（牌陣等）、結果代碼、耗時、是否命中上限。**不記問題、不記解讀、不記完整 IP**。
- log 格式（單行 JSON，`logResult` 產生）：`{"t":"<ISO 時間>","feature":"tarot","spread":"three","result":"OK","ms":8123,"limitHit":false}`——相較 v0.9 新增 `feature` 欄位（多功能共用 journal 時區分來源），其餘欄位不變；功能代碼欄位名稱由各功能決定（塔羅沿用 `spread`）。
- 供應商錯誤 log：`[<feature>] provider error (<kind>): <訊息>`（不含請求內容）。
- nginx access log 不含 POST body，維持現狀。
- 各功能頁面於問題輸入框下方註明：問題只用於本次解讀、不會保存，解讀由第三方 AI 服務生成（文案於各功能 `copy.ts`）。
- 訪客問題會傳送至 MiniMax（國際站）處理；MiniMax 資料保留／訓練使用政策 Demo 階段暫不查證（開發者決定），轉為正式營運時再確認並調整告知文案。

---

## 八、 部署（Hetzner VPS）

> 第 0、1 小節沿用原 `tarot_plan.md` v0.8 第八節（2026-10-20 VPS 現況調查，雲端維運 agent 核對同意）；第 2、3 小節依多功能改寫。

### 0. VPS 現況（2026-10-20）

| 項目 | 現況 |
| :--- | :--- |
| 建置方式 | **VPS 即建置機**：repo 位於 `/root/.openclaw/workspace/starwoven/`，於該處 `git pull` → `bash scripts/deploy.sh` |
| Node.js | v24.14.0，`/usr/local/bin/node`（官方 tarball 系統級安裝），aarch64 |
| nginx | 1.24.0；同主機另有 3 個站台；`nginx.conf` 已有 `zone=api`（exopolitics）→ AI 功能 zone 一律命名 `<feature>_api` |
| 網路 | 直連、未經 CDN → `$remote_addr` 即訪客真實 IP |
| 443 預設站 | 無 `default_server`，依載入順序預設站為 noeticseeker.com；瀏覽器皆送 SNI，無影響 |
| 帳號／埠 | 服務帳號 `starwoven`（非 `www-data`）；Node 服務只監聽 `127.0.0.1:4321` |
| 憑證 | certbot webroot（`/var/www/starwoven`），已有 nginx reload deploy hook；現行憑證效期至 2026-12-23 |

### 1. 伺服器端一次性設定（已於塔羅上線時完成，新增功能不需重做）

- ACME 驗證目錄 `/var/www/starwoven/.well-known/acme-challenge/`（`www-data`）。
- 系統帳號 `starwoven`（`useradd --system --no-create-home --shell /usr/sbin/nologin starwoven`）。
- `/var/www/starwoven/` ← `dist/client/`（擁有者 `www-data`）；`/opt/starwoven-app/` ← `dist/`＋`package.json`＋`package-lock.json`＋`node_modules/`（`npm ci --omit=dev`；擁有者 root、服務帳號唯讀）。
- `/etc/starwoven/app.env`（目錄 `700`、檔案 `600`，root；systemd 以 root 讀取後注入，**程式碼不得自行讀取此檔**）。
- systemd unit 正本 `systemd/starwoven-app.service`：`User=starwoven`、`EnvironmentFile=/etc/starwoven/app.env`、`ExecStart=/usr/local/bin/node /opt/starwoven-app/dist/server/entry.mjs`、`Restart=on-failure`、`NoNewPrivileges`／`ProtectSystem=strict`／`ProtectHome`／`PrivateTmp`。修改 `app.env` 後 `systemctl restart starwoven-app`；修改 unit 後先 `daemon-reload`。
- `EnvironmentFile` 格式：每行 `KEY=value`，不支援 `export` 與變數展開。

### 2. nginx（`nginx/starwoven.conf`）：每個功能一組設定

**檔案頂層（`server {}` 之外）**，每個功能一行：

```nginx
limit_req_zone $binary_remote_addr zone=tarot_api:1m rate=3r/m;
# 第二階段新增：limit_req_zone $binary_remote_addr zone=astrocards_api:1m rate=3r/m;
```

**443 `server {}` 內**，每個功能一個 location（內容除 zone 外相同）：

```nginx
location /api/tarot/ {
    limit_req zone=tarot_api burst=2 nodelay;
    limit_req_status 429;
    # ↔ src/lib/ai/shared/config.ts REQUEST_BODY_MAX_BYTES（2048）須一致
    client_max_body_size 2k;
    # ↔ 須大於 src/lib/ai/shared/config.ts CLIENT_REQUEST_TIMEOUT_MS（30s）＞ SERVER_AI_TIMEOUT_MS（25s）
    proxy_read_timeout 35s;
    proxy_pass http://127.0.0.1:4321;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    error_page 429 = @ai_429;
    error_page 413 = @ai_413;
    error_page 502 = @ai_502;
    error_page 504 = @ai_504;
}
```

- named location `@ai_429`／`@ai_413`／`@ai_502`／`@ai_504` 全部功能共用一組（內容同 v0.9 之 `@tarot_*`，僅改名）。
- **不再保留泛用 `location /api/`**：未登錄之 `/api/*` 路徑不會被轉送至 Node，依 nginx location 比對分兩種：
  - 一般路徑（如 `/api/unknown`）落入 `location /`：GET 回首頁 fallback（與全站錯誤網址行為一致，見 `known_issues` 第 6 項），POST 由 nginx 回 405（HTML）。
  - 符合靜態資產副檔名 regex 之路徑（如 `/api/unknown.js`）落入靜態資產 location：檔案不存在，回 404（HTML）。
  - 兩者皆為 nginx 既有行為，本規格不調整 location 優先序。新增功能必須明確新增 location，避免未經限流之端點意外對外開放。
- 各 location 重複列出 proxy 設定為刻意取捨：維持單一 vhost 檔為唯一正本，不引入 `include` 片段檔（多一個需部署同步的檔案）。
- ⚠️ 沿用陷阱提醒：location 內出現任何 `add_header`，server 層安全標頭不再繼承——AI location 與 named location 不新增 `add_header`；不得開啟 `proxy_intercept_errors`。
- 不修改 `nginx.conf` 全域設定與其他站台（DEC-073 授權範圍僅限 starwoven vhost）。

### 3. 部署流程：`scripts/deploy.sh`

流程沿用 v0.8（🔴 舊指令 `rsync -a --delete dist/ /var/www/starwoven/` 不得使用），改寫項目：

1. `npm ci` → `npm run build`
2. 結構檢查：`dist/client/index.html` 與 `dist/server/entry.mjs` 皆存在
3. `rsync -a --delete --delete-after --delay-updates --exclude=.well-known dist/client/ /var/www/starwoven/` → `chown -R www-data:www-data`
4. 同步 `dist/`、`package.json`、`package-lock.json` 至 `/opt/starwoven-app/` → `npm ci --omit=dev`
5. `systemctl restart starwoven-app`
6. **冒煙請求（改為逐一端點）**：腳本頂端以陣列列出所有 AI 端點（`SMOKE_PATHS=(/api/tarot/reading)`；新增功能時加入），對每個端點送出 `{}`（帶正式 Origin），預期 400 `INVALID_REQUEST`——強制載入共用與該功能設定；不呼叫 AI、不消耗額度。
7. 檢查 `journalctl -u starwoven-app`（自重啟時間起）：出現 **`AI_API_KEY missing`** → 中止並提示；出現 `[ERROR]`、`EnvInvalidVariables` → 中止並印出 log。
8. nginx 設定有變時（手動）：備份現行 vhost → 複製 `nginx/starwoven.conf` → `nginx -t` 通過後 `systemctl reload nginx`。

> 冒煙請求之端點清單與 nginx location 清單須一致；新增功能檢查清單（第十節）列為必做項。

### 4. 回滾

- **停用單一功能**：`<PREFIX>_ENABLED=false` → 重啟服務（該功能顯示「暫停中」，其他功能不受影響）。
- **停用全部 AI 功能**：清空 `AI_API_KEY` → 重啟；或 `systemctl stop starwoven-app`（各 AI 端點回 502 `SERVICE_DOWN`，其餘頁面正常）。
- **nginx 替換出問題**：還原備份之舊 vhost → `nginx -t` → reload。
- **程式版本回退**：`git revert` → `scripts/deploy.sh`；第一階段之環境變數相容做法見第九節第 4 小節。

---

## 九、 第一階段遷移計畫（DEC-079：抽出共用核心，塔羅行為不變）

### 1. 範圍

- **做**：將塔羅程式之共用部分搬至 `src/lib/ai/`；環境變數 `TAROT_AI_*` 改名 `AI_*`；nginx `location /api/` 改為 `location /api/tarot/`、named location 改名；`deploy.sh` 冒煙請求改為端點陣列、log 檢查字串更新；log 新增 `feature` 欄位；同步更新 `AGENTS.md`、`.env.example`、`tarot_plan.md`。
- **允許之可觀察差異（僅以下三項，其餘一律與 v0.9 相同）**：① log 新增 `feature` 欄位；② 缺金鑰之錯誤 log 字串由 `TAROT_AI_API_KEY missing; tarot disabled` 改為 `AI_API_KEY missing; AI features disabled`（`deploy.sh` 檢查字串同步更新）；③ 未登錄之 `/api/*` 不再轉送 Node（回應依路徑分述見第八節第 2 小節）。
- **不做**：任何占星功能程式碼；塔羅 API 合約、錯誤碼、頁面 HTML 結構、文案、動畫、GA 事件之任何變更；systemd unit 行為變更（僅可更新註解）。

### 2. 檔案對照（v0.9 → 第一階段）

| v0.9 位置 | 第一階段位置 | 變更 |
| :--- | :--- | :--- |
| `src/lib/tarot/providers/types.ts` | `src/lib/ai/server/providers/types.ts` | 搬移，內容不變 |
| `src/lib/tarot/providers/openai-compatible.ts` | `src/lib/ai/server/providers/openai-compatible.ts` | 搬移，內容不變 |
| `src/lib/tarot/server-config.ts` | `src/lib/ai/server/config.ts`（`AI_*`）＋ `src/lib/tarot/server-config.ts`（`TAROT_ENABLED`、上限） | 拆分；錯誤 log 字串改為 `AI_API_KEY missing; AI features disabled` |
| `src/lib/tarot/ai.ts` 之 `getProvider`＋逾時 | `src/lib/ai/server/generate.ts`（`generateText`） | 抽出 |
| `src/lib/tarot/ai.ts` 之 `parseTaggedReading`／`validateReading`／`generateReading` | 留在 `src/lib/tarot/ai.ts` | 改用 `generateText` 與 `tagged.ts` 工具；驗證規則不變 |
| `src/lib/tarot/guard.ts` 之 `normalizeQuestion`、自傷關鍵字 | `src/lib/ai/server/guard.ts` | `normalizeQuestion` 改為接收 `maxChars` 參數 |
| `src/lib/tarot/guard.ts` 之額度計數（含 `Reservation` 型別）、`hashIp` | `src/lib/ai/server/quota.ts`（`createDailyQuota` 工廠） | 塔羅端點於模組層建立一份；原內部引用之 `TIMEZONE` 改自共用 config、`cfg.dailyLimit`／`cfg.ipDailyLimit` 改由工廠參數傳入 |
| `src/pages/api/tarot/reading.ts` 之 `json`／`log`／請求檢查／錯誤釋放 | `src/lib/ai/server/http.ts` | 端點保留塔羅專屬步驟（牌陣驗證、抽牌、組回應） |
| `src/lib/tarot/config.ts` 之逾時、body 上限、時區、Origin | `src/lib/ai/shared/config.ts` | 其餘常數留在塔羅 |
| `src/lib/tarot/copy.ts` 之 `ErrorCode`／`isErrorCode` | `src/lib/ai/shared/errors.ts`（另新增 `ERROR_STATUS`，取代端點內之 `STATUS`） | 錯誤訊息對照 `ERROR_MESSAGES` 留在塔羅 |
| `src/lib/tarot/copy.ts` 之 `CARE_COPY` | `src/lib/ai/shared/care.ts` | 內容不變 |
| `src/scripts/tarot.ts` 之 fetch＋錯誤降級、`track` | `src/lib/ai/shared/client.ts`（`postReading`、`trackEvent`） | 判斷規則不變 |
| `astro.config.mjs` `env.schema` | 同檔 | `TAROT_AI_*` → `AI_*`；變數型別、預設值、選填規則不變 |

- **呼叫端同步改 import，舊檔不留 re-export**：搬移之符號自舊檔移除，所有呼叫端（含原檔案內部之引用）改由新位置 import，避免兩條 import 路徑並存。`src/lib/tarot/guard.ts` 內容全數搬出，檔案刪除。現行呼叫端（2026-10-27 盤點）：

| 呼叫端 | 受影響之 import |
| :--- | :--- |
| `src/lib/tarot/copy.ts`（內部引用） | `ErrorCode`：`ERROR_MESSAGES: Record<ErrorCode, …>` 須改 `import type { ErrorCode }` 自 `src/lib/ai/shared/errors.ts` |
| `src/lib/tarot/config.ts`（內部引用） | `REQUEST_BODY_MAX_BYTES`：`QUESTION_MAX_CHARS` 斷言（第三節第 3 小節）改自 `src/lib/ai/shared/config.ts` import；`CLIENT_REQUEST_TIMEOUT_MS > SERVER_AI_TIMEOUT_MS` 斷言隨常數移至共用檔（第三節第 2 小節）；`AI_TEMPERATURE` 之內嵌範圍判斷刪除，改 import 並呼叫 `assertAiTemperature(AI_TEMPERATURE, 'tarot')`（現行三個斷言於重構後：共用檔 1 個、塔羅 2 個） |
| `src/pages/tarot.astro` | `CARE_COPY`（頁面內 4 處使用，改自 `src/lib/ai/shared/care.ts`） |
| `src/scripts/tarot.ts` | `CLIENT_REQUEST_TIMEOUT_MS`、`isErrorCode`、`ErrorCode`（改用 `postReading` 後依實際需要 import） |
| `src/pages/api/tarot/reading.ts` | `ALLOWED_ORIGINS`、`DEV_ORIGIN`、`REQUEST_BODY_MAX_BYTES`、`ErrorCode`、`hashIp`、`isSelfHarmQuestion`、`normalizeQuestion`、`reserveQuota`、`ProviderError`（多數改由 `http.ts`／`quota.ts` 間接使用） |
| `src/lib/tarot/ai.ts` | `SERVER_AI_TIMEOUT_MS`、`createOpenAICompatibleProvider`、`ProviderError`、`ChatProvider`（改用 `generateText`） |

- `npm run build` 不做型別檢查：漏改之型別引用（舊 `import type` 或漏加之新 `import type`）於建置時被抹除，build 仍會通過——以第 3 小節第 1 項之 `astro check` 與第 6 項之全文搜尋確認。

### 3. 行為不變之驗收（parity）

1. `npm run build` 通過；在無 `.env` 之乾淨 clone 亦可通過。`astro check` 0 errors（沿用 DEC-073 做法：`npm install --no-save @astrojs/check typescript` 臨時安裝，不寫入 `package.json`）。`dist/client/` 頁面清單與重構前相同（12 頁）；除 `/tarot` 外各頁 HTML 與重構前一致（忽略 `/_astro/` 雜湊檔名），`/tarot` HTML 除腳本雜湊外一致。
2. 前端 bundle（`dist/client/_astro/`）搜尋不到：金鑰、`api.minimax.io`、`chat/completions`、系統提示詞片段、自傷關鍵字（例：「割腕」）。`dist/server/` 搜尋不到金鑰與環境變數調整值。
3. 本機 `npm run dev`：單張、三張牌陣完整流程各一次；深淺模式各一次。
4. 錯誤路徑逐一實測，回應 body 與 HTTP 狀態與重構前相同：超長問題 400、錯誤 Origin 403、非 JSON Content-Type 400、超大 body 413、`TAROT_ENABLED=false` 503 `DISABLED`、`AI_API_KEY` 留空 503 `DISABLED`（並出現新 log 字串）、每日上限暫調為 2 驗證 `DAILY_LIMIT`、自傷測試句回 `care`、極短逾時模擬 `AI_FAILED`（IP 額度釋放、全站不釋放）、模擬供應商 429 回 `AI_BUSY`（兩者皆釋放）。
5. log 抽查：含 `feature` 欄位；無問題原文、無解讀、無完整 IP。
6. 程式碼搜尋：除 `decisions.md`、規格書沿革外，搜尋不到 `TAROT_AI_`；`src/lib/ai/shared/` 與前後端共用檔中搜尋不到 `astro:env/server`、`src/lib/ai/server` 之 import；搜尋不到自 `lib/tarot/` import 已搬移之符號（含 `import type`）、搜尋不到 `lib/tarot/guard`、`lib/tarot/providers`。
7. 線上（部署後）：`deploy.sh` 冒煙通過且無 `AI_API_KEY missing`；兩種牌陣實際解讀成功；連續請求觸發 nginx JSON 429、超大 body 觸發 JSON 413、`systemctl stop` 時回 JSON 502 `SERVICE_DOWN`（其他頁面正常）；`/api/unknown` 不再轉送 Node（GET 回首頁 fallback、POST 回 nginx 405）、`/api/unknown.js` 回 404；送出含未知欄位之請求（如 `{"spread":"single","question":"","debug":true}`）與重構前同樣成功；既有頁面、許願池、`/reiki` 301 正常；回應安全標頭與替換前一致。

### 4. 環境變數遷移順序（新舊並存）

利用「schema 以外之變數不被讀取」之性質，新舊名稱可並存：

1. **部署前**：於 VPS `app.env` **新增** `AI_API_KEY` 等 `AI_*` 變數（值同舊 `TAROT_AI_*`），**保留**舊變數。舊程式不讀新變數，線上無影響。
2. 部署第一階段（`git pull` → `deploy.sh` → 替換 nginx vhost）。新程式只讀 `AI_*`。
3. 驗收通過、穩定運行後，於第二階段部署時刪除 `app.env` 中之舊 `TAROT_AI_*`。
- 回滾：第一階段期間舊變數仍在，`git revert` 後直接重新部署即可，不需編輯 `app.env`。
- ⚠️ 新舊並存解決的是**設定相容**：部署與回滾都不需要和程式同步編輯 `app.env`。它**不是 API 零停機**：`deploy.sh` 執行 `systemctl restart` 的數秒內，AI 端點回 nginx JSON 502 `SERVICE_DOWN`、前端顯示通用錯誤，靜態頁面不受影響。這與 v0.9 起每次部署相同；引流小遊戲可接受，不另做 graceful／rolling restart。
- 本機 `.env` 同步改名（開發者自行處理）。

### 5. 部署順序

⓪ 備份現行 vhost（`sites-available/starwoven.bak-YYYYMMDD`）→ ① `app.env` 新增 `AI_*`（第 4 小節）→ ② `git pull`＋`scripts/deploy.sh` → ③ 替換 nginx vhost → `nginx -t` → reload → ④ 線上驗收（第 3 小節第 7 項）。
- ② 與 ③ 之間 nginx 仍為舊 `location /api/`，可正常轉送 `/api/tarot/reading`；除 ② 服務重啟之數秒（第 4 小節）外無其他中斷。

---

## 十、 新增 AI 功能檢查清單（第二階段起適用）

1. 規格書 `demo_docs/<feature>_plan.md`（只寫功能專屬內容，共用部分引用本文件）＋ `decisions.md` 新 DEC（含每日總上限核對）。
2. `src/lib/<feature>/`：`config.ts`（第三節第 3 小節必備常數＋斷言）、`copy.ts`（含完整 `ERROR_MESSAGES`）、內容資料檔；伺服器專用之 `server-config.ts`、`prompt.ts`（含 `OUTPUT_TAGS`）、`ai.ts`（解析＋結構驗證）。
3. `astro.config.mjs` `env.schema` 新增 `<PREFIX>_ENABLED`／`_DAILY_LIMIT`／`_IP_DAILY_LIMIT`（前綴規則見第三節第 4 小節）；`.env.example` 同步。
4. `src/pages/api/<feature>/reading.ts`：依第四節第 1 小節順序，使用 `readJsonRequest`、`createDailyQuota`、`callWithReservation`、`logResult`。
5. 頁面 `src/pages/<feature>.astro`＋ `src/scripts/<feature>.ts`：`noindex`（評估期間）、不加入導覽列（待業主決定）、深淺雙模式、`prefers-reduced-motion`、鍵盤操作、`aria-live`、安全關懷區塊、LINE 導流、GA 事件（前綴 `<feature>_`，不含問題內容）。
6. `nginx/starwoven.conf`：頂層 `limit_req_zone … zone=<feature>_api`＋ 443 內 `location /api/<feature>/`（第八節第 2 小節範本）。
7. `scripts/deploy.sh`：`SMOKE_PATHS` 加入新端點。
8. 驗收：本文件第九節第 3 小節之第 1～2、5～6 項，加上該功能規格書之功能驗收；部署時 VPS `app.env` 加入新功能變數（未設定則套用 schema 預設值）。
9. `AGENTS.md`：路由表、環境變數段落、共用表面說明。

---

## 十一、 給設計審查者的重點（Review Checklist）

請先閱讀 `AGENTS.md`、`decisions.md`（DEC-073、DEC-074、DEC-079）、`tarot_plan.md` v1.0，以及現行程式 `src/lib/tarot/`、`src/pages/api/tarot/reading.ts`、`src/scripts/tarot.ts`、`nginx/starwoven.conf`、`scripts/deploy.sh`、`astro.config.mjs`。

1. **共用界線**：`src/lib/ai/` 之內容是否確為各功能逐行相同之邏輯；是否有不該共用而被抽出、或應共用卻留在功能層的項目；有無過度抽象。
2. **import 隔離**：以目錄劃分 `server/`／`shared/` 是否足以防止伺服器內容進入前端 bundle；驗收搜尋項目是否足夠。
3. **行為不變**：第九節第 2 小節對照表是否完整；第 3 小節 parity 驗收能否偵測重構造成之行為差異（特別是請求檢查順序、額度釋放規則、錯誤降級規則）。
4. **額度與限流分開**：各功能各一份計數、各一個 nginx zone 之設計；總量核對方式是否足以保護開發者訂閱額度。
5. **環境變數**：`TAROT_AI_*` → `AI_*` 改名之必要性與新舊並存遷移順序；功能前綴規則（特別是避開 `ASTRO_`）。
6. **nginx**：移除泛用 `location /api/` 之影響；named location 共用；跨層約束改為「每個 AI location」之表述。
7. **部署**：冒煙端點陣列與 nginx location 清單之一致性維護方式；第一階段部署順序與回滾。
8. **範疇**：第一階段是否有應延至第二階段的項目，或遺漏之必要項目。
