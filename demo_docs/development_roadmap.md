# 星靈織語 Demo — 建議開發順序

> 狀態：v0.3（2026-10-06）— **Phase 0–4 已完成、Demo 已交付**；Phase 5 部署配置檔已備妥（`nginx/starwoven.conf`），實際 VPS 部署與 Phase 6 簡報尚未執行（依業主安排）。
> 後續迭代不再走 Phase 制，統一記錄於 `decisions.md`（DEC-001 起）。
> 配套文件：[spec.md](spec.md)、[phase0_answers.md](phase0_answers.md)、[image_prompts.md](image_prompts.md)
> ~~專案期限：2026-09-23~~（已達成）。採多 agent 平行開發策略，瓶頸在 review 與溝通效率。
> 設計給接手的 AI 或開發者依序執行，每個 Phase 完成後建議跑一次檢查點再往下。

---

## Phase 0：前置確認

> ✅ **已完成（2026-09-21）**，回答紀錄見 [phase0_answers.md](phase0_answers.md)。以下項目已確認：
>
> - [x] 預約諮詢 CTA → LINE `@347fucvj`（另開新分頁）
> - [x] 關於我們：10 人（創辦人 2 + 成員 8），文案照片待人工提供，先佔位版型
> - [x] 團隊接受 AI 重製視覺差異（Demo 定位）
> - [x] 生圖路徑：OpenAI 雲端批量生成（本機 AMD R9700 作備援）
> - [x] VPS：Hetzner NBG1 / Ubuntu arm64 / nginx vhost 加入；IP `<YOUR_VPS_IP>`；網域確定為 `starwoven.xyz`
>
> 僅存待辦：
> - [x] 從原站逐頁抄錄文案，整理成 `content_inventory.md`（之後所有頁面以此為內容來源）

## Phase 1：專案骨架（0.5 天）

- [x] 建立 Astro 專案（static output），裝 Tailwind（或決定純 CSS）
- [x] 建立共用元件：
  - `Layout.astro` — HTML 骨架、`<head>`（meta / OG / favicon）、footer
  - `Navbar.astro` — 桌面導航列 + 行動版漢堡選單
  - `CTAButton.astro` — 預約諮詢按鈕（連結先放佔位符 `#`，Phase 0 確認後替換）
- [x] 建立 6 個空頁面路由，導航列切換可運作
- [x] 載入 webfont（粉圓體 / 源泉圓體）與基礎色票（定義為 CSS 變數或 Tailwind theme）

**檢查點**：`npm run dev` 可跑，6 個空白頁可互相切換、手機寬度漢堡選單可開關。

## Phase 2：素材準備（1～2 天，人機協作，可與 Phase 1 平行）

> ⚠️ 本階段為**人工為主、AI 為輔**：生圖、挑圖、修圖由人類執行，AI 助手只協助起草原案與提示詞。團隊已確認接受 AI 重製視覺與原站的差異（見 phase0_answers.md 問題 3）。
> 實際執行差異（2026-10-06 註記）：生圖以**本機 ComfyUI（Z-Image-Turbo）**為主、輔以**業主實拍照片**；**個別素材曾使用 OpenAI Playground**（如 `服務-G` 毛孩溝通插圖，見 `image_prompts.md`「六、生成紀錄」），OpenAI 服務條款之商用授權結論仍需確認。

- [x] 人類操作生圖，參考 `image_prompts.md` 生成並挑選：
  - [x] 月亮＋星星 Logo — 以 inline SVG（月亮＋四芒星）定稿於 `Navbar.astro`，無位圖素材
  - [x] 首頁星空背景 — 未採用位圖，由 CSS 漸層與光斑粒子渲染（`index.astro` 保留 `imgHeroBg` 介面）
  - [x] 內頁水彩雲朵底圖 — 同上，以 CSS 漸層與光斑呈現
  - [ ] 手繪游標等插圖 — 版面未使用，未生成
- [x] 採用圖放 `demo_docs/sd-assets/`，淘汰圖放 `demo_docs/sd-assets/rejected/`
- [x] 逐筆填寫 `image_prompts.md` 的「生成紀錄」（提示詞、日期、結果、後製方式）
- [ ] 生圖授權結論 — 生圖以本機 ComfyUI 為主，但曾使用 OpenAI Playground（`服務-G` 毛孩溝通）；OpenAI 服務條款之商用結論仍需確認並記錄於 `decisions.md`
- [x] 所有圖檔壓縮為 WebP Q85（首頁總圖檔遠低於 1 MB），正式版放網站 `public/assets/`

**檢查點**：所有素材就位於 `sd-assets/` 且都有生成紀錄；**人工逐一檢視過**，沒有未經人眼的圖上站。

## Phase 3：首頁切版（1 天）

- [x] Hero 區：星空背景（CSS 漸層＋光斑粒子）+ Logo + 標語「每一段相遇，都是一場心靈的編織。」+ 副標
- [x] 導航列置頂（sticky＋半透明毛玻璃效果，貼近原站）
- [x] 頁尾（footer）：聯絡我們、地址導航按鈕、社群圖示列、版權（後續多次改版見 DEC-007/009/025/044/045/047）
- [x] 響應式檢查（手機 / 平板 / 桌面）

