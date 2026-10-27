// ==========================================
// AI 呼叫入口：generateText()（demo_docs/ai_platform_plan.md 第五節第 3 小節）
// 依 AI_PROVIDER 選擇並快取轉接器、以 SERVER_AI_TIMEOUT_MS 控制逾時，回傳剝除推理後之純文字；
// 失敗一律拋出 ProviderError。提示詞、解析與結構驗證由各功能 ai.ts 負責。
// ⚠️ 伺服器專用。
// ==========================================
import { SERVER_AI_TIMEOUT_MS } from '../shared/config';
import { aiServerConfig as cfg } from './config';
import { createOpenAICompatibleProvider } from './providers/openai-compatible';
import { ProviderError, type ChatProvider } from './providers/types';

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

export async function generateText(req: {
  system: string;
  user: string;
  maxOutputTokens: number;
  temperature: number;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_AI_TIMEOUT_MS);
  try {
    const { text } = await getProvider().complete({ ...req, signal: controller.signal });
    return text;
  } finally {
    clearTimeout(timer);
  }
}
