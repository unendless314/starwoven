export const CODE_MAX_LENGTH = 32;
export const REDEEM_TIMEOUT_MS = 20000;
export const CAPTURED_CODE_KEY = 'starwoven_gacha_fragment_code';
export const PUBLIC_RESULTS_KEY = 'starwoven_gacha_public_results_v1';
export const DEMO_ONCE_RESULT_KEY = 'starwoven_gacha_demo_once_result_v1';

export const PRIZES = [
  '塔羅占卜',
  '星盤解析',
  '生命靈數',
  '臼井靈氣',
  '阿卡西紀錄',
  '毛孩溝通',
  '天使靈氣',
  '亢達里尼靈氣',
  '靈擺調頻',
  '脈輪檢測',
] as const;

export type CodeType = '一次性' | '公開';

export interface GachaResult {
  drawId: string;
  prize: string;
  codeType: CodeType;
  repeated: boolean;
}
