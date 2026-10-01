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
- **建議參數**：解析度 1024×1024（1:1 正方形）/ Steps 8 (Turbo) 或 30 / CFG 1.0~7.0。

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

### [首頁]-[圖片 G~L]：固定循環課程活動現場照片（6張，待業主提供真實圖檔）

- **版位用途**：首頁「固定循環課程」區塊 6 門課程之活動現場照片插槽
- **規格建議**：直式比例（4:5 或 3:4），真實上課/團練/練習現場照片，需清晰、採光溫和自然。
- **對應編號與檔案**：
  - `[首頁]-[圖片 G]`：每週一 阿卡西紀錄與光的課程 (`home_g_course_akashic.jpg`)
  - `[首頁]-[圖片 H]`：每週二 占星循環班 (`home_h_course_astrology.jpg`)
  - `[首頁]-[圖片 I]`：每週三 偉特塔羅團練 (`home_i_course_waite.jpg`)
  - `[首頁]-[圖片 J]`：每週四 七脈輪與靈氣團練 (`home_j_course_reiki.jpg`)
  - `[首頁]-[圖片 K]`：每週五 托特塔羅循環班 (`home_k_course_thoth.jpg`)
  - `[首頁]-[圖片 L]`：每週六 生命靈數 (`home_l_course_numerology.jpg`)
- **備註**：目前前端維持精美線框佔位符（Placeholder），取得正式照片後直接放入 `public/assets/` 即可。

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

### [首頁]-[圖片 P]（選填）：深靛藍星空背景底圖

- **版位用途**：首頁全幅底圖（目前已由 CSS 漸層與光斑代打，若有高解析實圖可套入替換）
- **ComfyUI 提示詞**：
  ```text
  deep indigo and dark purple night sky background, subtle nebula gradient, scattered soft glowing star dust particles and gentle bokeh light spots, calm, mystical, dreamy spiritual atmosphere, empty center for text overlay, wide angle wallpaper composition, high resolution, smooth gradients, no moon, no horizon, no landscape, no text, no figures
  ```
- **存放檔名**：`home_p_bg_stars_v1.png`

---

## 二、【命理服務】(Services / starwovenwrite)

### [服務]-[圖片 A~F]：六大服務項目全彩手繪水彩插圖（6張，已採用上線）

- **版位用途**：命理服務頁面（`/services`）6 大雙欄卡片頂部專屬插圖位置（`w-24 h-24 sm:w-28 sm:h-28` 容器，居中 `object-contain`）
- **視覺重點**：溫暖靈性的全彩水彩插畫（Full Color Watercolor Illustration），完美呼應 Canva 原站視覺調性，去背透明 WebP 支援深淺色雙主題自適應。
- **對應編號與檔案**：
  - `[服務]-[圖片 A]`：塔羅占卜插圖（神秘深紫金邊雙牌、星月與粉晶光芒）(`services_a_tarot_v1.webp`)
  - `[服務]-[圖片 B]`：星盤解析插圖（金色同心星盤輪盤、水彩星雲與星座符號）(`services_b_astrology_v1.webp`)
  - `[服務]-[圖片 C]`：生命靈數插圖（神聖幾何九芒星、金光與水彩靈數圓圈）(`services_c_numerology_v1.webp`)
  - `[服務]-[圖片 D]`：八字命理插圖（東方水墨水彩太極陰陽兩儀、五行流轉氣韻）(`services_d_bazi_v1.webp`)
  - `[服務]-[圖片 E]`：靈氣調頻插圖（雙手溫柔托舉、七脈輪彩虹能量光球升騰）(`services_e_reiki_v1.webp`)
  - `[服務]-[圖片 F]`：阿卡西紀錄插圖（茂盛生命之樹、金葉星塵與靈魂源頭水彩）(`services_f_akashic_v1.webp`)
- **備註**：已全部完成 ComfyUI 生成、高品質去背（Transparent RGBA）與 WebP 最佳化，正式部署於 `public/assets/` 與 `src/pages/services.astro`。

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

### [課程]-[圖片 H~J]：主題體驗課程情境海報（3張）

