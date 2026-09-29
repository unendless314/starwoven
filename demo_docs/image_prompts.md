# AI 生圖提示詞與素材管理手冊

> 狀態：v0.3（2026-09-22 新增首頁四大核心服務卡片素材提示詞，優化 ComfyUI 流程）  
> 用途：統一管理星靈織語專案所有 AI 生成圖片的提示詞、規格要求與產出履歷（符合 Spec 第 8 節授權與人機協作規範）。

---

## 命名與歸檔規範（`[分頁]-[圖片 A-Z]`）

為確保多頁面架構下切版、生圖與記錄能精準對應，全站素材一律採用 **`[分頁代碼]_[圖片代碼]_[素材名稱]_v[版本號].png`** 命名：

- **分頁代碼**：`home`（首頁）、`about`（關於我們）、`services`（命理服務）、`courses`（活動課程）、`reiki`（靈氣脈輪）、`akashic`（光與阿卡西）、`shop`（星靈選物）、`common`（跨頁共用）。
- **圖片代碼**：`a` ~ `z`（依版面由上至下、由主要至次要編排）。
- **存放路徑**：
  - 挑選採用的原圖／去背圖 → `demo_docs/sd-assets/`（例如：`home_a_tarot_world_v1.png`）
  - 淘汰或測試圖 → `demo_docs/sd-assets/rejected/`（保留備查）
  - 最終壓縮上站圖檔 → `public/assets/`
- **生圖模式**：本專案採**人機協作**，由人類操作 ComfyUI（本機 SDXL/Flux）或 OpenAI 雲端生圖，產出後人工檢視、去背定稿。

---

## 全專案通用負面提示詞（Negative Prompt）

```text
低畫質, 模糊, 變形, 多餘肢體, 雜亂線條, 文字, 浮水印, 雜訊, jpeg artifacts, 顏色過曝, 髒污感, 現代科技感, 寫實人臉攝影
low quality, blurry, deformed, extra limbs, messy lines, text, watermark, noise, jpeg artifacts, overexposed, dirty texture, modern tech, realistic human photo
```

---

## 一、【首頁】(Index / Home)

### [首頁]-[圖片 A]：塔羅牌・世界牌（The World）

- **版位用途**：首頁 Hero 區塊右側主視覺（直式卡牌形式）
- **視覺重點**：經典大阿卡納 XXI 世界牌，中央為舞動的少女舞者與月桂花環，四角落為四大神獸（天使、老鷹、公牛、獅子）。線條細膩純淨，靈性手繪風格。
- **色彩規格**：**純白線條（White Line Art）**，去背透明 PNG / SVG。
- **ComfyUI / SDXL 提示詞**：
  ```text
  (white line art:1.3), minimalist tarot illustration, the world tarot card, Major Arcana XXI, graceful dancing maiden inside an oval laurel wreath, holding two wands, ribbons floating, four sacred creatures in four corners (angel, eagle, bull, lion), ethereal, spiritual, delicate strokes, clean contour lines, (isolated on solid black background:1.4), vector style, no text, no watermark, 8k resolution
  ```
- **建議參數**：解析度 896×1152（直式 3:4 或 4:5）/ Steps 30 / CFG 7.0 / 採純黑底方便反轉去背。

---

### [首頁]-[圖片 B]：十二星座透視星盤輪盤（Zodiac Wheel）

- **版位用途**：首頁 Hero 區塊左下方輔助裝飾視覺
- **視覺重點**：3D 透視微俯視角（橢圓形）的十二星座星盤輪盤。中央太陽多芒星，外環同心刻度圈與 12 個古典星座符號。
- **色彩規格**：**純白線條（White Line Art）**，去背透明 PNG / SVG。
- **ComfyUI / SDXL 提示詞**：
  ```text
  (white line art:1.3), 3d perspective tilted celestial zodiac wheel, astrological horoscope chart, ellipse in perspective view, radiant central sunburst star, concentric dashed rings, precise twelve zodiac glyph symbols in outer segments, sacred geometry, minimal astrology diagram, (isolated on solid black background:1.4), vector illustration style, ultra clean lines
  ```
- **建議參數**：解析度 1024×768（寬幅橢圓）/ Steps 30 / CFG 7.0。

---

