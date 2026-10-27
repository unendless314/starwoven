// ==========================================
// 塔羅伺服器端設定（唯一讀取 TAROT_* 環境變數之模組）
// 共用之 AI 供應商設定（AI_*）見 src/lib/ai/server/config.ts。
// 其他後端模組只 import tarotServerConfig，不得各自讀取環境變數或 process.env。
// ⚠️ 僅可被 API 路由（及其伺服器模組）import；不得被前端 import。
// ==========================================
import { TAROT_ENABLED, TAROT_DAILY_LIMIT, TAROT_IP_DAILY_LIMIT } from 'astro:env/server';
import { aiServerConfig } from '../ai/server/config';

export const tarotServerConfig = {
  /** 功能開關且共用金鑰非空才啟用 */
  enabled: TAROT_ENABLED && aiServerConfig.keyPresent,
  dailyLimit: TAROT_DAILY_LIMIT,
  ipDailyLimit: TAROT_IP_DAILY_LIMIT,
} as const;
