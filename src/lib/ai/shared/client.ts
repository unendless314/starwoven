// ==========================================
// AI 互動功能 — 前端 API 呼叫與 GA 工具（demo_docs/ai_platform_plan.md 第四節第 4 小節）
// - 錯誤一律以 JSON error 代碼為準；body 無法解析或代碼未知時才依狀態碼降級
// - 前端逾時 → AI_FAILED（含重試鈕）；其他網路錯誤 → 通用錯誤（code: null）
// ⚠️ 前端模組：不得 import 任何伺服器模組。
// ==========================================
import { CLIENT_REQUEST_TIMEOUT_MS } from './config';
import { isErrorCode, type ErrorCode } from './errors';

export type ReadingResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'care' }
  | { kind: 'error'; code: ErrorCode | null };

/**
 * POST 至功能端點。isValid 為各功能之成功回應結構檢查；
 * ok: true 但結構不符者視同無法辨識之回應，依狀態碼降級。
 */
export async function postReading<T>(
  path: string,
  body: unknown,
  isValid: (data: Record<string, unknown>) => boolean,
): Promise<ReadingResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CLIENT_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // body 非 JSON（nginx 設定遺漏、本機無 nginx 等）→ 依狀態碼降級
    }
    if (json && typeof json === 'object') {
      const data = json as Record<string, unknown>;
      if (data.ok === true && data.care === true) return { kind: 'care' };
      if (data.ok === true && isValid(data)) return { kind: 'ok', data: data as unknown as T };
      if (data.ok === false && isErrorCode(data.error)) return { kind: 'error', code: data.error };
    }
    if (res.status === 413) return { kind: 'error', code: 'PAYLOAD_TOO_LARGE' };
    if (res.status === 429) return { kind: 'error', code: 'RATE_LIMITED' };
    return { kind: 'error', code: null };
  } catch {
    return { kind: 'error', code: controller.signal.aborted ? 'AI_FAILED' : null };
  } finally {
    window.clearTimeout(timer);
  }
}

/** GA4 事件（params 不得含問題內容） */
export function trackEvent(event: string, params: Record<string, unknown>): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', event, params);
}