### [首頁]-[圖片 C]：命理諮詢・行星與星環（Planet & Stars）

- **版位用途**：首頁四大服務卡片 1「命理諮詢」頂部插圖
- **視覺重點**：土星造型行星，帶有傾斜星環，周圍有點綴的小星星與微小四芒星（Doodle 手繪插畫風）。
- **色彩規格**：**深色手繪線條（深靛藍/深灰 `#2E2A4F` 或黑色）**，卡片底色為淺色，因此需去背為深色線條。
- **ComfyUI 提示詞（CLIP Text Encode）**：
  ```text
  minimalist hand-drawn doodle illustration of Saturn planet with rings, surrounded by a few cute small twinkling sparkle stars, delicate thin clean dark outline drawing, cute ink sketch style, spiritual cosmic icon, isolated on plain pure white background, no shading, no gradient fill, vector clipart, flat 2d, high resolution
  ```
- **Negative Prompt**：
  ```text
  low quality, messy, sketchy, colored, gradient, 3d render, realistic, complex background, text, words
  ```
- **建議參數**：解析度 1024×1024 / Steps 25-30 / CFG 6.5-7.5 / 產出後使用 ComfyUI Rembg 節點或線上去背。

---

### [首頁]-[圖片 D]：課程學習・翻開的筆記本與筆（Open Notebook & Pen）

- **版位用途**：首頁四大服務卡片 2「課程學習」頂部插圖
- **視覺重點**：一本翻開平放的手帳筆記本，頁面上有簡約橫線條紋，斜放著一隻筆，象徵書寫、筆記與知識學習。
- **色彩規格**：**深色手繪細線條（深靛藍/深灰）**，去背透明。
- **ComfyUI 提示詞（CLIP Text Encode）**：
  ```text
  minimalist hand-drawn doodle illustration of an open notebook or sketchbook lying flat, with simple horizontal ruled lines on the pages, a sleek pencil or pen resting beside it, delicate clean dark outline drawing, cozy study aesthetic, isolated on plain pure white background, no shading, no gradient, flat 2d vector icon
  ```
- **Negative Prompt**：
  ```text
  low quality, messy lines, filled color, realistic photo, complex background, blurry, text, gibberish letters
  ```
- **建議參數**：解析度 1024×1024 / Steps 25-30 / CFG 6.5-7.5。

---

### [首頁]-[圖片 E]：實體活動・三人社群夥伴剪影（Community Trio Icon）

- **版位用途**：首頁四大服務卡片 3「實體活動」頂部插圖
- **視覺重點**：象徵交流與聚會的三人半身剪影組合（中央一人、兩側各一人稍微在後），溫暖、社群、聚會意象。
- **色彩規格**：**深靛藍/深灰（`#2E2A4F`）扁平剪影（Solid Silhouette）**，簡約現代。
- **ComfyUI 提示詞（CLIP Text Encode）**：
  ```text
  minimalist vector icon of three people silhouettes, group gathering, community team symbol, center person slightly forward with two companions behind, smooth rounded contours, clean solid flat dark silhouette shape, modern minimalist pictogram, isolated on plain solid white background, no gradient, no complex details, high contrast
  ```
- **Negative Prompt**：
  ```text
  low quality, detailed face, photorealistic, colors, gradients, lines, sketchy, 3d, realistic clothes
  ```
- **建議參數**：解析度 1024×1024 / Steps 25 / CFG 7.0 / 純白底便於色彩選取轉透明。

---

### [首頁]-[圖片 F]：靈氣調頻・雙手療癒與能量光芒（Reiki Healing Hands & Chakra Energy）

- **版位用途**：首頁四大服務卡片 4「靈氣調頻」頂部插圖
- **視覺重點**：一對溫柔托起或施作手勢的雙手，掌心散發出柔和的能量光芒、微小光暈與星點，象徵靈氣傳遞、脈輪療癒與身心平靜。
- **色彩規格**：**深色手繪細線條（深靛藍/深灰 `#2E2A4F`）**，去背透明。
- **ComfyUI 提示詞（CLIP Text Encode）**：
  ```text
  minimalist hand-drawn doodle illustration of gentle open cupped hands channeling healing energy, soft glowing energy light rays and tiny twinkling stars radiating from palms, reiki healing hands symbol, clean thin dark outline drawing, peaceful zen celestial aesthetic, isolated on plain solid white background, no fill, no shading, vector line art, flat 2d
  ```
