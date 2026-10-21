// ==========================================
// 防濫用與輸入守門：每日上限計數（呼叫 AI 前同步保留）、自傷關鍵字預檢、輸入正規化
// 計數存於 Node 程序記憶體（重啟歸零，MVP 接受）；只存 IP 雜湊與次數，每日清空。
// ⚠️ 伺服器專用：僅被 API 路由 import。
// ==========================================
import { createHash, randomBytes } from 'node:crypto';
import { QUESTION_MAX_CHARS, TIMEZONE } from './config';
import { tarotServerConfig as cfg } from './server-config';

// ---------- 輸入正規化 ----------

/**
 * 去除控制字元與首尾空白；角括號轉全形，避免偽造提示詞中的 <question> 分隔標記。
 * 回傳 null 表示超過字數上限（以 Unicode 字元計）。
 */
export function normalizeQuestion(raw: unknown): string | null {
  if (raw === undefined || raw === null) return '';
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2064\uFEFF]/g, '')
    .replace(/[\t\n]+/g, ' ')
    .replace(/</g, '＜')
    .replace(/>/g, '＞')
    .trim();
  return Array.from(cleaned).length > QUESTION_MAX_CHARS ? null : cleaned;
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

// ---------- 每日額度（台灣時間 00:00 重置） ----------

const salt = randomBytes(16);
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

let currentDay = '';
let siteCount = 0;
const ipCounts = new Map<string, number>();

function rollDay() {
  const today = dayFormatter.format(new Date());
  if (today !== currentDay) {
    currentDay = today;
    siteCount = 0;
    ipCounts.clear();
  }
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(salt).update(ip).digest('hex').slice(0, 32);
}

export interface Reservation {
  /** AI_FAILED：只釋放 IP 額度（全站額度計入可能被扣用的呼叫） */
  releaseIp(): void;
  /** AI_BUSY：全站與 IP 額度皆釋放（供應商拒絕、未扣用） */
  releaseAll(): void;
}

/**
 * 同步檢查並保留全站與 IP 額度（中間不得有 await，Node 單執行緒保證不可分割）。
 * 任一額度不足回傳 null（不遞增）。
 */
export function reserveQuota(ipHash: string): Reservation | null {
  rollDay();
  const ipCount = ipCounts.get(ipHash) ?? 0;
  if (siteCount >= cfg.dailyLimit || ipCount >= cfg.ipDailyLimit) return null;
  siteCount++;
  ipCounts.set(ipHash, ipCount + 1);

  const day = currentDay;
  let released = false;
  const releaseIpOnly = () => {
    const n = ipCounts.get(ipHash) ?? 0;
    if (n <= 1) ipCounts.delete(ipHash);
    else ipCounts.set(ipHash, n - 1);
  };
  // 跨日後計數已清空，不再釋放（避免減到新的一天）
  const guard = (fn: () => void) => () => {
    if (released) return;
    released = true;
    rollDay();
    if (day === currentDay) fn();
  };
  return {
    releaseIp: guard(releaseIpOnly),
    releaseAll: guard(() => {
      releaseIpOnly();
      siteCount = Math.max(0, siteCount - 1);
    }),
  };
}
