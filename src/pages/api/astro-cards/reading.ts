// ==========================================
// POST /api/astro-cards/reading（DEC-080；共用慣例見 demo_docs/ai_platform_plan.md 第四節第 1 小節）
// 流程：共用請求檢查 → spread／問題驗證 → 功能開關 → 自傷預檢 → 同步保留額度 → crypto 抽牌 → AI → 結構驗證
// 隱私：問題、解讀與抽到的牌不寫入任何 log；log 只記時間、功能、spread、結果代碼、耗時、是否命中上限。
// ==========================================
import type { APIRoute } from 'astro';
import { randomInt } from 'node:crypto';
import { isSelfHarmQuestion, normalizeQuestion } from '../../../lib/ai/server/guard';
import { callWithReservation, errorResponse, jsonResponse, logResult, readJsonRequest } from '../../../lib/ai/server/http';
import { createDailyQuota, hashIp } from '../../../lib/ai/server/quota';
import type { ErrorCode } from '../../../lib/ai/shared/errors';
import { generateReading } from '../../../lib/astro-cards/ai';
import { DECK_ORDER, QUESTION_MAX_CHARS, SPREAD_ID } from '../../../lib/astro-cards/config';
import { READING_NOTICE } from '../../../lib/astro-cards/copy';
import { DECKS } from '../../../lib/astro-cards/decks';
import type { DrawnCard } from '../../../lib/astro-cards/prompt';
import { astroCardsServerConfig as cfg } from '../../../lib/astro-cards/server-config';

export const prerender = false;

const FEATURE = 'astro-cards';

/** 占星抽卡專屬之每日額度（與其他 AI 功能分開計算） */
const quota = createDailyQuota({ dailyLimit: cfg.dailyLimit, ipDailyLimit: cfg.ipDailyLimit });

/** 三疊牌各自以 crypto.randomInt 獨立抽一張（無正逆位） */
function drawCards(): DrawnCard[] {
  return DECK_ORDER.map((deck) => ({ deck, card: DECKS[deck][randomInt(DECKS[deck].length)] }));
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
  if (spread !== SPREAD_ID) return fail('INVALID_REQUEST');
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

  // 5. 同步保留額度（reserve 本身為同步）
  const ip = request.headers.get('x-real-ip') || clientAddress || 'unknown';
  const reservation = quota.reserve(hashIp(ip));
  if (!reservation) return fail('DAILY_LIMIT', true);

  // 6. 抽牌 → AI（失敗時依錯誤類型釋放額度）
  const drawn = drawCards();
  const result = await callWithReservation(FEATURE, reservation, () => generateReading(drawn, question));
  if (!result.ok) return fail(result.code);

  log('OK');
  return jsonResponse({
    ok: true,
    spread: SPREAD_ID,
    cards: drawn.map((d) => ({ deck: d.deck, id: d.card.id, name: d.card.nameZh })),
    reading: result.value,
    notice: READING_NOTICE,
  });
};

// 其他方法一律 405（不屬於 API 合約，前端不會遇到）
export const ALL: APIRoute = () => jsonResponse({ ok: false, error: 'INVALID_REQUEST' }, 405);
