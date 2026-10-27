// ==========================================
// 每日額度計數工廠（demo_docs/ai_platform_plan.md 第六節）
// 每個功能於端點模組層建立自己的一份（各功能額度分開計算）；hashIp 全部功能共用同一 salt。
// 計數存於 Node 程序記憶體（重啟歸零，MVP 接受）；只存 IP 雜湊與次數，每日清空。
// ⚠️ 伺服器專用。
// ==========================================
import { createHash, randomBytes } from 'node:crypto';
import { TIMEZONE } from '../shared/config';

const salt = randomBytes(16);
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export function hashIp(ip: string): string {
  return createHash('sha256').update(salt).update(ip).digest('hex').slice(0, 32);
}

export interface Reservation {
  /** AI_FAILED：只釋放 IP 額度（全站額度計入可能被扣用的呼叫） */
  releaseIp(): void;
  /** AI_BUSY：全站與 IP 額度皆釋放（供應商拒絕、未扣用） */
  releaseAll(): void;
}

export interface DailyQuota {
  /**
   * 同步檢查並保留全站與 IP 額度（中間不得有 await，Node 單執行緒保證不可分割）。
   * 任一額度不足回傳 null（不遞增）。
   */
  reserve(ipHash: string): Reservation | null;
}

export function createDailyQuota(limits: { dailyLimit: number; ipDailyLimit: number }): DailyQuota {
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

  return {
    reserve(ipHash) {
      rollDay();
      const ipCount = ipCounts.get(ipHash) ?? 0;
      if (siteCount >= limits.dailyLimit || ipCount >= limits.ipDailyLimit) return null;
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
    },
  };
}
