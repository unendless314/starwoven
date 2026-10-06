# 星靈織語 Starwoven — 網站重建 Demo 規格書（Spec）

> 狀態：v0.2（2026-10-06）— Demo 已交付（原期限 2026-09-23），本文件保留為**基準規格**。
> 其後所有範疇／IA／內容變更以 `decisions.md`（DEC-001 起）為準，文案以 `content_inventory.md` 為準。
> 目的：將 Canva 架設的現行網站重建為可自架於 VPS 的獨立網站，Demo 階段以純靜態網站為目標，向團隊證明可行性。

---

## 1. 專案背景

- 現行網站為 Canva 產出的一頁式應用：`https://jessicalam-portfolio.my.canva.site/dahp-kg9jiq/`
- 品牌名稱：**星靈織語 Starwoven**，主題為命理、占卜、靈性課程
- 未來規劃包含**課程**與**商城**功能，需要後端；但本 Demo 階段只要求靜態呈現
- 正式版的技術棧待 Demo 獲團隊認可後另行決定，本 Spec 僅涵蓋 Demo（MVP）

## 2. Demo 目標與驗收標準

| 項目 | 內容 |
|---|---|
| 目標 | 在 VPS 上自架一個外觀、內容與現行 Canva 網站一致的靜態網站 |
| 框架 | Astro（靜態輸出模式） |
| 驗收 1 | 6 個頁面皆可瀏覽，導航列可正常切換 |
| 驗收 2 | 視覺風格貼近原站：深藍星空系（首頁）＋ 淺藍水彩手繪系（內頁） |
| 驗收 3 | 「預約諮詢」CTA 連至 LINE 官方帳號 `https://line.me/R/ti/p/@347fucvj?ts=07031038&oat_content=url`（另開新分頁） |
| 驗收 4 | 可於 VPS 上以靜態檔案伺服（nginx 或同等方案）運行 |

非目標（本階段不做）：後端 API、資料庫、會員、金流、課程報名系統、商城。

## 3. 網站資訊架構（IA）

> ⚠️ 以下為**現況**（2026-10-06 同步）。與原規劃的差異：
> - 原 `/reiki`（靈氣與脈輪）、`/akashic`（光與阿卡西紀錄）兩個獨立路由已**移除**，內容深度移植為星靈專欄長文（DEC-019/020），舊網址由 nginx server 層 301 轉址至對應文章（DEC-023，`nginx/starwoven.conf`）。
> - `/shop`（星靈選物）確認**不建置**（DEC-004），購物需求由頁尾 iOpen Mall 連結承接。

```
首頁 (index)
├── 關於我們 (about)
├── 命理服務 (services)
├── 活動與課程 (courses)    ← 未來接入報名功能，目前為靜態介紹
├── 星靈專欄 (blog)         ← DEC-019 新增；下含 /blog/[...slug] 文章內頁（Astro Content Collections）
└── 預約諮詢 (CTA 按鈕 → LINE 官方帳號，另開新分頁)
```

- 各分頁獨立路由（Astro `/pages`），非錨點捲動
- 全站共用：導航列（含 RWD 漢堡選單）、Footer
- 導航列項目：關於我們 / 命理服務 / 活動與課程 / 星靈專欄 / 預約諮詢（按鈕樣式）

## 4. 視覺規格

### 4.1 風格
- 首頁：深藍紫（indigo）夜空背景、星點光斑、月亮 Logo，氛圍寧靜神秘
- 內頁：淺藍白底、水彩暈染雲朵、手繪風插圖（如滑鼠游標插圖）
- 整體字體：手寫風中文

### 4.2 色票（初估，可再校色）
| 用途 | 色碼 |
|---|---|
| 主色（深夜空） | `#2E2A4F` ～ `#3D3A63` |
| 強調（月光藍） | `#8FB8E8` |
| 內頁底色 | `#EAF3F8`（淺藍白） |
| 文字（淺底） | `#3A3A3A` |
| 文字（深底） | `#F5F5F5` |

### 4.3 字體
- 中文手寫風：建議使用開源授權字體，如 **jf open 粉圓體** 或 **源泉圓體**，以 webfont 載入
- 英文：搭配圓潤無襯線字體（如 Nunito / Quicksand）

### 4.4 素材清單

> **重要前提：手上沒有 Canva 原始素材檔，素材需重新製作。** 實際執行方式：以本機 ComfyUI（Z-Image-Turbo）生成為主、個別素材使用 OpenAI Playground（如 `服務-G`），課程與團隊照片為業主實拍（見 `image_prompts.md` 生成紀錄）。
> AI 生圖是**人機協作流程**：提示詞由人類參考 `image_prompts.md` 調整、生圖與挑圖由人類執行，成品需人工修圖（去背、調色、構圖裁切）。**不可期待全自動產出，也不可直接使用未經人工檢視的圖。**

| 素材 | 來源 | 備註 |
|---|---|---|
| 月亮＋星星 Logo | SD 生成草稿 → **人工修圖定稿**（可能需向量重繪） | 識別性素材，生成品質不穩時以 AI 草稿 + 人類描繪為準 |
| 星空背景（首頁） | SD 生成 | 需 1920px 以上寬度，中央留白放標語 |
| 水彩雲朵底圖（內頁） | SD 生成 | 需多張風格統一的變體，供不同區塊使用 |
| 手繪游標等插圖 | SD 生成 → 人工去背 | 去背 PNG |
| 課程／服務示意圖 | SD 生成 | 視切版需要決定 |
| 文案 | 自原站逐頁抄錄 | 見 `content_inventory.md`（待補） |

