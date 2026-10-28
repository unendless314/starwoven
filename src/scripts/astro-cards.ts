// ==========================================
// 線上占星抽卡互動邏輯（由 astro-cards.astro 以頁面層級 <script> 引入，全頁一份）
// 狀態機：setup → pick（行星 → 星座 → 宮位，一次展開一疊，選中之牌移入上方牌槽）
//         → 送出請求（等待動畫）→ result（依序翻牌＋逐段淡入）
//         └→ care（自傷預檢命中）／error（錯誤碼對照 copy.ts）
// - 牌由後端以 crypto 亂數抽出；前端選牌僅為儀式，翻牌在 API 回傳後才開始
// - API 呼叫、錯誤碼判斷與降級規則見 src/lib/ai/shared/client.ts（ai_platform_plan.md 第四節第 4 小節）
// - GA4 事件不含問題內容與抽到的牌
// ==========================================
import { postReading, trackEvent } from '../lib/ai/shared/client';
import { DECK_ORDER, QUESTION_MAX_CHARS, READING_API_PATH, SPREAD_ID, STACK_FAN_COUNT } from '../lib/astro-cards/config';
import { ERROR_MESSAGES, GENERIC_ERROR, UI_TEXT } from '../lib/astro-cards/copy';
import { DECK_MARKS, DECK_NAMES, getAstroCard, type DeckId } from '../lib/astro-cards/decks';

// 儀式動畫節奏（ms）：純視覺時長，與 astro-cards.astro <style> 內 CSS 動畫耦合，故集中於此而非 config.ts。
// 改動時一併核對對應 CSS。
const RITUAL_TIMING = {
  /** 收攏 → 展開扇形：≈ .ac-fan-card transition 0.6s */
  fanOut: 600,
  /** 選中後至移入牌槽：≈ .ac-fan-card[aria-pressed] 上浮 0.6s */
  picked: 550,
  /** 牌槽填入：≈ .ac-slot-card 動畫 0.45s */
  slotIn: 450,
  /** 進入結果區後至第一張翻牌 */
  beforeFlip: 500,
  /** 逐張翻牌間隔：≈ .ac-flip-inner transition 0.8s */
  flipEach: 700,
  /** 解讀段落逐段淡入間隔：≈ .ac-fade 動畫 0.7s */
  blockEach: 450,
} as const;

type Step = 'setup' | 'pick' | 'result' | 'care' | 'error';

