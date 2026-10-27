// ==========================================
// 塔羅 AI 解讀：對外只暴露 generateReading()
// 以共用 generateText() 呼叫 AI，負責解析標記式輸出與結構驗證；失敗一律拋出 ProviderError。
// ⚠️ 伺服器專用：僅被 API 路由 import。
// ==========================================
import { generateText } from '../ai/server/generate';
import { ProviderError } from '../ai/server/providers/types';
import { extractTagged, isNonEmptyString, truncateChars } from '../ai/server/tagged';
import { AI_MAX_OUTPUT_TOKENS, AI_TEMPERATURE, READING_LENGTH } from './config';
import { OUTPUT_TAGS, SYSTEM_PROMPT, buildUserMessage, type DrawnCard } from './prompt';

export interface Reading {
  cards: string[];
  summary: string;
  advice: string;
}

/**
 * 解析標記式輸出（OUTPUT_TAGS：card×N、summary、advice）。
 * 同名標記重複時 summary／advice 取第一個；缺少的欄位留空，交由 validateReading 判定。
 */
export function parseTaggedReading(text: string): { cards: string[]; summary?: string; advice?: string } {
  return {
    cards: extractTagged(text, OUTPUT_TAGS.card),
    summary: extractTagged(text, OUTPUT_TAGS.summary)[0],
    advice: extractTagged(text, OUTPUT_TAGS.advice)[0],
  };
}

/** 結構驗證：欄位存在、型別正確、cards 長度＝牌數；超長截斷。不合格回傳 null */
export function validateReading(raw: unknown, cardCount: number): Reading | null {
  if (!raw || typeof raw !== 'object') return null;
  const { cards, summary, advice } = raw as Record<string, unknown>;
  if (!Array.isArray(cards) || cards.length !== cardCount || !cards.every(isNonEmptyString)) return null;
  if (!isNonEmptyString(summary) || !isNonEmptyString(advice)) return null;

  const limit = (max: number) => Math.round(max * READING_LENGTH.truncateSlack);
  return {
    cards: cards.map((c) => truncateChars(c, limit(READING_LENGTH.cardMax))),
    summary: truncateChars(summary, limit(READING_LENGTH.summaryMax)),
    advice: truncateChars(advice, limit(READING_LENGTH.adviceMax)),
  };
}

export async function generateReading(spreadName: string, drawn: DrawnCard[], question: string): Promise<Reading> {
  const text = await generateText({
    system: SYSTEM_PROMPT,
    user: buildUserMessage(spreadName, drawn, question),
    maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
    temperature: AI_TEMPERATURE,
  });
  const reading = validateReading(parseTaggedReading(text), drawn.length);
  if (!reading) throw new ProviderError('failed', 'reading failed structure validation');
  return reading;
}
