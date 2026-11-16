// 星靈扭蛋佔位文案：正式對外開放前須由業主定稿，並登錄 content_inventory.md。
export const PAGE_META = {
  title: '星靈扭蛋 — 星靈織語 Starwoven',
  description: '輸入星靈織語提供的抽獎碼，轉動星靈扭蛋，遇見適合你的服務體驗。',
};

export const UI_TEXT = {
  badge: '星靈扭蛋・遇見新的可能',
  heading: '星靈扭蛋',
  intro: ['每一次轉動，都是一次新的相遇。', '輸入你的抽獎碼，看看星靈為你安排了哪一項體驗。'],
  codeLabel: '抽獎碼',
  codePlaceholder: '請輸入抽獎碼',
  codeHelp: '抽獎碼會由星靈織語透過官方 LINE 或活動貼文提供。',
  startButton: '轉動扭蛋',
  ritualStatus: '星靈正在整理訊息，請稍候…',
  resultEyebrow: '星靈為你抽到',
  resultIdLabel: '抽獎編號',
  resultGuide: '請截圖保存這個結果，將抽獎編號傳送至官方 LINE，由小編協助登記與安排體驗。',
  repeated: '這組抽獎碼已兌換過，以下為你原本的抽獎結果。',
  restored: '以下為這個瀏覽器上次保留的抽獎結果。',
  publicNote: '名額有限，依登記受理順序安排；抽中不代表已取得名額。',
  lineButton: '前往官方 LINE 登記',
  copyButton: '複製抽獎編號',
  copied: '已複製',
  copyFailed: '請長按編號複製',
  resetButton: '輸入其他抽獎碼',
  retryButton: '再試一次',
  editButton: '重新輸入',
  errorHeading: '這次暫時無法轉動扭蛋',
  demoBadge: '本機 Demo・結果不具兌換效力',
  demoGuide: '可使用 DEMO 體驗公開碼、ONCE 體驗一次性碼；ENDED 與 EMPTY 可查看錯誤狀態。',
};

export const ERROR_MESSAGES: Record<string, { message: string; retry: boolean }> = {
  INVALID_CODE: { message: '抽獎碼不存在或輸入有誤，請確認後再試一次。', retry: false },
  INACTIVE_CODE: { message: '本次扭蛋活動已結束，感謝你的參與。', retry: false },
  POOL_EMPTY: { message: '目前暫無可抽的體驗項目，請稍後再試或聯絡官方 LINE。', retry: true },
  NO_ELIGIBLE_PRIZE: { message: '目前沒有符合這組抽獎碼的項目，請聯絡官方 LINE 協助處理。', retry: false },
  RATE_LIMITED: { message: '目前轉動扭蛋的人較多，請稍等片刻再試。', retry: true },
  BUSY: { message: '星靈正在忙碌中，請稍等片刻再試。', retry: true },
  NETWORK: { message: '目前連線不穩，請確認網路後再試。', retry: true },
  TIMEOUT: { message: '連線等待較久，請稍後再試。', retry: true },
};

export const GENERIC_ERROR = '系統暫時無法完成抽籤，請稍後再試或聯絡官方 LINE。';