- **Negative Prompt**：
  ```text
  low quality, deformed fingers, extra fingers, realistic photo, dirty texture, heavy shadows, blurry, messy scribble, text
  ```
- **建議參數**：解析度 1024×1024 / Steps 25-30 / CFG 6.5-7.5。


---

### [首頁]-[圖片 G~K, M]：固定循環課程活動現場照片（6張，待業主提供真實圖檔）

- **版位用途**：首頁「固定循環課程」區塊 6 門課程之活動現場照片插槽
- **規格建議**：直式比例（4:5 或 3:4），真實上課/團練/練習現場照片，需清晰、採光溫和自然。
- **對應編號與檔案**：
  - `[首頁]-[圖片 G]`：每週一 阿卡西紀錄與光的課程 (`home_g_course_akashic.jpg`)
  - `[首頁]-[圖片 H]`：每週二 占星循環班 (`home_h_course_astrology.jpg`)
  - `[首頁]-[圖片 M]`：每週三 偉特塔羅課程 (`home_m_course_waite.jpg`)
  - `[首頁]-[圖片 I]`：每週四 七脈輪與靈氣團練 (`home_i_course_reiki.jpg`)
  - `[首頁]-[圖片 J]`：每週五 托特塔羅循環班 (`home_j_course_thoth.jpg`)
  - `[首頁]-[圖片 K]`：每週六 生命靈數 (`home_k_course_numerology.jpg`)
- **備註**：目前前端維持精美線框佔位符（Placeholder），取得正式照片後直接放入 `public/assets/` 即可。

---

### [首頁]-[圖片 L]（選填）：深靛藍星空背景底圖

- **版位用途**：首頁全幅底圖（目前已由 CSS 漸層與光斑代打，若有高解析實圖可套入替換）
- **ComfyUI 提示詞**：
  ```text
  deep indigo and dark purple night sky background, subtle nebula gradient, scattered soft glowing star dust particles and gentle bokeh light spots, calm, mystical, dreamy spiritual atmosphere, empty center for text overlay, wide angle wallpaper composition, high resolution, smooth gradients, no moon, no horizon, no landscape, no text, no figures
  ```

---

### [首頁]-[圖片 M~O]：命理師介紹圓框現場照片（3張，待業主提供真實圖檔）

- **版位用途**：首頁「命理師介紹」區塊 3 位老師圓框頭像
- **規格建議**：正方形（1:1）或直式，建議解析度至少 600×600 px，現場工作/解盤專注照片或乾淨個人照。
- **對應編號與檔案**：
  - `[首頁]-[圖片 M]`：以恩 現場照片 (`home_m_reader_yien.jpg`)
  - `[首頁]-[圖片 N]`：皮皮 現場照片 (`home_n_reader_pipi.jpg`)
  - `[首頁]-[圖片 O]`：達心 現場照片 (`home_o_reader_daxin.jpg`)
- **備註**：前端採用 CSS `rounded-full` 與 `object-cover`，任何比例之照片丟入後皆會自動等比居中裁切成完美正圓，無須手動預先裁圓。

---

## 二、【命理服務】(Services / starwovenwrite)

### [服務]-[圖片 A~F]：六大服務項目手繪插圖（6張）

- **版位用途**：命理服務頁面（`/services`）6 大雙欄卡片頂部專屬插圖位置
- **視覺重點**：靈性、溫暖的手繪線條或水彩插畫（Doodle 插畫風），底色透明 PNG。
- **對應編號與檔案**：
  - `[服務]-[圖片 A]`：塔羅占卜插圖（拱門卡牌、星月與神聖光芒）(`services_a_tarot_v1.png`)
  - `[服務]-[圖片 B]`：星盤解析插圖（十二星座符號與同心天體星盤）(`services_b_astrology_v1.png`)
  - `[服務]-[圖片 C]`：生命靈數插圖（神聖幾何圖形、三角星與靈數之光）(`services_c_numerology_v1.png`)
  - `[服務]-[圖片 D]`：八字命理插圖（東方太極兩儀、五行流轉與易經卦象）(`services_d_bazi_v1.png`)
  - `[服務]-[圖片 E]`：靈氣調頻插圖（雙手溫柔托舉、能量微光與七脈輪能量中心）(`services_e_reiki_v1.png`)
  - `[服務]-[圖片 F]`：阿卡西紀錄插圖（開啟的光芒之書、智慧之眼與無垠星辰）(`services_f_akashic_v1.png`)
