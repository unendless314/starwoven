// ==========================================
// 占星抽卡伺服器端設定（唯一讀取 ASTROCARDS_* 環境變數之模組）
// 共用之 AI 供應商設定（AI_*）見 src/lib/ai/server/config.ts。
// 其他後端模組只 import astroCardsServerConfig，不得各自讀取環境變數或 process.env。
// ⚠️ 僅可被 API 路由（及其伺服器模組）import；不得被前端 import。
// ==========================================
import { ASTROCARDS_ENABLED, ASTROCARDS_DAILY_LIMIT, ASTROCARDS_IP_DAILY_LIMIT } from 'astro:env/server';
import { aiServerConfig } from '../ai/server/config';

export const astroCardsServerConfig = {
  /** 功能開關且共用金鑰非空才啟用 */
  enabled: ASTROCARDS_ENABLED && aiServerConfig.keyPresent,
  dailyLimit: ASTROCARDS_DAILY_LIMIT,
  ipDailyLimit: ASTROCARDS_IP_DAILY_LIMIT,
} as const;
