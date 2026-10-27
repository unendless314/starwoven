// ==========================================
// AI 互動功能 — 共用程式常數（B 層，demo_docs/ai_platform_plan.md 第三節第 2 小節）
// 所有 AI 功能必須一致的值集中於此；各功能專屬常數見 src/lib/<feature>/config.ts。
// ⚠️ 前後端共用、會被打包進前端：只能放可公開的值，
//    不得 import astro:env/server、src/lib/ai/server/ 或任何伺服器模組。
// ==========================================

/** 請求 body 上限（bytes）。↔ nginx/starwoven.conf 每個 AI location 之 `client_max_body_size 2k` 須一致 */
export const REQUEST_BODY_MAX_BYTES = 2048;

/** 後端呼叫 AI 逾時。須 < CLIENT_REQUEST_TIMEOUT_MS < nginx `proxy_read_timeout 35s` */
export const SERVER_AI_TIMEOUT_MS = 25_000;

/** 前端請求逾時。須 > SERVER_AI_TIMEOUT_MS，且 < nginx `proxy_read_timeout 35s` */
export const CLIENT_REQUEST_TIMEOUT_MS = 30_000;

/** 每日上限重置所依據的時區（台灣時間 00:00），全部功能同一時區 */
export const TIMEZONE = 'Asia/Taipei';

/** 端點允許之 Origin（本機開發另允許 DEV_ORIGIN，僅 dev 模式生效） */
export const ALLOWED_ORIGINS = ['https://starwoven.xyz', 'https://www.starwoven.xyz'] as const;
export const DEV_ORIGIN = 'http://localhost:4321';

// 跨常數大小關係斷言：違反即建置／啟動失敗（規格書第三節第 2 小節）
if (CLIENT_REQUEST_TIMEOUT_MS <= SERVER_AI_TIMEOUT_MS) {
  throw new Error('[ai/config] CLIENT_REQUEST_TIMEOUT_MS must be greater than SERVER_AI_TIMEOUT_MS');
}

/**
 * 各功能 config.ts 於模組層呼叫：AI_TEMPERATURE 須在 MiniMax OpenAI 相容端點合法範圍 (0, 1]。
 * 範圍只定義在此一處，功能層不得自行內嵌範圍判斷。
 */
export function assertAiTemperature(value: number, feature: string): void {
  if (!(value > 0 && value <= 1)) {
    throw new Error(`[${feature}/config] AI_TEMPERATURE must be in (0, 1]`);
  }
}
