// ==========================================
// POST /api/tarot/reading（DEC-073；共用慣例見 demo_docs/ai_platform_plan.md 第四節第 1 小節）
// 流程：共用請求檢查 → 牌陣／問題驗證 → 功能開關 → 自傷預檢 → 同步保留額度 → crypto 抽牌 → AI → 結構驗證
// 隱私：問題與解讀不寫入任何 log；log 只記時間、功能、牌陣、結果代碼、耗時、是否命中上限。
// ==========================================
import type { APIRoute } from 'astro';
import { randomInt } from 'node:crypto';
import { isSelfHarmQuestion, normalizeQuestion } from '../../../lib/ai/server/guard';
import { callWithReservation, errorResponse, jsonResponse, logResult, readJsonRequest } from '../../../lib/ai/server/http';
import { createDailyQuota, hashIp } from '../../../lib/ai/server/quota';
import type { ErrorCode } from '../../../lib/ai/shared/errors';
import { generateReading } from '../../../lib/tarot/ai';
import { CARDS } from '../../../lib/tarot/cards';
import { QUESTION_MAX_CHARS, REVERSALS_ENABLED } from '../../../lib/tarot/config';
import { READING_NOTICE } from '../../../lib/tarot/copy';
import type { DrawnCard } from '../../../lib/tarot/prompt';
import { tarotServerConfig as cfg } from '../../../lib/tarot/server-config';
import { SPREADS, isSpreadId, type SpreadId } from '../../../lib/tarot/spreads';

export const prerender = false;

const FEATURE = 'tarot';

/** 塔羅專屬之每日額度（與其他 AI 功能分開計算） */
const quota = createDailyQuota({ dailyLimit: cfg.dailyLimit, ipDailyLimit: cfg.ipDailyLimit });

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
  const log = (result: string, limitHit = false) => logResult(FEATURE, started, { spread: spreadForLog }, result, limitHit);
  const fail = (code: ErrorCode, limitHit = false) => {
    log(code, limitHit);
    return errorResponse(code);
  };

  // 1. Origin、Content-Type、body 上限、JSON 物件
  const req = await readJsonRequest(request);
  if (!req.ok) return fail(req.code);

  // 2. 功能欄位驗證（未知欄位忽略）
  const { spread, question: rawQuestion } = req.body;
  if (!isSpreadId(spread)) return fail('INVALID_REQUEST');
  spreadForLog = spread;
  const question = normalizeQuestion(rawQuestion, QUESTION_MAX_CHARS);
  if (question === null) return fail('INVALID_REQUEST');

  // 3. 功能開關（含金鑰缺少）
  if (!cfg.enabled) return fail('DISABLED');

  // 4. 自傷預檢：不抽牌、不呼叫 AI、不消耗額度
  if (isSelfHarmQuestion(question)) {
    log('CARE');
    return jsonResponse({ ok: true, care: true });
  }

  // 5. 同步保留額度（此段與上方檢查之間無 await 影響計數；reserve 本身為同步）
  const ip = request.headers.get('x-real-ip') || clientAddress || 'unknown';
  const reservation = quota.reserve(hashIp(ip));
  if (!reservation) return fail('DAILY_LIMIT', true);

  // 6. 抽牌 → AI（失敗時依錯誤類型釋放額度）
  const drawn = drawCards(spread);
  const result = await callWithReservation(FEATURE, reservation, () =>
    generateReading(SPREADS[spread].name, drawn, question),
  );
  if (!result.ok) return fail(result.code);

  log('OK');
  return jsonResponse({
    ok: true,
    spread,
    cards: drawn.map((d) => ({ position: d.position, id: d.card.id, name: d.card.nameZh, reversed: d.reversed })),
    reading: result.value,
    notice: READING_NOTICE,
  });
};

// 其他方法一律 405（不屬於 API 合約，前端不會遇到）
export const ALL: APIRoute = () => jsonResponse({ ok: false, error: 'INVALID_REQUEST' }, 405);
