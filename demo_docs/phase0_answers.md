# Phase 0 確認紀錄

> 建立時間：2026-09-21 16:22
> 用途：保存 Phase 0 行政確認的回答，作為 Spec 與開發依據。

## 問題 1：預約諮詢按鈕的連結

- **答案**：LINE 官方帳號連結
- **URL**：`https://line.me/R/ti/p/@347fucvj?ts=07031038&oat_content=url`
- **LINE ID**：`@347fucvj`
- 備註：全站「預約諮詢」CTA 統一使用此連結，按鈕另開新分頁（`target="_blank"`）

## 問題 2：關於我們頁面內容

- **答案**：
  - 原站空白是 Canva 網站本身的顯示限制，**不代表這頁沒內容**；接手者勿以截圖空白為由省略此頁
  - 團隊共 **10 人**：創辦人 2 位 + 其他成員 8 位
  - 各人介紹文案與照片：**需人工向業主轉述取得或請業主截圖**，AI 工程師不可憑空編造人名與介紹
- **待人工提供**：創辦人與成員的姓名/稱號、介紹文案、照片
- **Demo 階段建議做法**：頁面先做好版型（區塊：品牌故事 → 創辦人 ×2 → 成員牆 ×8），內容用佔位文字（如「創辦人 A」）與佔位圖，待人工補齊後替換

## 問題 3：團隊對 AI 重製視覺的接受度

- **答案**：**A. 可以接受**。團隊共識：Demo 目的為證明可行性，AI 生成的 Logo/插圖與原站有細節差異無妨，氛圍對即可
- 開發含義：素材流程依 Spec 4.4 的 SD 生成 + 人工修圖即可，**不需**人工向量重繪 Logo 的備援流程；正式版上線前再評論是否要精修品牌識別

## 問題 4：Stable Diffusion 環境

- **答案**：
  - 本機顯卡：AMD Radeon AI PRO R9700，32 GB VRAM（AMD 卡跑 SD 需 DirectML/ROCm 環境，可作備援）
  - **主要生圖路徑：OpenAI 雲端服務**，理由：批量生成速度快
- 開發含義：
  - `image_prompts.md` 的 SD 提示詞模板（tag 風格）需改寫為**自然語言描述**以適配 OpenAI 生圖 API，或兩者並存
  - 商用授權：以 OpenAI 生圖服務條款為準，採用前需在 `decisions.md` 記錄條款結論
  - SD 本機環境僅作備援，不列入 Demo 關鍵路徑

## 問題 5：VPS 與網域名稱

- **答案**（由雲端管理 AI 提供，2026-09-21）：
  - **VPS**：Hetzner Cloud，德國 NBG1（機房），Ubuntu（Linux 6.8.0 arm64），8 GB RAM，有 root SSH 權限
  - **IP**：`<YOUR_VPS_IP>`
  - **網域**：已確定為 `starwoven.xyz`（2026-09-23 確認，見 `decisions.md` DEC-003）
  - **同機現況**：nginx 已在運作，已有其他既有站台共用；**新站必須以 vhost（server block）加入，切勿改動現有站台設定、注意 port 衝突**
  - **部署流程**：寫成 Ubuntu + nginx + Let's Encrypt 通用流程；SSL 用 certbot auto-renew
  - **DNS**：A record 指向 `<YOUR_VPS_IP>`（包括 `@` 與 `www`）
- 網站類型確認：**純靜態網站**（Astro build 產出 `dist/`），nginx 直接 serve 靜態檔即可，**不需要 reverse proxy**
- 部署路徑建議：`/var/www/starwoven`（server block `root` 指向此處）

## 問題 6：其他／補充

- **專案期限**：**2026-09-23（後天）**。策略：同時開多個 agent 平行作業；業主自評瓶頸在 review 速度與多 agent 溝通效率，開發本身（靜態網頁）不是瓶頸
- **GA（Google Analytics）**：✅ **已完成正式啟用**。Measurement ID 確認為 `G-27D79HXXF5`，透過獨立元件 `GoogleAnalytics.astro` 與環境變數 `PUBLIC_GA_ID` 整合至 Layout.astro `<head>`，並自動監聽 LINE 預約與外連轉換事件。
- **LINE 嵌入按鈕**：✅ **已完成實作**。全站右下角已掛載固定懸浮 LINE 預約諮詢按鈕（連結用問題 1 的 `@347fucvj`），並支援 GA 轉換點擊追蹤。
- 結論：Phase 0 確認完成，Spec 與 Roadmap 可依此定稿；問題 2 的關於我們文案仍待人工提供，以佔位版型先行