- **備註**：前端採用等比響應式容器；取得真圖前自動呈現各主題專屬之精緻 SVG 幾何圖示與素材代碼。

---

## 三、【活動與課程】(Courses / starwovenstudy)

### [課程]-[圖片 A~F]：固定循環課程現場活動照片（6張，待業主提供真圖）

- **版位用途**：活動課程頁面（`/courses`）固定循環課程 6 大卡片頂部 16:10 照片插槽
- **對應編號與檔案**：
  - `[課程]-[圖片 A]`：週一 光與阿卡西紀錄現場照 (`courses_a_akashic.jpg`)
  - `[課程]-[圖片 B]`：週二 占星循環班現場照 (`courses_b_astrology.jpg`)
  - `[課程]-[圖片 C]`：週三 偉特塔羅團練現場照 (`courses_c_waite.jpg`)
  - `[課程]-[圖片 D]`：週四 七脈輪與靈氣現場照 (`courses_d_reiki.jpg`)
  - `[課程]-[圖片 E]`：週五 托特塔羅循環班現場照 (`courses_e_thoth.jpg`)
  - `[課程]-[圖片 F]`：週六 生命靈數循環班現場照 (`courses_f_numerology.jpg`)
- **備註**：目前前端維護專屬手繪靈性 SVG 符號佔位符；取得現場照片後直接放進 `public/assets/` 即可等比自適應填滿。

---

### [課程]-[圖片 G]：命理交流會實體現場活動照（1張，待業主提供真圖）

- **版位用途**：活動課程頁面「實體交流會」專區左側照片插槽 (`courses_g_meetup.jpg`)
- **規格建議**：方形或 4:3 橫式，學員排盤、切磋研討之溫馨互動照片。

---

### [課程]-[圖片 H~K]：四大主題體驗課程情境海報（4張）

- **版位用途**：活動課程頁面「主題體驗課程」4 大海報式大卡片頂部 16:9 留圖區
- **對應編號與檔案**：
  - `[課程]-[圖片 H]`：塏易學 梅花易數情境海報 (`courses_h_meihua.jpg` / `.png`)
  - `[課程]-[圖片 I]`：畫出你的獨角獸 流體畫情境海報 (`courses_i_unicorn.jpg` / `.png`)
  - `[課程]-[圖片 J]`：禪繞畫體驗 禪繞羽毛情境海報 (`courses_j_zentangle.jpg` / `.png`)
  - `[課程]-[圖片 K]`：牌卡調香體驗 精油牌卡情境海報 (`courses_k_aroma.jpg` / `.png`)

---

## 四、【共用與內頁預留】

### [共用]-[圖片 A]：內頁淺藍水彩雲朵底圖（Watercolor Wash）

- **版位用途**：全站所有內頁（`/services`、`/courses`、`/about`、`/reiki`、`/akashic`、`/shop`）之水彩背景。
- **提示詞**：
  ```text
  minimal soft watercolor wash texture background, very pale sky blue, light pastel lavender accents and airy white clouds, gentle hand-painted bleeding edges, clean aesthetic, large blank breathing space, high key lighting, calm and healing feeling, abstract, no hard lines, no text, no objects
  ```

---

### [頁尾]-[圖片 A~D]：聯絡我們 官方社群與賣場 QR Code（4張）

- **版位用途**：全站頁尾「聯絡我們」區塊之官方條碼
- **規格建議**：正方形 PNG，純白底色帶邊界安全距離（Quiet zone），保證手機相機與掃描器秒讀。
- **對應編號與檔案**：
  - `[頁尾]-[圖片 A]`：Line ID `starwoven` QR Code (`footer_qr_line.png`)
  - `[頁尾]-[圖片 B]`：Instagram `starwoven2026` QR Code (`footer_qr_instagram.png`)
  - `[頁尾]-[圖片 C]`：Line 社群 `星靈織語` QR Code (`footer_qr_community.png`)
  - `[頁尾]-[圖片 D]`：iOpen Mall `星靈選物` QR Code (`footer_qr_iopenmall.png`)