### 4.5 素材管理資料夾結構

```
demo_docs/
├── reference-screenshots/   ← 本地原站截圖（已加入 .gitignore，供本地對照不進版控）
├── sd-assets/               ← SD 生成圖的正式存放區
│   └── rejected/            ← 淘汰圖保留區（不刪，供回頭參考）
└── image_prompts.md         ← 提示詞模板與生成紀錄
```

## 5. 內容需求

- ✅ 各頁文案已從原站發布快取完整萃取，統整於 `content_inventory.md`（DEC-001），作為全站文案 Single Source of Truth
- 「關於我們」原站空白為 Canva 顯示限制；真實團隊資料已萃取並上架：創辦人 2 位（以恩、皮皮）＋星靈夥伴 9 位（DEC-001，第 9 位黎夢於 DEC-029 新增），成員實拍頭像已陸續上架（DEC-043 等）
- 文案整理時統一標點（全形）與用語

## 6. 技術規格

| 項目 | 決定 |
|---|---|
| 框架 | Astro 最新穩定版，static output |
| 樣式 | 原生 CSS 或 Tailwind（依開發者習慣；建議 Tailwind 加速切版） |
| 元件 | Layout.astro（head/meta/footer）、Navbar.astro、CTAButton.astro |
| 語系 | 繁體中文，`lang="zh-Hant"` |
| SEO | 每頁獨立 title / description；OG 圖全站共用 Layout 預設 `/assets/og-image.jpg`（⚠️ 檔案尚未生成，見 `known_issues/README.md` 第 4 項） |
| 建置 | `npm run build` 輸出 `dist/` |
| 部署 | VPS 上以 nginx **vhost（server block）** 服務 `dist/`，路徑 `/var/www/starwoven`；同機其他既有站台不可受影響 |
| 預留銜接點 | Google Analytics (GA4) 已完成正式導入（代碼 `G-27D79HXXF5`，由 `GoogleAnalytics.astro` 元件與 `PUBLIC_GA_ID` 環境變數注入 Layout.astro `<head>`，內建 LINE 預約與外連轉換追蹤）；全站右下角已掛載 LINE 浮動按鈕元件（連結用 LINE ID `@347fucvj`）；首頁「課程許願池」（敲碗開課）已上線，前端 `CourseWishlistCard.astro` + Google Apps Script Web App 寫入 Google 試算表（`PUBLIC_WISHLIST_API_URL` 環境變數注入，詳見 `course_wishlist_plan.md` 與 DEC-034）。 |

## 7. 部署環境

- **VPS**：Hetzner Cloud，德國 NBG1，Ubuntu（Linux 6.8.0 arm64），8 GB RAM，root SSH 可登入；IP `<YOUR_VPS_IP>`
- **網域**：已確定為 `starwoven.xyz`（DNS A record 指向 `<YOUR_VPS_IP>`）
- **同機現況**：nginx 已在運作，新站以 vhost 加入（`server_name starwoven.xyz www.starwoven.xyz;`），切勿動到現有其他站台設定
- **HTTPS**：certbot + Let's Encrypt，auto-renew
- 詳細決策紀錄見 [phase0_answers](phase0_answers.md) 與 [decisions](../decisions.md)

## 8. 授權與法律

- 本專案素材為 AI 生成（以本機 ComfyUI / Z-Image-Turbo 為主，個別素材使用 OpenAI Playground，如 `服務-G` 毛孩溝通）＋業主實拍照片，**無 Canva 原始素材**，不涉及 Canva 平台素材的移出授權問題
- 仍須注意所用模型與服務的授權條款（商用允許與否、是否需署名）；**OpenAI 服務條款之商用結論尚未確認**，需確認後記錄於 `decisions.md`（見 `development_roadmap.md` Phase 2 勾選項）
- 所有生成素材的提示詞、種子與採用紀錄統一留存於 `image_prompts.md` 的「生成紀錄」表
- 月亮 Logo 等識別性素材（現為 inline SVG）若日後改為點陣／向量品牌素材，建議由團隊作為品牌資產留存管理

## 9. 風險與待確認事項

> 2026-10-06 更新：除第 3 項（授權確認）外，各項均已結案或有定案，僅保留紀錄。

| # | 事項 | 說明 |
|---|---|---|
| 1 | 預約諮詢連結 | ✅ 已確認（LINE `@347fucvj`） |
| 2 | 關於我們頁內容 | ✅ 已解決（DEC-001 從發布快取萃取真實資料；成員後增至 9 位，DEC-029；實拍頭像陸續上架，DEC-043） |
| 3 | 素材授權 | ⚠️ **部分待確認**：素材以本機 ComfyUI（Z-Image-Turbo）＋業主實拍為主，但個別素材曾用 OpenAI Playground（`服務-G`，見 `image_prompts.md` 生成紀錄）；OpenAI 服務條款之商用結論仍需確認並記錄於 `decisions.md` |
| 4 | VPS 規格 | ✅ 已確認（Hetzner，詳見第 7 節） |
| 5 | 未來課程/商城 | ✅ 不屬本 Demo（DEC-004 確認移除 `/shop`，維持核心頁面；購買管道由頁尾 iOpen Mall 承接） |
| 6 | 期限 | ✅ Demo 已交付（原期限 2026-09-23）；後續迭代見 `decisions.md` |

---

## 交付文件

- [spec](spec.md)
- [development_roadmap](development_roadmap.md)
