// ==========================================
// 輸入守門：問題正規化、自傷關鍵字預檢（demo_docs/ai_platform_plan.md 第四節第 5 小節、第五節第 4 小節）
// 關鍵字清單全站一份，只存在伺服器，不進前端 bundle。
// ⚠️ 伺服器專用。
// ==========================================

// ---------- 輸入正規化 ----------

/**
 * 去除控制字元與首尾空白；角括號轉全形，避免偽造提示詞中的 <question> 分隔標記。
 * 回傳 null 表示型別不符或超過 maxChars（以 Unicode 字元計）。
 */
export function normalizeQuestion(raw: unknown, maxChars: number): string | null {
  if (raw === undefined || raw === null) return '';
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2064\uFEFF]/g, '')
    .replace(/[\t\n]+/g, ' ')
    .replace(/</g, '＜')
    .replace(/>/g, '＞')
    .trim();
  return Array.from(cleaned).length > maxChars ? null : cleaned;
}

// ---------- 自傷關鍵字預檢（寬鬆命中：誤判成本低於漏判） ----------

const SELF_HARM_KEYWORDS = [
  '自殺', '自杀', '輕生', '轻生', '尋死', '寻死', '想死', '去死', '不想活', '活不下去', '不想活了',
  '結束生命', '结束生命', '結束自己', '了結自己', '了結生命', '了断', '了斷', '自我了斷',
  '割腕', '跳樓', '跳楼', '燒炭', '烧炭', '上吊', '吞藥', '吞药', '安眠藥', '服毒', '臥軌',
  '自殘', '自残', '傷害自己', '伤害自己', '消失就好', '不如死', '死了算了', '死掉算了', '活著好累', '活着好累',
  'suicide', 'kill myself', 'end my life', 'self harm', 'self-harm',
];

export function isSelfHarmQuestion(question: string): boolean {
  if (!question) return false;
  const text = question.toLowerCase().replace(/\s+/g, '');
  return SELF_HARM_KEYWORDS.some((kw) => text.includes(kw.replace(/\s+/g, '')));
}
