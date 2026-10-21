// ==========================================
// 牌陣定義（前後端共用；代碼即 API 白名單）
// 牌陣種類為暫定值，待業主決定（規格書第十節第 3 項）
// ==========================================

export interface Spread {
  name: string;
  description: string;
  positions: string[];
}

export type SpreadId = 'single' | 'three';

export const SPREADS: Record<SpreadId, Spread> = {
  single: {
    name: '今日指引',
    description: '抽一張牌，聆聽今天星靈想對你說的話。',
    positions: ['今日指引'],
  },
  three: {
    name: '過去／現在／未來',
    description: '抽三張牌，看見事情的來處、現況與流向。',
    positions: ['過去', '現在', '未來'],
  },
};

export const SPREAD_IDS = Object.keys(SPREADS) as SpreadId[];

export function isSpreadId(value: unknown): value is SpreadId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SPREADS, value);
}
