// ==========================================
// 端點共用 HTTP 工具（demo_docs/ai_platform_plan.md 第四節第 1 小節、第六節第 2 小節、第七節）
// - readJsonRequest：Origin → Content-Type → body 上限 → JSON 物件
// - jsonResponse／errorResponse：統一 Content-Type 與 Cache-Control
// - logResult：匿名統計 log（不含問題、解讀、IP）
// - callWithReservation：呼叫 AI 並依錯誤類型釋放額度（釋放規則只在此處）
// ⚠️ 伺服器專用。
// ==========================================
import { ALLOWED_ORIGINS, DEV_ORIGIN, REQUEST_BODY_MAX_BYTES } from '../shared/config';
import { ERROR_STATUS, type ErrorCode } from '../shared/errors';
import { ProviderError } from './providers/types';
import type { Reservation } from './quota';

const allowedOrigins = new Set<string>(import.meta.env.DEV ? [...ALLOWED_ORIGINS, DEV_ORIGIN] : ALLOWED_ORIGINS);

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function errorResponse(code: ErrorCode): Response {
  return jsonResponse({ ok: false, error: code }, ERROR_STATUS[code]);
}

/**
 * 匿名統計 log（單行 JSON）。fields 為功能代碼欄位（塔羅：{ spread }），
 * 不得放入問題、解讀或 IP。
 */
export function logResult(
  feature: string,
  started: number,
  fields: Record<string, string>,
  result: string,
  limitHit = false,
): void {
  console.log(
    JSON.stringify({ t: new Date().toISOString(), feature, ...fields, result, ms: Date.now() - started, limitHit }),
  );
}

/** 共用請求檢查；通過時回傳 JSON 物件，欄位驗證由各功能端點負責（未知欄位一律忽略） */
export async function readJsonRequest(
  request: Request,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; code: ErrorCode }> {
  if (!allowedOrigins.has(request.headers.get('origin') ?? '')) return { ok: false, code: 'FORBIDDEN_ORIGIN' };
  const contentType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return { ok: false, code: 'INVALID_REQUEST' };
  if (Number(request.headers.get('content-length') ?? 0) > REQUEST_BODY_MAX_BYTES) {
    return { ok: false, code: 'PAYLOAD_TOO_LARGE' };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, code: 'INVALID_REQUEST' };
  }
  if (Buffer.byteLength(raw, 'utf8') > REQUEST_BODY_MAX_BYTES) return { ok: false, code: 'PAYLOAD_TOO_LARGE' };

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, code: 'INVALID_REQUEST' };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, code: 'INVALID_REQUEST' };
  return { ok: true, body: body as Record<string, unknown> };
}

/**
 * 呼叫 AI 並依錯誤類型釋放已保留之額度（規格書第六節第 2 小節）：
 * - rate_limited（供應商拒絕）→ 全站與 IP 皆釋放 → AI_BUSY
 * - 其餘（逾時、供應商錯誤、結構驗證失敗等）→ 只釋放 IP → AI_FAILED
 * 各功能端點不得自行呼叫釋放函式。
 */
export async function callWithReservation<T>(
  feature: string,
  reservation: Reservation,
  fn: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; code: 'AI_FAILED' | 'AI_BUSY' }> {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    const providerError = err instanceof ProviderError ? err : new ProviderError('failed', `unexpected ${(err as Error)?.name ?? 'error'}`);
    // 原始錯誤訊息只寫伺服器 log（不含請求內容）
    console.error(`[${feature}] provider error (${providerError.kind}): ${providerError.message}`);
    if (providerError.kind === 'rate_limited') {
      reservation.releaseAll();
      return { ok: false, code: 'AI_BUSY' };
    }
    reservation.releaseIp();
    return { ok: false, code: 'AI_FAILED' };
  }
}
