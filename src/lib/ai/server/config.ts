// ==========================================
// AI 共用伺服器設定（唯一讀取共用 AI_* 環境變數之模組，demo_docs/ai_platform_plan.md 第三節第 4 小節）
// 各功能之開關與上限由該功能 server-config.ts 讀取；其他模組不得各自讀取 astro:env/server 或 process.env。
// ⚠️ 伺服器專用：僅可被 API 路由及 src/lib/ai/server/、各功能伺服器專用模組 import。
// ==========================================
import {
  AI_PROVIDER,
  AI_BASE_URL,
  AI_MODEL,
  AI_API_KEY,
  AI_REASONING_EFFORT,
} from 'astro:env/server';

const apiKey = (AI_API_KEY ?? '').trim();

if (!apiKey) {
  // 部署腳本與驗收（規格書第八節第 3 小節）須確認此 log 不存在
  console.error('AI_API_KEY missing; AI features disabled');
}

export const aiServerConfig = {
  provider: AI_PROVIDER,
  baseUrl: AI_BASE_URL.replace(/\/+$/, ''),
  model: AI_MODEL,
  apiKey,
  /** null ＝ 不送出 reasoning_effort（哨兵值 none） */
  reasoningEffort: AI_REASONING_EFFORT === 'none' ? null : AI_REASONING_EFFORT,
  /** 金鑰非空；缺少時全部 AI 功能停用 */
  keyPresent: apiKey !== '',
} as const;