interface ReadingResponse {
  ok: true;
  spread: typeof SPREAD_ID;
  cards: { deck: DeckId; id: string; name: string }[];
  reading: { cards: string[]; summary: string; advice: string };
  notice: string;
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** 成功回應完整驗證（規格書第四節第 3 小節）：全部成立才視為成功 */
function isValidReading(data: Record<string, unknown>): boolean {
  if (data.spread !== SPREAD_ID || !isNonEmptyString(data.notice)) return false;
  const { cards, reading } = data;
  if (!Array.isArray(cards) || cards.length !== DECK_ORDER.length) return false;
  const cardsOk = cards.every((c: unknown, i) => {
    if (!c || typeof c !== 'object') return false;
    const { deck, id, name } = c as Record<string, unknown>;
    return deck === DECK_ORDER[i] && getAstroCard(id)?.deck === deck && isNonEmptyString(name);
  });
  if (!cardsOk || !reading || typeof reading !== 'object') return false;
  const r = reading as Record<string, unknown>;
  return (
    Array.isArray(r.cards) && r.cards.length === DECK_ORDER.length && r.cards.every(isNonEmptyString) &&
    isNonEmptyString(r.summary) && isNonEmptyString(r.advice)
  );
}

const root = document.querySelector<HTMLElement>('[data-ac-root]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const form = $<HTMLFormElement>('#ac-form');
  const questionInput = $<HTMLTextAreaElement>('#ac-question');
  const questionCount = $('[data-question-count]');
  const pickStatus = $('#ac-pick-status');
  const slots = Array.from(root.querySelectorAll<HTMLElement>('[data-slot]'));
  const fan = $('[data-fan]');
  const waiting = $('[data-waiting]');
  const resultCards = $('[data-result-cards]');
  const readingBox = $('[data-reading]');
  const errorMessage = $('[data-error-message]');
  const retryBtn = $<HTMLButtonElement>('[data-action="retry"]');
  const cardTemplate = $<HTMLTemplateElement>('#ac-card-template');
  const outroTemplate = $<HTMLTemplateElement>('#ac-outro-template');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, reducedMotion ? 0 : ms));

  let pending = false;
  /** 每次「再抽一次」遞增；舊流程的非同步回呼比對後自動放棄，避免殘留動畫寫入新流程 */
  let runId = 0;
  let lastQuestion: string | null = null;

  function show(step: Step, focus = true) {
    for (const el of steps) el.hidden = el.dataset.step !== step;
    const active = steps.find((el) => el.dataset.step === step);
    if (focus && active) {
      active.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  // ---------- setup ----------

  // 字數以 Unicode 字元計（與後端 Array.from 一致）；不用 maxlength——瀏覽器以 UTF-16 code unit 計算，
  // emoji 等字元會提早被截斷。超出時（含貼上）依字元截斷至上限。
  const updateCount = () => {
    const chars = Array.from(questionInput.value);
    if (chars.length > QUESTION_MAX_CHARS) questionInput.value = chars.slice(0, QUESTION_MAX_CHARS).join('');
    questionCount.textContent = String(Math.min(chars.length, QUESTION_MAX_CHARS));
  };
  questionInput.addEventListener('input', updateCount);
  updateCount();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (pending) return;
    const question = Array.from(questionInput.value.trim()).slice(0, QUESTION_MAX_CHARS).join('');
    trackEvent('astrocards_start', { spread: SPREAD_ID });
    void startPick(question);
  });

  root.addEventListener('click', (e) => {
    const action = (e.target as Element).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'again') reset();
    else if (action === 'retry' && lastQuestion !== null && !pending) {
      // 重試：沿用已選三張牌之畫面直接重新送出（牌面本由後端決定）
      show('pick');
      void submit(runId, lastQuestion);
    }
  });

  function clearSlots() {
    for (const slot of slots) {
      slot.classList.remove('is-filled', 'is-current', 'is-waiting');
    }
  }

  function reset() {
    runId++;
    pending = false;
    lastQuestion = null;
    fan.onclick = null;
    fan.replaceChildren();
    clearSlots();
    resultCards.replaceChildren();
    readingBox.replaceChildren();
    show('setup');
    questionInput.focus({ preventScroll: true });
  }

  // ---------- pick：三疊依序展開選牌 ----------

  async function startPick(question: string) {
    const run = ++runId;
    lastQuestion = question;
    clearSlots();
    waiting.hidden = true;
    show('pick');

    for (let i = 0; i < DECK_ORDER.length; i++) {
      const picked = await pickFrom(run, DECK_ORDER[i], i);
      if (!picked || run !== runId) return;
    }
    void submit(run, question);
  }

  /** 展開一疊牌並等待訪客點選 1 張；選中後填入對應牌槽。流程已被重設時回傳 false */
  async function pickFrom(run: number, deck: DeckId, index: number): Promise<boolean> {
    const slot = slots[index];
    slot.classList.add('is-current');
    fan.dataset.deck = deck;
    fan.setAttribute('aria-label', UI_TEXT.stackLabel(DECK_NAMES[deck]));
    fan.replaceChildren();
    fan.classList.add('is-stacked');
    for (let i = 0; i < STACK_FAN_COUNT; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ac-fan-card ac-card-back';
      btn.dataset.mark = DECK_MARKS[deck];
      btn.style.setProperty('--t', String(i / (STACK_FAN_COUNT - 1)));
      btn.style.zIndex = String(i);
      btn.setAttribute('aria-label', UI_TEXT.stackCardLabel(DECK_NAMES[deck], i + 1));
      btn.setAttribute('aria-pressed', 'false');
      btn.disabled = true;
      fan.appendChild(btn);
    }
    pickStatus.textContent = UI_TEXT.pickPrompt(DECK_NAMES[deck], index + 1, DECK_ORDER.length);

    // 下一個 frame 再移除收攏狀態，讓展開動畫生效
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    fan.classList.remove('is-stacked');
    await wait(RITUAL_TIMING.fanOut);
    if (run !== runId) return false;

    const fanCards = Array.from(fan.querySelectorAll<HTMLButtonElement>('.ac-fan-card'));
    fanCards.forEach((btn) => (btn.disabled = false));
    fanCards[0]?.focus({ preventScroll: true });

    const chosen = await new Promise<HTMLButtonElement>((resolve) => {
      fan.onclick = (e) => {
        const btn = (e.target as Element).closest<HTMLButtonElement>('.ac-fan-card');
        if (!btn || btn.disabled) return;
        fan.onclick = null;
        resolve(btn);
      };
    });
    if (run !== runId) return false;

    chosen.setAttribute('aria-pressed', 'true');
    fanCards.forEach((b) => (b.disabled = true));
    await wait(RITUAL_TIMING.picked);
    if (run !== runId) return false;

    slot.classList.remove('is-current');
    slot.classList.add('is-filled');
    fan.replaceChildren();
    await wait(RITUAL_TIMING.slotIn);
    return run === runId;
  }

  // ---------- 送出請求 ----------

  async function submit(run: number, question: string) {
    pending = true;
    pickStatus.textContent = UI_TEXT.waiting;
    fan.replaceChildren();
    slots.forEach((s) => s.classList.add('is-waiting'));
    waiting.hidden = false;

    const result = await postReading<ReadingResponse>(
      READING_API_PATH,
      { spread: SPREAD_ID, question },
      isValidReading,
    );
    if (run !== runId) return;
    pending = false;
    waiting.hidden = true;
    slots.forEach((s) => s.classList.remove('is-waiting'));

    if (result.kind === 'care') {
      show('care');
      return;
    }
    if (result.kind === 'error') {
      trackEvent('astrocards_reading_error', { error: result.code ?? 'UNKNOWN' });
      const entry = result.code ? ERROR_MESSAGES[result.code] : null;
      errorMessage.textContent = entry?.message ?? GENERIC_ERROR;
      retryBtn.hidden = !entry?.retry;
      show('error');
      return;
    }
    trackEvent('astrocards_reading_success', { spread: SPREAD_ID, has_question: question !== '' });
    await renderResult(run, result.data);
  }

  // ---------- result：依序翻牌＋逐段淡入 ----------

  function buildCard(entry: ReadingResponse['cards'][number]): HTMLElement {
    const card = getAstroCard(entry.id)!;
    const deckName = DECK_NAMES[card.deck];
    const node = cardTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const set = (sel: string, text: string) => {
      const el = node.querySelector<HTMLElement>(sel);
      if (el) el.textContent = text;
    };
    set('[data-deck-name]', deckName);
    set('[data-symbol]', card.symbol);
    set('[data-face-name]', card.nameZh);
    set('[data-name-zh]', card.nameZh);
    set('[data-name-en]', card.nameEn);
    node.querySelector<HTMLElement>('.ac-flip-back')!.dataset.mark = DECK_MARKS[card.deck];
    const flip = node.querySelector('[data-flip]')!;
    flip.setAttribute('role', 'img');
    flip.setAttribute('aria-label', `${deckName}：${card.nameZh} ${card.nameEn}`);
    return node;
  }

  function readingBlock(title: string, text: string, highlight = false): HTMLElement {
    const box = document.createElement('div');
    box.className = highlight
      ? 'ac-fade rounded-3xl p-5 sm:p-7 border-2 border-[#FCE794] bg-[#FCE794]/20 dark:bg-[#FCE794]/10'
      : 'ac-fade rounded-3xl p-5 sm:p-7 bg-white/95 dark:bg-[#231f40]/95 border border-gray-200/80 dark:border-white/20 shadow-sm';
    const h = document.createElement('h3');
    h.className = 'font-bold font-huninn tracking-wider text-lg text-[#2E2A4F] dark:text-white mb-2';
    h.textContent = title;
    const p = document.createElement('p');
    p.className = 'text-base leading-loose text-[#3A3A3A]/90 dark:text-white/85';
    p.textContent = text;
    box.append(h, p);
    return box;
  }

  async function renderResult(run: number, data: ReadingResponse) {
    resultCards.replaceChildren(...data.cards.map(buildCard));
    readingBox.replaceChildren();
    show('result');

    await wait(RITUAL_TIMING.beforeFlip);
    const flips = Array.from(resultCards.querySelectorAll<HTMLElement>('[data-flip]'));
    for (const flip of flips) {
      if (run !== runId) return;
      flip.classList.add('is-flipped');
      await wait(RITUAL_TIMING.flipEach);
    }

    const blocks = [
      ...data.cards.map((c, i) => {
        const card = getAstroCard(c.id)!;
        return readingBlock(`${DECK_NAMES[card.deck]}・${card.nameZh}`, data.reading.cards[i]);
      }),
      readingBlock(UI_TEXT.summaryTitle, data.reading.summary),
      readingBlock(UI_TEXT.adviceTitle, data.reading.advice, true),
    ];
    for (const block of blocks) {
      if (run !== runId) return;
      readingBox.appendChild(block);
      await wait(RITUAL_TIMING.blockEach);
    }
    if (run !== runId) return;
    const outro = outroTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
    outro.querySelector('[data-notice]')!.textContent = data.notice;
    readingBox.appendChild(outro);
  }
}
