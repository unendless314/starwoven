// ==========================================
// AI 呼叫入口：對外只暴露 generateReading()
// 依 TAROT_AI_PROVIDER 選擇轉接器，負責 JSON 擷取與結構驗證；失敗一律拋出 ProviderError。
// ⚠️ 伺服器專用：僅被 API 路由 import。
// ==========================================
import { AI_MAX_OUTPUT_TOKENS, AI_TEMPERATURE, READING_LENGTH, SERVER_AI_TIMEOUT_MS } from './config';
import { SYSTEM_PROMPT, buildUserMessage, type DrawnCard } from './prompt';
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

/** 擷取文字中第一個完整（括號平衡）的 JSON 物件；考慮字串內的括號與跳脫字元 */
export function extractFirstJsonObject(text: string): unknown {
  let start = text.indexOf('{');
  while (start !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          break; // 平衡但無法解析 → 從下一個 { 再試
        }
      }
    }
    start = text.indexOf('{', start + 1);
  }
  return null;
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
    const reading = validateReading(extractFirstJsonObject(text), drawn.length);
    if (!reading) throw new ProviderError('failed', 'reading failed structure validation');
    return reading;
  } finally {
    clearTimeout(timer);
  }
}
