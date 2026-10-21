// ==========================================
// 伺服器端設定（唯一讀取 astro:env/server 之模組）
// 其他後端模組只 import tarotServerConfig，不得各自讀取環境變數或 process.env。
// ⚠️ 僅可被 API 路由（及其伺服器模組）import；不得被前端 import。
// ==========================================
import {
  TAROT_ENABLED,
  TAROT_AI_PROVIDER,
  TAROT_AI_BASE_URL,
  TAROT_AI_MODEL,
  TAROT_AI_API_KEY,
  TAROT_AI_REASONING_EFFORT,
  TAROT_DAILY_LIMIT,
  TAROT_IP_DAILY_LIMIT,
} from 'astro:env/server';

const apiKey = (TAROT_AI_API_KEY ?? '').trim();

if (!apiKey) {
  // 部署驗收（規格書第九節第 8 項）須確認此 log 不存在
  console.error('TAROT_AI_API_KEY missing; tarot disabled');
}

export const tarotServerConfig = {
  /** 功能開關且金鑰非空才啟用 */
  enabled: TAROT_ENABLED && apiKey !== '',
  provider: TAROT_AI_PROVIDER,
  baseUrl: TAROT_AI_BASE_URL.replace(/\/+$/, ''),
  model: TAROT_AI_MODEL,
  apiKey,
  /** null ＝ 不送出 reasoning_effort（哨兵值 none） */
  reasoningEffort: TAROT_AI_REASONING_EFFORT === 'none' ? null : TAROT_AI_REASONING_EFFORT,
  dailyLimit: TAROT_DAILY_LIMIT,
  ipDailyLimit: TAROT_IP_DAILY_LIMIT,
} as const;
