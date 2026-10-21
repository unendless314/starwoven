// ==========================================
// OpenAI 相容 Chat Completions 轉接器（MiniMax 使用；日後 OpenAI 亦可共用）
// 不安裝供應商 SDK，以內建 fetch 實作；逾時由呼叫端傳入之 AbortSignal 控制。
// ==========================================
import { ProviderError, type ChatProvider, type ChatRequest } from './types';

interface Options {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** null → 不送出 reasoning_effort */
  reasoningEffort: string | null;
}

const RATE_LIMIT_STATUS_CODES = new Set([1002, 1008, 1039]);

/** 剝除所有 <think>…</think> 區塊（M3 系列將推理內容夾在 content 開頭）；未閉合者剝除至結尾 */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/i, '').trim();
}

export function createOpenAICompatibleProvider(opts: Options): ChatProvider {
  return {
    async complete(req: ChatRequest) {
      const body: Record<string, unknown> = {
        model: opts.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: req.temperature,
        max_tokens: req.maxOutputTokens,
      };
      if (opts.reasoningEffort) body.reasoning_effort = opts.reasoningEffort;

      let res: Response;
      try {
        res = await fetch(`${opts.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: req.signal,
        });
      } catch (err) {
        const reason = req.signal.aborted ? 'timeout' : `network error: ${(err as Error).name}`;
        throw new ProviderError('failed', reason);
      }

      if (res.status === 429) throw new ProviderError('rate_limited', 'provider HTTP 429');
      if (!res.ok) throw new ProviderError('failed', `provider HTTP ${res.status}`);

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new ProviderError('failed', req.signal.aborted ? 'timeout' : 'provider returned non-JSON');
      }

      // MiniMax 可能於 HTTP 200 內以 base_resp 回報業務錯誤：
      // 1002（RPM 限流）、1008（餘額不足）、1039（TPM 限流）視同供應商拒絕 → rate_limited，其餘 → failed
      const statusCode = (data as { base_resp?: { status_code?: unknown } })?.base_resp?.status_code;
      if (typeof statusCode === 'number' && statusCode !== 0) {
        const kind = RATE_LIMIT_STATUS_CODES.has(statusCode) ? 'rate_limited' : 'failed';
        throw new ProviderError(kind, `provider base_resp status ${statusCode}`);
      }

      // 只取 content；reasoning_content 等推理欄位一律丟棄
      const content = (data as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new ProviderError('failed', 'provider returned empty content');

      const text = stripThinking(content);
      if (!text) throw new ProviderError('failed', 'provider returned empty content');
      return { text };
    },
  };
}
