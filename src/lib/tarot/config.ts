// ==========================================
// 線上塔羅抽卡 — 唯一程式常數檔（B 層，規格書第三節第 3 小節（2））
// ⚠️ 前後端共用、會被打包進前端：只能放可公開的值，
//    不得 import astro:env/server 或任何伺服器模組。
// 營運上可能調整的值（開關、每日上限、模型等）屬 A 層環境變數，見 astro.config.mjs env.schema。
// ==========================================

/** 問題字數上限（Unicode 字元計）；前端 maxlength／字數提示與後端驗證共用 */
export const QUESTION_MAX_CHARS = 120;

/** 請求 body 上限（bytes）。↔ nginx/starwoven.conf `client_max_body_size 2k` 須一致 */
export const REQUEST_BODY_MAX_BYTES = 2048;

/** 後端呼叫 AI 逾時。須 < CLIENT_REQUEST_TIMEOUT_MS < nginx `proxy_read_timeout 35s` */
export const SERVER_AI_TIMEOUT_MS = 25_000;

/** 前端請求逾時。須 > SERVER_AI_TIMEOUT_MS，且 < nginx `proxy_read_timeout 35s` */
export const CLIENT_REQUEST_TIMEOUT_MS = 30_000;

/** 是否抽出逆位（業主決定不用逆位時改為 false） */
export const REVERSALS_ENABLED = true;

/** MiniMax OpenAI 相容端點合法範圍 (0, 1] */
export const AI_TEMPERATURE = 0.8;

/** 須容納推理＋解讀輸出；依 2026-10-20 實測（Flash 約 380、M3 約 950）取足夠餘裕 */
export const AI_MAX_OUTPUT_TOKENS = 2000;

/** 解讀長度：提示詞文字與結構驗證截斷引用同一組數值 */
export const READING_LENGTH = {
  cardMin: 80,
  cardMax: 150,
  summaryMin: 100,
  summaryMax: 200,
  adviceMax: 40,
  /** 結構驗證截斷倍率：模型字數計算不精確，上限 × 此倍率才截斷，避免正常輸出被硬切 */
  truncateSlack: 1.5,
} as const;

/** 每日上限重置所依據的時區（台灣時間 00:00） */
export const TIMEZONE = 'Asia/Taipei';

/** 端點允許之 Origin（本機開發另允許 DEV_ORIGIN，僅 dev 模式生效） */
export const ALLOWED_ORIGINS = ['https://starwoven.xyz', 'https://www.starwoven.xyz'] as const;
export const DEV_ORIGIN = 'http://localhost:4321';

/** 前端扇形牌堆張數（儀式性選牌，不決定實際牌面） */
export const FAN_CARD_COUNT = 13;

/** API 路徑（前端呼叫端點） */
export const READING_API_PATH = '/api/tarot/reading';

// 跨常數大小關係斷言：違反即建置／啟動失敗（規格書第三節第 3 小節（4））
if (CLIENT_REQUEST_TIMEOUT_MS <= SERVER_AI_TIMEOUT_MS) {
  throw new Error('[tarot/config] CLIENT_REQUEST_TIMEOUT_MS must be greater than SERVER_AI_TIMEOUT_MS');
}
if (REQUEST_BODY_MAX_BYTES < QUESTION_MAX_CHARS * 4 + 256) {
  throw new Error('[tarot/config] REQUEST_BODY_MAX_BYTES too small for QUESTION_MAX_CHARS');
}
if (!(AI_TEMPERATURE > 0 && AI_TEMPERATURE <= 1)) {
  throw new Error('[tarot/config] AI_TEMPERATURE must be in (0, 1]');
}