- **版位用途**：活動課程頁面「主題體驗課程」海報式大卡片頂部 16:9 留圖區
- **對應編號與檔案**：
  - `[課程]-[圖片 H]`：塏易學 梅花易數情境海報 (`courses_h_meihua.jpg` / `.png`)
  - `[課程]-[圖片 I]`：八字體驗情境海報 (`courses_i_bazi.jpg` / `.png`)
  - `[課程]-[圖片 J]`：紫微斗數工作坊情境海報 (`courses_j_ziwei.jpg` / `.png`)

---

## 四、【關於我們】(About / starwovenpeople)

### [關於]-[圖片 A]：品牌故事氛圍插圖（1張）

- **版位用途**：關於我們頁面（`/about`）「我們從抱團取暖開始，現在我們想要傳承」區塊右側主視覺
- **規格建議**：直式比例（約 4:5 或 3:4，Canva 原始規格為寬 447 × 高 517 px）。
- **視覺重點**：雙手於深邃星空與星塵之中，輕柔托起或交織出發光的絲線與星辰網絡，象徵將知識、經驗與每一道光持續傳承。
- **ComfyUI / SDXL 提示詞**：
  ```text
  spiritual cosmic illustration, glowing ethereal hands weaving threads of light across the night sky, intricate constellation patterns, stardust particles, soft pastel nebulae, sacred connection, gentle warm aura, magical celestial loom, artistic fantasy concept art, high resolution, soft cinematic lighting, deep indigo and golden starlight
  ```
- **對應檔案**：`about_a_brand_story.png`

---

### [關於]-[圖片 B~C]：創辦人圓框形象照（2張，待業主提供真圖）

- **版位用途**：關於我們頁面「星靈織語創辦人」2 欄大名片圓框頭像（Canva 原始規格 269 × 269 px 正圓）
- **規格建議**：正方形（1:1），解析度至少 600×600 px，清晰個人肖像或靈性工作照。
- **對應編號與檔案**：
  - `[關於]-[圖片 B]`：以恩 創辦人形象照 (`about_b_founder_yien.jpg`)
  - `[關於]-[圖片 C]`：皮皮 創辦人形象照 (`about_c_founder_pipi.jpg`)
- **備註**：前端封裝 `rounded-full` 與 `object-cover`，任何比例照片置入皆自動居中裁切成正圓。未上傳前自動呈現專屬創辦人靈性符號與代碼標籤。

---

### [關於]-[圖片 D~K]：星靈織語夥伴形象照（8張，2欄 × 4排，待業主提供真圖）

- **版位用途**：關於我們頁面「星靈織語夥伴」8 位成員橫式名片圓框頭像（Canva 原始規格 269 × 269 px）
- **排列順序（嚴格對應 Canva 原始 2*4 行）**：
  - 第 1 排：`[關於]-[圖片 D]` 達心 (`about_d_member_daxin.jpg`) · `[關於]-[圖片 E]` 學長 (`about_e_member_xiaoyu.jpg`)
  - 第 2 排：`[關於]-[圖片 F]` 悠悠 (`about_f_member_youyou.jpg`) · `[關於]-[圖片 G]` 姆姆 (`about_g_member_mumu.jpg`)
  - 第 3 排：`[關於]-[圖片 H]` 凜月 (`about_h_member_linyue.jpg`) · `[關於]-[圖片 I]` 白白 (`about_i_member_baibai.jpg`)
  - 第 4 排：`[關於]-[圖片 J]` Migo (`about_j_member_migo.jpg`) · `[關於]-[圖片 K]` 古古 (`about_k_member_gugu.jpg`)
- **備註**：取得照片後置於 `public/assets/` 即可立即自動上線。

---

## 五、【共用與內頁預留】

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

### [專欄]-[圖片 A~E]：星靈專欄 5 大深度專文情境水彩插圖（5張，已採用上線）

