// ==========================================
// 占星抽卡 AI 解讀：對外只暴露 generateReading()
// 以共用 generateText() 呼叫 AI，負責解析具名標記輸出與結構驗證；失敗一律拋出 ProviderError。
// ⚠️ 伺服器專用：僅被 API 路由 import。
// ==========================================
import { generateText } from '../ai/server/generate';
import { ProviderError } from '../ai/server/providers/types';
import { extractTagged, isNonEmptyString, truncateChars } from '../ai/server/tagged';
import { AI_MAX_OUTPUT_TOKENS, AI_TEMPERATURE, DECK_ORDER, READING_LENGTH } from './config';
import { OUTPUT_TAGS, SYSTEM_PROMPT, buildUserMessage, type DrawnCard } from './prompt';

export interface Reading {
  /** 依 DECK_ORDER（行星 → 星座 → 宮位） */
  cards: string[];
  summary: string;
  advice: string;
}

/**
 * 解析具名標記輸出並驗證結構（規格書第五節第 3 小節）：五種標記各須恰好 1 個且非空，
 * 重複或缺少皆不合格（較塔羅之「取第一個」嚴格，刻意）；超長截斷。不合格回傳 null。
 */
export function parseReading(text: string): Reading | null {
  const one = (tag: string): string | null => {
    const found = extractTagged(text, tag);
    return found.length === 1 && isNonEmptyString(found[0]) ? found[0] : null;
  };
  const cards = DECK_ORDER.map((deck) => one(OUTPUT_TAGS[deck]));
  const summary = one(OUTPUT_TAGS.summary);
  const advice = one(OUTPUT_TAGS.advice);
  if (cards.some((c) => c === null) || summary === null || advice === null) return null;

  const limit = (max: number) => Math.round(max * READING_LENGTH.truncateSlack);
  return {
    cards: (cards as string[]).map((c) => truncateChars(c, limit(READING_LENGTH.cardMax))),
    summary: truncateChars(summary, limit(READING_LENGTH.summaryMax)),
    advice: truncateChars(advice, limit(READING_LENGTH.adviceMax)),
  };
}

export async function generateReading(drawn: DrawnCard[], question: string): Promise<Reading> {
  const text = await generateText({
    system: SYSTEM_PROMPT,
    user: buildUserMessage(drawn, question),
    maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
    temperature: AI_TEMPERATURE,
  });
  const reading = parseReading(text);
  if (!reading) throw new ProviderError('failed', 'reading failed structure validation');
  return reading;
}
