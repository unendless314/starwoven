// ==========================================
// AI 互動功能 — 錯誤碼總表（demo_docs/ai_platform_plan.md 第四節第 2 小節）
// 新增錯誤碼須同步規格書、本檔與每個功能之 copy.ts（ERROR_MESSAGES 以 Record<ErrorCode, …> 強制補齊）。
// ⚠️ 前後端共用：只能放可公開的值。
// ==========================================

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'FORBIDDEN_ORIGIN'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'DAILY_LIMIT'
  | 'DISABLED'
  | 'AI_FAILED'
  | 'SERVICE_DOWN'
  | 'GATEWAY_TIMEOUT'
  | 'AI_BUSY';

/** 錯誤碼 → HTTP 狀態（RATE_LIMITED、SERVICE_DOWN、GATEWAY_TIMEOUT 由 nginx 產生，列出以求完整） */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  FORBIDDEN_ORIGIN: 403,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  DAILY_LIMIT: 429,
  DISABLED: 503,
  AI_FAILED: 502,
  SERVICE_DOWN: 502,
  GATEWAY_TIMEOUT: 504,
  AI_BUSY: 503,
};

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ERROR_STATUS, value);
}
