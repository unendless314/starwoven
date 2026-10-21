// ==========================================
// 線上塔羅抽卡 — 前端可見文案（單一來源）
// 錯誤碼 → 訊息、隱私告知、免責聲明、安全關懷文案集中於此；頁面與互動腳本不得散寫文案字串。
// ⚠️ 會被打包進前端：只能放可公開的值。
// ==========================================

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'FORBIDDEN_ORIGIN'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'DAILY_LIMIT'
  | 'DISABLED'
  | 'AI_FAILED'
  | 'SERVICE_DOWN'
  | 'GATEWAY_TIMEOUT'
  | 'AI_BUSY';

/** 通用錯誤訊息（FORBIDDEN_ORIGIN、SERVICE_DOWN 與無法辨識之錯誤） */
export const GENERIC_ERROR = '星靈訊號暫時中斷，請稍後再試一次。';

/** 錯誤碼 → 前端顯示訊息與是否提供重試鈕（規格書第四節第 3 小節） */
export const ERROR_MESSAGES: Record<ErrorCode, { message: string; retry: boolean }> = {
  INVALID_REQUEST: { message: '請重新選擇牌陣後再試一次', retry: false },
  FORBIDDEN_ORIGIN: { message: GENERIC_ERROR, retry: false },
  PAYLOAD_TOO_LARGE: { message: '請重新選擇牌陣後再試一次', retry: false },
  RATE_LIMITED: { message: '抽牌太頻繁了，休息一下再回來吧', retry: false },
  DAILY_LIMIT: { message: '今日星靈休息中，明天再來抽牌吧', retry: false },
  DISABLED: { message: '抽卡功能暫停中', retry: false },
  AI_FAILED: { message: '星靈訊號不穩，請稍後再試', retry: true },
  SERVICE_DOWN: { message: GENERIC_ERROR, retry: false },
  GATEWAY_TIMEOUT: { message: '星靈訊號不穩，請稍後再試', retry: true },
  AI_BUSY: { message: '星靈暫時休息中，請稍後再來', retry: false },
};

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, value);
}

/** 成功回應附帶之 AI 告知（API 回傳 notice 欄位） */
export const READING_NOTICE = '本解讀由 AI 依牌義生成，僅供參考與自我覺察。';

/** 問題輸入框下方之隱私告知（規格書第五節第 5 小節） */
export const PRIVACY_NOTE = '你的問題只用於本次解讀，我們不會保存；解讀由第三方 AI 服務生成。';

/** Demo 期間佔位內容標示 */
export const PLACEHOLDER_NOTE = 'Demo 測試版：牌義與解讀語氣為佔位內容，待占卜師審定；牌面為佔位視覺。';

/** 頁面 <title>／meta description */
export const PAGE_META = {
  title: '線上塔羅抽卡 — 星靈織語 Starwoven',
  description: '靜下心來，選擇牌陣、在心中默念你的問題，抽出屬於此刻的塔羅牌，聆聽星靈為你編織的訊息。',
} as const;

export const UI_TEXT = {
  badge: '偉特塔羅・星靈解讀',
  heading: '線上塔羅抽卡',
  intro: ['靜下心來，在心中默念你的問題，', '抽出屬於此刻的牌，聆聽星靈為你編織的訊息。'],
  setupHeading: '選擇牌陣與輸入問題',
  spreadLegend: '1. 選擇牌陣',
  questionLabel: '2. 寫下你的問題',
  startButton: '開始洗牌',
  fanLabel: '牌堆',
  fanCardLabel: (n: number) => `第 ${n} 張牌`,
  questionPlaceholder: '想問的事情（選填）——留白則為一般性指引',
  shuffling: '星靈正在洗牌…',
  pickPrompt: (remaining: number) => `憑直覺，再選 ${remaining} 張牌`,
  waiting: '星靈正在編織訊息…',
  reversed: '逆位',
  upright: '正位',
  summaryTitle: '整體訊息',
  adviceTitle: '星靈的建議',
  ctaTitle: '想深入聊聊？',
  ctaButton: '預約真人占卜師',
  again: '再抽一次',
  retry: '再試一次',
  noscript: '線上抽卡需要啟用 JavaScript 才能進行。',
} as const;

/** 安全關懷（自傷相關提問）：不抽牌、不呼叫 AI，改顯示固定文案與求助資源 */
export const CARE_COPY = {
  title: '先停下來，好好照顧自己',
  body: '謝謝你願意說出心裡的重量。此刻的你值得被好好陪伴——如果感到很辛苦，請先聯繫下列專業資源，他們隨時都在。',
  hotlines: [
    { name: '安心專線', number: '1925', note: '24 小時' },
    { name: '生命線', number: '1995', note: '' },
    { name: '張老師', number: '1980', note: '' },
  ],
  lineCta: '預約真人陪伴',
} as const;
