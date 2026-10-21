// ==========================================
// POST /api/tarot/reading — 全站唯一 on-demand 路由（DEC-073，規格書第四、五節）
// 流程：Origin／Content-Type／body 驗證 → 功能開關 → 自傷預檢 → 同步保留額度 → crypto 抽牌 → AI → 結構驗證
// 隱私：問題與解讀不寫入任何 log；log 只記時間、牌陣、結果代碼、耗時、是否命中上限。
// ==========================================
import type { APIRoute } from 'astro';
import { randomInt } from 'node:crypto';
import { generateReading } from '../../../lib/tarot/ai';
import { CARDS } from '../../../lib/tarot/cards';
import { ALLOWED_ORIGINS, DEV_ORIGIN, REQUEST_BODY_MAX_BYTES, REVERSALS_ENABLED } from '../../../lib/tarot/config';
import { READING_NOTICE, type ErrorCode } from '../../../lib/tarot/copy';
import { hashIp, isSelfHarmQuestion, normalizeQuestion, reserveQuota } from '../../../lib/tarot/guard';
import type { DrawnCard } from '../../../lib/tarot/prompt';
import { ProviderError } from '../../../lib/tarot/providers/types';
import { tarotServerConfig as cfg } from '../../../lib/tarot/server-config';
import { SPREADS, isSpreadId, type SpreadId } from '../../../lib/tarot/spreads';

export const prerender = false;

const STATUS: Record<ErrorCode, number> = {
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

const allowedOrigins = new Set<string>(import.meta.env.DEV ? [...ALLOWED_ORIGINS, DEV_ORIGIN] : ALLOWED_ORIGINS);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** 匿名統計 log（不含問題、解讀、IP） */
function log(started: number, spread: string, result: string, limitHit = false) {
  console.log(
    JSON.stringify({ t: new Date().toISOString(), spread, result, ms: Date.now() - started, limitHit }),
  );
}

/** Fisher–Yates（crypto.randomInt）洗牌後取前 N 張，同次不重複；正逆位各 50% */
function drawCards(spread: SpreadId): DrawnCard[] {
  const deck = CARDS.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return SPREADS[spread].positions.map((position, i) => ({
    position,
    card: deck[i],
    reversed: REVERSALS_ENABLED ? randomInt(2) === 1 : false,
  }));
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const started = Date.now();
  let spreadForLog = '-';
  const fail = (code: ErrorCode, limitHit = false) => {
    log(started, spreadForLog, code, limitHit);
    return json({ ok: false, error: code }, STATUS[code]);
  };

  // 1. Origin、Content-Type、body 上限
  if (!allowedOrigins.has(request.headers.get('origin') ?? '')) return fail('FORBIDDEN_ORIGIN');
  const contentType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return fail('INVALID_REQUEST');
  if (Number(request.headers.get('content-length') ?? 0) > REQUEST_BODY_MAX_BYTES) return fail('PAYLOAD_TOO_LARGE');

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail('INVALID_REQUEST');
  }
  if (Buffer.byteLength(raw, 'utf8') > REQUEST_BODY_MAX_BYTES) return fail('PAYLOAD_TOO_LARGE');

  // 2. 請求格式
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail('INVALID_REQUEST');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('INVALID_REQUEST');
  const { spread, question: rawQuestion } = body as Record<string, unknown>;
  if (!isSpreadId(spread)) return fail('INVALID_REQUEST');
  spreadForLog = spread;
  const question = normalizeQuestion(rawQuestion);
  if (question === null) return fail('INVALID_REQUEST');

  // 3. 功能開關（含金鑰缺少）
  if (!cfg.enabled) return fail('DISABLED');

  // 4. 自傷預檢：不抽牌、不呼叫 AI、不消耗額度
  if (isSelfHarmQuestion(question)) {
    log(started, spread, 'CARE');
    return json({ ok: true, care: true });
  }

  // 5. 同步保留額度（此段與上方檢查之間無 await 影響計數；reserveQuota 本身為同步）
  const ip = request.headers.get('x-real-ip') || clientAddress || 'unknown';
  const reservation = reserveQuota(hashIp(ip));
  if (!reservation) return fail('DAILY_LIMIT', true);

  // 6. 抽牌 → AI
  const drawn = drawCards(spread);
  try {
    const reading = await generateReading(SPREADS[spread].name, drawn, question);
    log(started, spread, 'OK');
    return json({
      ok: true,
      spread,
      cards: drawn.map((d) => ({ position: d.position, id: d.card.id, name: d.card.nameZh, reversed: d.reversed })),
      reading,
      notice: READING_NOTICE,
    });
  } catch (err) {
    const providerError = err instanceof ProviderError ? err : new ProviderError('failed', `unexpected ${(err as Error)?.name ?? 'error'}`);
    // 原始錯誤訊息只寫伺服器 log（不含請求內容）
    console.error(`[tarot] provider error (${providerError.kind}): ${providerError.message}`);
    if (providerError.kind === 'rate_limited') {
      reservation.releaseAll();
      return fail('AI_BUSY');
    }
    reservation.releaseIp();
    return fail('AI_FAILED');
  }
};

// 其他方法一律 405（不屬於 API 合約，前端不會遇到）
export const ALL: APIRoute = () => json({ ok: false, error: 'INVALID_REQUEST' }, 405);
