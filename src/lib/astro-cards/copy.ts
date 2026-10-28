// ==========================================
// 線上占星抽卡 — 前端可見文案（單一來源；全部暫定，待業主確認，規格書第六節第 4 小節）
// 錯誤碼 → 訊息、隱私告知、免責聲明集中於此；頁面與互動腳本不得散寫文案字串。
// 錯誤碼定義見 src/lib/ai/shared/errors.ts；安全關懷文案全站一份，見 src/lib/ai/shared/care.ts。
// ⚠️ 會被打包進前端：只能放可公開的值。
// ==========================================
import type { ErrorCode } from '../ai/shared/errors';

/** 通用錯誤訊息（FORBIDDEN_ORIGIN、SERVICE_DOWN 與無法辨識之錯誤） */
export const GENERIC_ERROR = '星靈訊號暫時中斷，請稍後再試一次。';

/** 錯誤碼 → 前端顯示訊息與是否提供重試鈕（規格書第四節第 3 小節） */
export const ERROR_MESSAGES: Record<ErrorCode, { message: string; retry: boolean }> = {
  INVALID_REQUEST: { message: '請重新抽牌後再試一次', retry: false },
  FORBIDDEN_ORIGIN: { message: GENERIC_ERROR, retry: false },
  PAYLOAD_TOO_LARGE: { message: '請重新抽牌後再試一次', retry: false },
  RATE_LIMITED: { message: '抽牌太頻繁了，休息一下再回來吧', retry: false },
  DAILY_LIMIT: { message: '今日星空休息中，明天再來抽牌吧', retry: false },
  DISABLED: { message: '占星抽卡暫停中', retry: false },
  AI_FAILED: { message: '星靈訊號不穩，請稍後再試', retry: true },
  SERVICE_DOWN: { message: GENERIC_ERROR, retry: false },
  GATEWAY_TIMEOUT: { message: '星靈訊號不穩，請稍後再試', retry: true },
  AI_BUSY: { message: '星靈暫時休息中，請稍後再來', retry: false },
};

/** 成功回應附帶之 AI 告知（API 回傳 notice 欄位） */
export const READING_NOTICE = '本解讀由 AI 依牌義生成，僅供參考與自我覺察。';

/** 問題輸入框下方之隱私告知（同塔羅措辭） */
export const PRIVACY_NOTE = '你的問題只用於本次解讀，我們不會保存；解讀由第三方 AI 服務生成。';

/** Demo 期間佔位內容標示 */
export const PLACEHOLDER_NOTE = 'Demo 測試版：牌義與解讀語氣為佔位內容，待占星師審定；牌面為佔位視覺。';

/** 頁面 <title>／meta description */
export const PAGE_META = {
  title: '線上占星抽卡 — 星靈織語 Starwoven',
  description: '從行星、星座、宮位三疊牌中各抽一張，看見此刻的能量、展現方式與生活舞台，聆聽星靈為你編織的訊息。',
} as const;

export const UI_TEXT = {
  badge: '行星・星座・宮位',
  heading: '線上占星抽卡',
  intro: ['靜下心來，在心中默念你的問題，', '從三疊星空之牌中各抽一張，看看此刻的能量正在哪裡流動。'],
  setupHeading: '輸入問題',
  questionLabel: '寫下你的問題',
  questionPlaceholder: '想問的事情（選填）——留白則為一般性指引',
  startButton: '開始抽牌',
  slotsLabel: '已抽出的牌',
  stackLabel: (deckName: string) => `${deckName}牌堆`,
  stackCardLabel: (deckName: string, n: number) => `${deckName}牌 第 ${n} 張`,
  pickPrompt: (deckName: string, step: number, total: number) => `請選擇一張${deckName}牌（${step}／${total}）`,
  waiting: '星靈正在編織訊息…',
  summaryTitle: '整體訊息',
  adviceTitle: '星靈的建議',
  ctaTitle: '想看看完整的星盤？',
  ctaButton: '預約真人占星師',
  again: '再抽一次',
  retry: '再試一次',
  noscript: '線上抽卡需要啟用 JavaScript 才能進行。',
} as const;
