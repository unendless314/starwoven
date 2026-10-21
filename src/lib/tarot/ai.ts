// ==========================================
// AI 呼叫入口：對外只暴露 generateReading()
// 依 TAROT_AI_PROVIDER 選擇轉接器，負責解析標記式輸出與結構驗證；失敗一律拋出 ProviderError。
// ⚠️ 伺服器專用：僅被 API 路由 import。
// ==========================================
import { AI_MAX_OUTPUT_TOKENS, AI_TEMPERATURE, READING_LENGTH, SERVER_AI_TIMEOUT_MS } from './config';
import { OUTPUT_TAGS, SYSTEM_PROMPT, buildUserMessage, type DrawnCard } from './prompt';
import { createOpenAICompatibleProvider } from './providers/openai-compatible';
import { ProviderError, type ChatProvider } from './providers/types';
import { tarotServerConfig as cfg } from './server-config';

export interface Reading {
  cards: string[];
  summary: string;
  advice: string;
}

let provider: ChatProvider | null = null;

function getProvider(): ChatProvider {
  if (provider) return provider;
  switch (cfg.provider) {
    case 'openai-compatible':
      provider = createOpenAICompatibleProvider({
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        model: cfg.model,
        reasoningEffort: cfg.reasoningEffort,
      });
      return provider;
    default:
      throw new ProviderError('failed', `unknown provider: ${String(cfg.provider)}`);
  }
}

/**
 * 解析標記式輸出（OUTPUT_TAGS：card×N、summary、advice）。
 * 不採 JSON：實測 M3.1-Flash／M3 常把 summary 結尾誤寫成 `"]`／`"}`，使 JSON 失效（DEC-074）。
 * 同名標記重複時 summary／advice 取第一個；缺少的欄位留空，交由 validateReading 判定。
 */
export function parseTaggedReading(text: string): { cards: string[]; summary?: string; advice?: string } {
  const all = (tag: string) =>
    Array.from(text.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi')), (m) => m[1].trim());
  return { cards: all(OUTPUT_TAGS.card), summary: all(OUTPUT_TAGS.summary)[0], advice: all(OUTPUT_TAGS.advice)[0] };
}

/** 依 Unicode 字元截斷（不切斷代理對） */
function truncate(text: string, max: number): string {
  const chars = Array.from(text.trim());
  return chars.length > max ? chars.slice(0, max).join('') : chars.join('');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** 結構驗證：欄位存在、型別正確、cards 長度＝牌數；超長截斷。不合格回傳 null */
export function validateReading(raw: unknown, cardCount: number): Reading | null {
  if (!raw || typeof raw !== 'object') return null;
  const { cards, summary, advice } = raw as Record<string, unknown>;
  if (!Array.isArray(cards) || cards.length !== cardCount || !cards.every(isNonEmptyString)) return null;
  if (!isNonEmptyString(summary) || !isNonEmptyString(advice)) return null;

  const limit = (max: number) => Math.round(max * READING_LENGTH.truncateSlack);
  return {
    cards: cards.map((c) => truncate(c, limit(READING_LENGTH.cardMax))),
    summary: truncate(summary, limit(READING_LENGTH.summaryMax)),
    advice: truncate(advice, limit(READING_LENGTH.adviceMax)),
  };
}

export async function generateReading(spreadName: string, drawn: DrawnCard[], question: string): Promise<Reading> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_AI_TIMEOUT_MS);
  try {
    const { text } = await getProvider().complete({
      system: SYSTEM_PROMPT,
      user: buildUserMessage(spreadName, drawn, question),
      maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
      temperature: AI_TEMPERATURE,
      signal: controller.signal,
    });
    const reading = validateReading(parseTaggedReading(text), drawn.length);
    if (!reading) throw new ProviderError('failed', 'reading failed structure validation');
    return reading;
  } finally {
    clearTimeout(timer);
  }
}