- **版位用途**：星靈專欄列表頁（`/blog`，16:10 寬幅卡片）與文章詳情內頁（`/blog/[slug]`，16:9 / 21:9 頂部編輯部橫幅）
- **規格規格**：1344 × 768（SDXL 標準寬幅，比例 1.75:1，滿版手繪水彩風格無須去背）
- **對應編號與檔案**：
  - `[專欄]-[圖片 A]`：光與阿卡西紀錄精選專文插圖（生命之書、天國金色光柱與命運星塵）(`blog_a_akashic_light_v1.webp`)
  - `[專欄]-[圖片 B]`：初探阿卡西紀錄專文插圖（靈魂藍圖神聖幾何、星辰之門與以太圖書館）(`blog_b_akashic_intro_v1.webp`)
  - `[專欄]-[圖片 C]`：臼井靈氣與七脈輪專文插圖（冥想人體光影輪廓、七脈輪彩虹能量光球升騰）(`blog_c_reiki_chakras_v1.webp`)
  - `[專欄]-[圖片 D]`：日常能量急救包專文插圖（雙手捧托翡翠綠與粉金能量光、晨光與居家靜心）(`blog_d_reiki_healing_v1.webp`)
  - `[專欄]-[圖片 E]`：塔羅牌心靈之鏡專文插圖（古典靈性鏡面、水彩倒映星盤與星星牌光暈）(`blog_e_tarot_mirror_v1.webp`)
- **備註**：全部採用 ComfyUI Z-Image-Turbo / SDXL 生成，經專案標準流程壓縮為高品質 WebP（品質 85，跳過去背保留滿版水彩 wash），正式部署於 `public/assets/` 與文章 Markdown frontmatter。

---

## 六、生成紀錄（Generation Log）

