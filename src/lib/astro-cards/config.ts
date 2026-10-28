// ==========================================
// 線上占星抽卡 — 功能程式常數檔（B 層，demo_docs/astro_cards_plan.md 第三節第 4 小節）
// 所有 AI 功能共用之常數（逾時、body 上限、時區、Origin）見 src/lib/ai/shared/config.ts。
// ⚠️ 前後端共用、會被打包進前端：只能放可公開的值，
//    不得 import astro:env/server、src/lib/ai/server/ 或任何伺服器模組。
// 營運上可能調整的值（開關、每日上限）屬 A 層環境變數，見 astro.config.mjs env.schema。
// ==========================================
import { REQUEST_BODY_MAX_BYTES, assertAiTemperature } from '../ai/shared/config';
import type { DeckId } from './decks';

/** 問題字數上限（Unicode 字元計）；前端字數提示與後端驗證共用 */
export const QUESTION_MAX_CHARS = 120;

/** 請求 spread 欄位之唯一合法值（保留必填欄位之理由見規格書第四節第 1 小節） */
export const SPREAD_ID = 'triad';

/** 抽牌、翻牌、提示詞與回應之順序：什麼能量 → 以什麼方式 → 在哪個領域 */
export const DECK_ORDER: readonly DeckId[] = ['planet', 'sign', 'house'];

/** MiniMax OpenAI 相容端點合法範圍 (0, 1]（以 assertAiTemperature 斷言） */
export const AI_TEMPERATURE = 0.8;

/** 須容納推理＋解讀輸出；暫同塔羅，實測確認（規格書第五節第 3 小節） */
export const AI_MAX_OUTPUT_TOKENS = 2000;

/** 解讀長度：提示詞文字與結構驗證截斷引用同一組數值 */
export const READING_LENGTH = {
  cardMin: 50,
  cardMax: 100,
  summaryMin: 150,
  summaryMax: 250,
  adviceMax: 40,
  /** 結構驗證截斷倍率：模型字數計算不精確，上限 × 此倍率才截斷，避免正常輸出被硬切 */
  truncateSlack: 1.5,
} as const;

/** 前端每疊展開張數（儀式性選牌，不決定實際牌面） */
export const STACK_FAN_COUNT = 7;

/** API 路徑（前端呼叫端點） */
export const READING_API_PATH = '/api/astro-cards/reading';

// 斷言：違反即建置／啟動失敗
if (REQUEST_BODY_MAX_BYTES < QUESTION_MAX_CHARS * 4 + 256) {
  throw new Error('[astro-cards/config] REQUEST_BODY_MAX_BYTES too small for QUESTION_MAX_CHARS');
}
assertAiTemperature(AI_TEMPERATURE, 'astro-cards');