- **備註**：已從 Canva 高清實測截圖精準提取裁切，並加上安全空白邊界；前端同時封裝超連結，手機訪客點擊可直達 App 或網頁。

---

## 三、生成紀錄（Generation Log）

| 編號 | 素材名稱 | 日期 | 平台 / 模型 | 提示詞（摘要） | 種子碼 (Seed) | 評選結果 | 後製方式 | 存放檔名 |
|---|---|---|---|---|---|---|---|---|
| `首頁-A` | 塔羅牌・世界牌 | 2026-09-22 | ComfyUI | 舞者花環四大神獸白線 | | 待生成 | 待去背 | `home_a_tarot_world_v1.png` |
| `首頁-B` | 十二星座星盤輪盤 | 2026-09-22 | ComfyUI | 傾斜透視橢圓星盤白線 | | 待生成 | 待去背 | `home_b_zodiac_wheel_v1.png` |
| `首頁-C` | 命理諮詢・行星星環 | 2026-09-22 | ComfyUI | 土星造型手繪細線條 | | 待生成 | 白底去背 | `home_c_planet_stars_v1.png` |
| `首頁-D` | 課程學習・筆記本筆 | 2026-09-22 | ComfyUI | 翻開手帳筆記本與筆 | | 待生成 | 白底去背 | `home_d_open_book_v1.png` |
| `首頁-E` | 實體活動・三人剪影 | 2026-09-22 | ComfyUI | 三人聚會扁平剪影圖標 | | 待生成 | 剪影轉透明 | `home_e_community_trio_v1.png` |
| `首頁-F` | 星靈選物・水晶植物 | 2026-09-22 | ComfyUI | 晶簇礦石與草本葉片 | | 待生成 | 白底去背 | `home_f_crystals_botanical_v1.png` |
| `首頁-G` | 週一 阿卡西課照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_g_course_akashic.jpg` |
| `首頁-H` | 週二 占星班照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_h_course_astrology.jpg` |
| `首頁-I` | 週四 靈氣團練照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_i_course_reiki.jpg` |
| `首頁-J` | 週五 托特塔羅照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_j_course_thoth.jpg` |
| `首頁-K` | 週六 生命靈數照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_k_course_numerology.jpg` |
| `首頁-L` | 深靛藍星空背景 | 2026-09-22 | ComfyUI | 深靛藍暗紫星塵留白底圖 | | 待生成 | 壓至1MB內 | `home_l_bg_stars_v1.png` |
| `首頁-M` | 以恩 現場照 | 2026-09-22 | 業主實拍 | 實體解盤工作照片 | - | 待提供 | 居中裁切 | `home_m_reader_yien.jpg` |
| `首頁-N` | 皮皮 現場照 | 2026-09-22 | 業主實拍 | 實體解盤工作照片 | - | 待提供 | 居中裁切 | `home_n_reader_pipi.jpg` |
| `首頁-O` | 達心 現場照 | 2026-09-22 | 業主實拍 | 實體解盤工作照片 | - | 待提供 | 居中裁切 | `home_o_reader_daxin.jpg` |
| `共用-A` | 內頁淺藍水彩底圖 | 2026-09-22 | ComfyUI | 淡天藍水彩暈染雲朵 | | 待生成 | 裁切調色 | `common_a_watercolor_bg_v1.png` |
| `頁尾-A` | Line ID 條碼 | 2026-09-22 | 實體擷圖 | 官方 LINE 條碼 | - | 採用 | 安全留白 | `footer_qr_line.png` |
| `頁尾-B` | Instagram 條碼 | 2026-09-22 | 實體擷圖 | 官方 IG 條碼 | - | 採用 | 安全留白 | `footer_qr_instagram.png` |
| `頁尾-C` | Line 社群 條碼 | 2026-09-22 | 實體擷圖 | 官方社群條碼 | - | 採用 | 安全留白 | `footer_qr_community.png` |
| `頁尾-D` | iOpen Mall 條碼 | 2026-09-22 | 實體擷圖 | 7-11 賣場條碼 | - | 採用 | 安全留白 | `footer_qr_iopenmall.png` |
