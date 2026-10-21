// ==========================================
// AI 供應商轉接器介面（規格書第五節第 3 小節（3））
// 新增供應商：實作 ChatProvider 並登錄於 ai.ts 即可。
// ==========================================

export interface ChatRequest {
  system: string;
  user: string;
  maxOutputTokens: number;
  temperature: number;
  /** 逾時控制 */
  signal: AbortSignal;
}

export interface ChatProvider {
  /** 只回傳最終文字；推理內容一律丟棄 */
  complete(req: ChatRequest): Promise<{ text: string }>;
}

/**
 * 統一錯誤型別：供應商 HTTP 429 → rate_limited（端點回 AI_BUSY），
 * 其餘（4xx／5xx、逾時、網路錯誤、空回應、結構驗證失敗）→ failed（端點回 AI_FAILED）。
 * message 只寫入伺服器 log，不得含請求內容、不回傳前端。
 */
export class ProviderError extends Error {
  constructor(
    public readonly kind: 'rate_limited' | 'failed',
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