| 編號 | 素材名稱 | 日期 | 平台 / 模型 | 提示詞（摘要） | 種子碼 (Seed) | 評選結果 | 後製方式 | 存放檔名 |
|---|---|---|---|---|---|---|---|---|
| `首頁-A` | 塔羅牌・世界牌 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 舞者花環四大神獸白線 | 756252877462802 | 淘汰 (備查) | 移至 rejected | `home_a_tarot_world_v1.webp` |
| `首頁-A` | 塔羅牌・世界牌 (v2) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 彩虹漸層舞者花環四大神獸 | 115754867374705 | 淘汰 (備查) | 移至 rejected | `home_a_tarot_world_v2.webp` |
| `首頁-A` | 塔羅牌・世界牌 (v3) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 飽和彩虹光暈舞者花環神獸 | 1055348331508342 | 採用上架 | 轉 WebP Q85 | `home_a_tarot_world_v3.webp` |
| `首頁-B` | 十二星座星盤輪盤 | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 3D透視十二星座星盤彩虹光 | 885617653962545 | 採用上架 | 轉 WebP Q85 (1:1) | `home_b_zodiac_wheel_v1.webp` |
| `首頁-C` | 命理諮詢・行星星環 | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 土星造型手繪細線條星芒 | 992106538623070 | 採用上架 | 去背 + 轉 WebP | `home_c_planet_stars_v1.webp` |
| `首頁-D` | 課程學習・筆記本筆 | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 翻開手帳筆記本與筆星芒 | 808022016837652 | 採用上架 | 去背 + 轉 WebP | `home_d_open_book_v1.webp` |
| `首頁-E` | 實體活動・三人社群 | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 靈性夥伴圍坐聚會手繪星芒 | 1004066584927966 | 採用上架 | 去背 + 轉 WebP | `home_e_community_trio_v1.webp` |
| `首頁-F` | 靈氣調頻・雙手能量 | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 雙手托起能量光芒手繪 | 244399405058717 | 採用上架 | 去背 + 轉 WebP | `home_f_reiki_hands_v1.webp` |
| `首頁-G` | 週一 阿卡西課照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_g_course_akashic.jpg` |
| `首頁-H` | 週二 占星班照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_h_course_astrology.jpg` |
| `首頁-I` | 週三 偉特團練照 | 2026-09-30 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_i_course_waite.jpg` |
| `首頁-J` | 週四 靈氣團練照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_j_course_reiki.jpg` |
| `首頁-K` | 週五 托特塔羅照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_k_course_thoth.jpg` |
| `首頁-L` | 週六 生命靈數照 | 2026-09-22 | 業主實拍 | 實體活動現場照片 | - | 待提供 | 壓縮優化 | `home_l_course_numerology.jpg` |
| `首頁-M` | 以恩 現場照 | 2026-09-22 | 業主實拍 | 實體解盤工作照片 | - | 待提供 | 居中裁切 | `home_m_reader_yien.jpg` |
| `首頁-N` | 皮皮 現場照 | 2026-09-22 | 業主實拍 | 實體解盤工作照片 | - | 待提供 | 居中裁切 | `home_n_reader_pipi.jpg` |
| `首頁-O` | 達心 現場照 | 2026-09-22 | 業主實拍 | 實體解盤工作照片 | - | 待提供 | 居中裁切 | `home_o_reader_daxin.jpg` |
| `首頁-P` | 深靛藍星空背景 | 2026-09-22 | ComfyUI | 深靛藍暗紫星塵留白底圖 | | 待生成 | 壓至1MB內 | `home_p_bg_stars_v1.png` |
| `服務-A` | 塔羅占卜 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 神秘紫金雙塔羅牌粉晶光芒 | 588777160954832 | 採用上架 | 去背 + 轉 WebP | `services_a_tarot_v1.webp` |
| `服務-B` | 星盤解析 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 金色天體同心星盤水彩星雲 | 283886040671793 | 採用上架 | 精密圓形抗鋸齒去背 + WebP Q85 | `services_b_astrology_v1.webp` |
| `服務-C` | 生命靈數 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 神聖幾何九芒星靈數水彩光芒 | 229167127995660 | 採用上架 | 去背 + 轉 WebP | `services_c_numerology_v1.webp` |
| `服務-D` | 八字命理 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 東方水墨水彩太極陰陽五行流轉 | 753048023136719 | 採用上架 | 去背 + 轉 WebP | `services_d_bazi_v1.webp` |
| `服務-E` | 靈氣調頻 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 雙手捧托七脈輪彩虹能量光暈 | 950154034724132 | 採用上架 | 去背 + 轉 WebP | `services_e_reiki_v1.webp` |
| `服務-F` | 阿卡西紀錄 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 靈魂生命之樹金葉星塵水彩 | 877470136253271 | 採用上架 | 去背 + 轉 WebP | `services_f_akashic_v1.webp` |
| `關於-A` | 品牌故事插圖 | 2026-09-30 | ComfyUI | 兩手編織星空光之網絡 | | 待生成 | 447×517 | `about_a_brand_story.png` |
| `關於-B` | 以恩 創辦人形象照 | 2026-09-30 | 業主實拍 | 創辦人個人頭像 | - | 待提供 | 正圓裁切 | `about_b_founder_yien.jpg` |
| `關於-C` | 皮皮 創辦人形象照 | 2026-09-30 | 業主實拍 | 創辦人個人頭像 | - | 待提供 | 正圓裁切 | `about_c_founder_pipi.jpg` |
| `關於-D` | 達心 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_d_member_daxin.jpg` |
| `關於-E` | 學長 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_e_member_xiaoyu.jpg` |
| `關於-F` | 悠悠 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_f_member_youyou.jpg` |
| `關於-G` | 姆姆 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_g_member_mumu.jpg` |
| `關於-H` | 凜月 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_h_member_linyue.jpg` |
| `關於-I` | 白白 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_i_member_baibai.jpg` |
| `關於-J` | Migo 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_j_member_migo.jpg` |
| `關於-K` | 古古 夥伴形象照 | 2026-09-30 | 業主實拍 | 夥伴個人頭像 | - | 待提供 | 正圓裁切 | `about_k_member_gugu.jpg` |
| `共用-A` | 內頁淺藍水彩底圖 | 2026-09-22 | ComfyUI | 淡天藍水彩暈染雲朵 | | 待生成 | 裁切調色 | `common_a_watercolor_bg_v1.png` |
| `頁尾-A` | Line ID 條碼 | 2026-09-22 | 實體擷圖 | 官方 LINE 條碼 | - | 採用 | 安全留白 | `footer_qr_line.png` |
| `頁尾-B` | Instagram 條碼 | 2026-09-22 | 實體擷圖 | 官方 IG 條碼 | - | 採用 | 安全留白 | `footer_qr_instagram.png` |
| `頁尾-C` | Line 社群 條碼 | 2026-09-22 | 實體擷圖 | 官方社群條碼 | - | 採用 | 安全留白 | `footer_qr_community.png` |
| `頁尾-D` | iOpen Mall 條碼 | 2026-09-22 | 實體擷圖 | 7-11 賣場條碼 | - | 採用 | 安全留白 | `footer_qr_iopenmall.png` |
| `專欄-A` | 光與阿卡西精選 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 生命之書天國光柱命運絲線水彩 | 6131051543551 | 採用上架 | 轉 WebP Q85 (保留背景) | `blog_a_akashic_light_v1.webp` |
| `專欄-B` | 初探阿卡西紀錄 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 靈魂藍圖神聖幾何星辰之門水彩 | 266276422365168 | 採用上架 | 轉 WebP Q85 (保留背景) | `blog_b_akashic_intro_v1.webp` |
| `專欄-C` | 靈氣與七脈輪 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 冥想人體光影七脈輪彩虹能量 | 423006888875148 | 採用上架 | 轉 WebP Q85 (保留背景) | `blog_c_reiki_chakras_v1.webp` |
| `專欄-D` | 日常能量急救包 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 雙手捧托翡翠綠粉金能量光晨光 | 965541644548421 | 採用上架 | 轉 WebP Q85 (保留背景) | `blog_d_reiki_healing_v1.webp` |
| `專欄-E` | 塔羅心靈之鏡 (v1) | 2026-09-30 | ComfyUI (Z-Image-Turbo) | 古典靈性鏡面倒映塔羅牌星盤 | 188810271202554 | 採用上架 | 轉 WebP Q85 (保留背景) | `blog_e_tarot_mirror_v1.webp` |