**檢查點**：首頁與原站設計規劃（依據 `content_inventory.md` 與規格）並排比對，風格一致。✅ 已達成（首頁另陸續擴充四大服務卡片、固定循環課程、課程許願池與學員評價輪播，見 DEC-006/030/034）。

## Phase 4：內頁切版（1.5～2 天）

依內容多寡排序進行：

1. 命理服務（`services`）✅ — 7 大服務雙欄大卡片／價格／師資名單／預約按鈕（DEC-011，毛孩溝通於 DEC-042 上架）
2. 活動課程（`courses`）✅ — 固定課程（圖片常態外顯＋手風琴詳情）、交流會、主題體驗工作坊（DEC-014/015/016/028）
3. 靈氣與脈輪（`reiki`）✅ — **改以星靈專欄長文承接**（DEC-019/020），獨立路由移除並設 301（DEC-023）
4. 光與阿卡西紀錄（`akashic`）✅ — 同上，移植為專欄長文
5. 關於我們（`about`）✅ — 真實團隊資料（DEC-001）＋ Canva 2×4 成員網格對齊（DEC-017）＋ 實拍頭像上架（DEC-043）

- [x] 每頁套用淺藍水彩風格底色（以 CSS 漸層實現；另支援全站深淺色切換，DEC-008）
- [x] 每頁獨立 title / description
- [ ] 每頁獨立 OG 圖 — 目前各頁未傳 `ogImage`，共用 Layout 預設 `/assets/og-image.jpg` 且**該檔案尚未存在**（見 `known_issues/README.md` 第 4 項）
- [x] 各頁與原站截圖比對（DEC-011/014/017 等多次對齊 Canva 原版）

**檢查點**：核心頁面全部完成，導航、CTA、響應式皆正常。✅ 已達成；IA 後續調整（新增 `/blog`、移除 `/reiki` `/akashic`）見 `decisions.md`。

## Phase 5：建置與部署（0.5～1 天）

> 環境已確認（見 phase0_answers.md 問題 5）：Hetzner Ubuntu arm64、nginx 已在運作。
> 2026-10-06 註記：vhost 配置檔已落地版控（`nginx/starwoven.conf`，含 `/reiki` `/akashic` 301、靜態快取、gzip、安全標頭，DEC-023）；**實際上傳 VPS、DNS 與憑證作業尚未執行**，待業主安排。

- [x] `npm run build` 產生 `dist/`，本機驗證正式輸出無誤
- [x] 以 **vhost（server block）** 撰寫新站配置（root 指向 `/var/www/starwoven`，`server_name starwoven.xyz www.starwoven.xyz`），配置檔收錄於 `nginx/starwoven.conf`；**切勿改動現有既有站台**，注意 port 衝突
- [ ] 上傳 `dist/` 至 VPS（rsync / scp）⬅ 待執行
- [ ] DNS A record（`@` 與 `www`）指向 `<YOUR_VPS_IP>` ⬅ 待執行（網域已定案 `starwoven.xyz`，DEC-003）
- [ ] 以 certbot + Let's Encrypt 啟用 HTTPS（auto-renew）⬅ 待執行
- [x] 導入 Google Analytics 4 (GA4: `G-27D79HXXF5`) 與核心轉換事件埋點（LINE 預約、地圖導航、iOpen Mall 賣場）
- [ ] 手機實機測試一次 ⬅ 待執行

**檢查點**：團隊可由外部網址（或 IP）瀏覽完整網站。

## Phase 6：Demo 簡報準備（0.5 天）

- [ ] 截圖：原站 vs 新站對照圖（首頁 + 1～2 個內頁）
- [ ] 準備簡短說明：成本（VPS 月費 vs Canva）、效能（載入速度數據）、未來擴充路線（課程 / 商城可接 Headless CMS 或 Next.js）
- [ ] 列出正式版需要決策的技術棧選項與優劣

**檢查點**：可向同事進行 10 分鐘內的 Demo 簡報。

---

## 時程總覽（一人開發估計）

| Phase | 工作天 |
|---|---|
| 0 前置確認 | 0.5–1 |
| 1 骨架 | 0.5 |
| 2 素材 | 1–2 |
| 3 首頁 | 1 |
| 4 內頁 | 1.5–2 |
| 5 部署 | 0.5–1 |
| 6 簡報 | 0.5 |
| **合計** | **約 6–8 工作天** |

## 給接手 AI 的執行守則

1. 嚴格依照 Phase 順序，完成一個 Phase 並通過檢查點再進下一個
2. 文案一律以 `content_inventory.md` 為準，不要憑空編造
3. 素材缺漏時用佔位圖（灰色底 + 檔名標示），不要停止開發
4. 每個 Phase 結束更新本文件的 checkbox 狀態
5. 遇到 Spec 未定義的決策，記錄在 `decisions.md`，不要自行默默決定

---

## 交付文件

- [spec](spec.md)
- [development_roadmap](development_roadmap.md)
