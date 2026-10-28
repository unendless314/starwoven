// ==========================================
// 占星抽卡三疊牌資料（前後端共用：前端顯示符號與牌名、後端組提示詞）
// ⚠️ 佔位內容，待占星師審定（建議審定人：皮皮；demo_docs/astro_cards_plan.md 第七節）：
//    - 「行星」12 張之組成為暫定（十大行星＋北交點、南交點）
//    - 關鍵字為通用佔位牌義；宮位不使用傳統宮名，以「第 N 宮」＋生活領域呈現
// ⚠️ 會被打包進前端：只放可公開的牌義資料，不得放提示詞或伺服器專用內容。
// ==========================================

export type DeckId = 'planet' | 'sign' | 'house';

export interface AstroCard {
  /** planet-sun… / sign-aries… / house-01~12 */
  id: string;
  deck: DeckId;
  nameZh: string;
  nameEn: string;
  /** 占星符號已含 U+FE0E（文字呈現），避免行動裝置渲染成彩色 emoji */
  symbol: string;
  keywords: string[];
}

/** 牌組名稱（前端牌槽、進度文字與後端提示詞共用）；「行星」用語是否改稱「星體」待業主決定 */
export const DECK_NAMES: Record<DeckId, string> = {
  planet: '行星',
  sign: '星座',
  house: '宮位',
};

/** 牌背示意符號（儀式性區分三疊牌） */
export const DECK_MARKS: Record<DeckId, string> = {
  planet: '☉︎',
  sign: '♈︎',
  house: 'Ⅰ',
};

type Entry = [slug: string, nameZh: string, nameEn: string, symbol: string, keywords: string[]];

/** U+FE0E：文字呈現選擇字元 */
const text = (symbol: string) => `${symbol}︎`;

const PLANETS: Entry[] = [
  ['sun', '太陽', 'Sun', text('☉'), ['自我', '意志', '生命力']],
  ['moon', '月亮', 'Moon', text('☽'), ['情緒', '安全感', '內在需求']],
  ['mercury', '水星', 'Mercury', text('☿'), ['思考', '溝通', '學習']],
  ['venus', '金星', 'Venus', text('♀'), ['愛', '美感', '價值']],
  ['mars', '火星', 'Mars', text('♂'), ['行動', '勇氣', '渴望']],
  ['jupiter', '木星', 'Jupiter', text('♃'), ['擴展', '機會', '成長']],
  ['saturn', '土星', 'Saturn', text('♄'), ['責任', '紀律', '長期耕耘']],
  ['uranus', '天王星', 'Uranus', text('♅'), ['突破', '變革', '獨立']],
  ['neptune', '海王星', 'Neptune', text('♆'), ['夢想', '靈感', '直覺']],
  ['pluto', '冥王星', 'Pluto', text('♇'), ['轉化', '重生', '深層力量']],
  ['north-node', '北交點', 'North Node', text('☊'), ['成長方向', '新的課題', '未來']],
  ['south-node', '南交點', 'South Node', text('☋'), ['過往經驗', '熟悉的模式', '放下']],
];

const SIGNS: Entry[] = [
  ['aries', '牡羊座', 'Aries', text('♈'), ['開創', '直接', '熱情']],
  ['taurus', '金牛座', 'Taurus', text('♉'), ['穩定', '務實', '享受']],
  ['gemini', '雙子座', 'Gemini', text('♊'), ['好奇', '靈活', '交流']],
  ['cancer', '巨蟹座', 'Cancer', text('♋'), ['照顧', '歸屬', '敏感']],
  ['leo', '獅子座', 'Leo', text('♌'), ['表現', '自信', '創造']],
  ['virgo', '處女座', 'Virgo', text('♍'), ['細緻', '服務', '分析']],
  ['libra', '天秤座', 'Libra', text('♎'), ['平衡', '關係', '和諧']],
  ['scorpio', '天蠍座', 'Scorpio', text('♏'), ['深刻', '專注', '蛻變']],
  ['sagittarius', '射手座', 'Sagittarius', text('♐'), ['探索', '樂觀', '信念']],
  ['capricorn', '摩羯座', 'Capricorn', text('♑'), ['目標', '耐心', '成就']],
  ['aquarius', '水瓶座', 'Aquarius', text('♒'), ['創新', '自由', '群體']],
  ['pisces', '雙魚座', 'Pisces', text('♓'), ['包容', '想像', '靈性']],
];

const HOUSES: Entry[] = [
  ['01', '第一宮', '1st House', 'Ⅰ', ['自我', '外在形象', '新的開始']],
  ['02', '第二宮', '2nd House', 'Ⅱ', ['金錢', '資源', '自我價值']],
  ['03', '第三宮', '3rd House', 'Ⅲ', ['溝通', '學習', '手足與鄰里']],
  ['04', '第四宮', '4th House', 'Ⅳ', ['家庭', '根源', '內在安全感']],
  ['05', '第五宮', '5th House', 'Ⅴ', ['創造', '戀愛', '樂趣']],
  ['06', '第六宮', '6th House', 'Ⅵ', ['日常工作', '生活習慣', '服務']],
  ['07', '第七宮', '7th House', 'Ⅶ', ['伴侶', '合作', '一對一關係']],
  ['08', '第八宮', '8th House', 'Ⅷ', ['共享資源', '親密', '深層轉化']],
  ['09', '第九宮', '9th House', 'Ⅸ', ['遠行', '高等學習', '信念']],
  ['10', '第十宮', '10th House', 'Ⅹ', ['事業', '社會角色', '目標']],
  ['11', '第十一宮', '11th House', 'Ⅺ', ['朋友', '社群', '願景']],
  ['12', '第十二宮', '12th House', 'Ⅻ', ['潛意識', '休息', '靈性']],
];

const build = (deck: DeckId, entries: Entry[]): AstroCard[] =>
  entries.map(([slug, nameZh, nameEn, symbol, keywords]) => ({
    id: `${deck}-${slug}`,
    deck,
    nameZh,
    nameEn,
    symbol,
    keywords,
  }));

export const DECKS: Record<DeckId, AstroCard[]> = {
  planet: build('planet', PLANETS),
  sign: build('sign', SIGNS),
  house: build('house', HOUSES),
};

const BY_ID = new Map(Object.values(DECKS).flat().map((c) => [c.id, c]));

export function getAstroCard(id: unknown): AstroCard | undefined {
  return typeof id === 'string' ? BY_ID.get(id) : undefined;
}

// 斷言：違反即建置失敗（規格書第七節第 2 小節）
for (const [deck, cards] of Object.entries(DECKS)) {
  if (cards.length !== 12) throw new Error(`[astro-cards/decks] ${deck} must have exactly 12 cards`);
  if (cards.some((c) => c.keywords.length === 0)) throw new Error(`[astro-cards/decks] ${deck} has empty keywords`);
}
if (BY_ID.size !== 36) throw new Error('[astro-cards/decks] duplicate card id');