---

## 七、素材去背與 WebP 轉換標準作業流程（AI / 開發者 SOP）

為確保後續接手的 AI 或開發者不會誤將大容量未去背的 Raw PNG 提交進 Git 或錯誤掛載，請嚴格遵守以下標準處理程序：

### 1. 工具與環境需求

專案使用 Python 與 `rembg`、`onnxruntime` 及 `Pillow` 進行自動化去背與 WebP 壓縮：

```bash
pip install rembg onnxruntime pillow
```

### 2. 專案一鍵自動化腳本 (`scripts/process_asset.py`)

專案提供標準後製工具，自動執行：
1. **去背檢查**：若為純白底 RGB 圖，自動透過 U2Net 模型高精度去背轉為透明 RGBA；若已含透明通道則智慧跳過。
2. **WebP 最佳化**：統一以 `quality=85, method=6` 進行高品質兼小體積壓縮（每張控制在 50~150 KB 內）。
3. **自動雙重歸檔**：
   - 封存存檔 $\rightarrow$ `demo_docs/sd-assets/[檔名].webp`
   - 上架存檔 $\rightarrow$ `public/assets/[檔名].webp`
4. **自動解析生成履歷**：自動從 ComfyUI PNG 中讀取 Seed 與 Prompt，並印出可直接複製至「六、生成紀錄」的 Markdown 表格行。

#### 指令範例：

```bash
# 單張素材後製處理
python scripts/process_asset.py --input demo_docs/sd-assets/z-image-turbo_00014_.png --output services_a_tarot_v1.webp --code 服務-A --name "塔羅占卜 (v1)"

# 若外部已完成手工去背（跳過去背直接轉 WebP）：
python scripts/process_asset.py --input demo_docs/sd-assets/custom_image.png --output home_a_tarot_world_v3.webp --skip-rembg
```

### 3. Git 版控安全守則

- **禁止提交 Raw PNG**：未經壓縮的原始 PNG（通常 > 1MB）禁止進入 Git 版本庫，`.gitignore` 已設定 `demo_docs/sd-assets/*.png` 自動排除。
- **僅提交 WebP**：Git 僅追蹤 `*.webp` 檔案，確保 Repository 體積輕巧、頁面載入秒開。
- **前端引用規範**：Astro 頁面統一由 `/assets/[檔名].webp` 引用（對應 `public/assets/` 目錄）。
