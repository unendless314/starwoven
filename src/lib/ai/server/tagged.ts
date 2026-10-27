// ==========================================
// 標記式輸出之通用擷取工具（demo_docs/ai_platform_plan.md 第五節第 4 小節）
// 不採 JSON：實測 M3.1-Flash／M3 常把結尾符號錯置，使 JSON 失效（DEC-074）。
// 欄位組合與驗證規則由各功能 ai.ts 決定。
// ⚠️ 伺服器專用。
// ==========================================

/** 擷取所有 <tag>…</tag> 區塊內容（不分大小寫、去除首尾空白），依出現順序 */
export function extractTagged(text: string, tag: string): string[] {
  return Array.from(text.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi')), (m) => m[1].trim());
}

/** 依 Unicode 字元截斷（不切斷代理對） */
export function truncateChars(text: string, max: number): string {
  const chars = Array.from(text.trim());
  return chars.length > max ? chars.slice(0, max).join('') : chars.join('');
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}
