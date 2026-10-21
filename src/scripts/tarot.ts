// ==========================================
// 線上塔羅抽卡互動邏輯（由 tarot.astro 以頁面層級 <script> 引入，全頁一份）
// 狀態機：setup → pick（洗牌＋扇形選牌）→ 送出請求（等待動畫）→ result（依序翻牌＋逐段淡入）
//         └→ care（自傷預檢命中）／error（錯誤碼對照 copy.ts）
// - 牌由後端以 crypto 亂數抽出；前端選牌僅為儀式，翻牌在 API 回傳後才開始
// - 錯誤一律以 JSON error 代碼為準；body 無法解析時才依狀態碼降級（規格書第四節第 3 小節）
// - GA4 事件不含問題內容
// ==========================================
import { getCard, type TarotCard } from '../lib/tarot/cards';
import { CLIENT_REQUEST_TIMEOUT_MS, FAN_CARD_COUNT, QUESTION_MAX_CHARS, READING_API_PATH } from '../lib/tarot/config';
import { ERROR_MESSAGES, GENERIC_ERROR, UI_TEXT, isErrorCode, type ErrorCode } from '../lib/tarot/copy';
import { SPREADS, isSpreadId, type SpreadId } from '../lib/tarot/spreads';

// 儀式動畫節奏（ms）：純視覺時長，與 tarot.astro <style> 內 CSS 動畫耦合，故集中於此而非 config.ts
// （規格書第三節第 3 小節（1）之例外）。改動時一併核對對應 CSS。
const RITUAL_TIMING = {
  /** 洗牌：≈ .tarot-fan.is-shuffling 動畫 0.45s × 3 次 */
  shuffle: 1400,
  /** 收攏 → 展開扇形：≈ .tarot-fan-card transition 0.6s */
  fanOut: 600,
  /** 進入結果區後至第一張翻牌 */
  beforeFlip: 500,
  /** 逐張翻牌間隔：≈ .tarot-flip-inner transition 0.8s */
  flipEach: 700,
  /** 解讀段落逐段淡入間隔：≈ .tarot-fade 動畫 0.7s */
  blockEach: 450,
} as const;

type Step = 'setup' | 'pick' | 'result' | 'care' | 'error';

interface ReadingResponse {
  ok: true;
  spread: SpreadId;
  cards: { position: string; id: string; name: string; reversed: boolean }[];
  reading: { cards: string[]; summary: string; advice: string };
  notice: string;
}

type ApiResult =
  | { kind: 'reading'; data: ReadingResponse }
  | { kind: 'care' }
  | { kind: 'error'; code: ErrorCode | null };

const root = document.querySelector<HTMLElement>('[data-tarot-root]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const form = $<HTMLFormElement>('#tarot-form');
  const questionInput = $<HTMLTextAreaElement>('#tarot-question');
  const questionCount = $('[data-question-count]');
  const pickStatus = $('#tarot-pick-status');
  const fan = $('[data-fan]');
  const waiting = $('[data-waiting]');
  const resultTitle = $('[data-result-title]');
  const resultCards = $('[data-result-cards]');
  const readingBox = $('[data-reading]');
  const errorMessage = $('[data-error-message]');
  const retryBtn = $<HTMLButtonElement>('[data-action="retry"]');
  const cardTemplate = $<HTMLTemplateElement>('#tarot-card-template');
  const outroTemplate = $<HTMLTemplateElement>('#tarot-outro-template');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, reducedMotion ? 0 : ms));

  let pending = false;
  /** 每次「再抽一次」遞增；舊流程的非同步回呼比對後自動放棄，避免殘留動畫寫入新流程 */
  let runId = 0;
  let lastRequest: { spread: SpreadId; question: string } | null = null;

  function show(step: Step, focus = true) {
    for (const el of steps) el.hidden = el.dataset.step !== step;
    const active = steps.find((el) => el.dataset.step === step);
    if (focus && active) {
      active.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function track(event: string, params: Record<string, unknown>) {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') gtag('event', event, params);
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
    const spread = new FormData(form).get('spread');
    if (!isSpreadId(spread)) return;
    const question = Array.from(questionInput.value.trim()).slice(0, QUESTION_MAX_CHARS).join('');
    track('tarot_start', { spread });
    startPick(spread, question);
  });

  root.addEventListener('click', (e) => {
    const action = (e.target as Element).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'again') reset();
    else if (action === 'retry' && lastRequest && !pending) {
      // 重試：沿用已選的牌堆畫面直接重新送出（牌面本由後端決定）
      const { spread, question } = lastRequest;
      show('pick');
      void submit(runId, spread, question);
    }
  });

  function reset() {
    runId++;
    pending = false;
    lastRequest = null;
    fan.replaceChildren();
    resultCards.replaceChildren();
    readingBox.replaceChildren();
    show('setup');
    questionInput.focus({ preventScroll: true });
  }

  // ---------- pick：洗牌＋扇形選牌 ----------

  async function startPick(spread: SpreadId, question: string) {
    const run = ++runId;
    const need = SPREADS[spread].positions.length;
    let remaining = need;
    lastRequest = { spread, question };

    fan.replaceChildren();
    fan.classList.remove('is-waiting');
    fan.classList.add('is-stacked');
    waiting.hidden = true;
    for (let i = 0; i < FAN_CARD_COUNT; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tarot-fan-card tarot-card-back';
      btn.style.setProperty('--t', String(i / (FAN_CARD_COUNT - 1)));
      btn.style.zIndex = String(i);
      btn.setAttribute('aria-label', UI_TEXT.fanCardLabel(i + 1));
      btn.setAttribute('aria-pressed', 'false');
      btn.disabled = true;
      fan.appendChild(btn);
    }
    pickStatus.textContent = UI_TEXT.shuffling;
    show('pick');

    fan.classList.add('is-shuffling');
    await wait(RITUAL_TIMING.shuffle);
    if (run !== runId) return;
    fan.classList.remove('is-shuffling', 'is-stacked');
    await wait(RITUAL_TIMING.fanOut);
    if (run !== runId) return;

    const fanCards = Array.from(fan.querySelectorAll<HTMLButtonElement>('.tarot-fan-card'));
    fanCards.forEach((btn) => (btn.disabled = false));
    pickStatus.textContent = UI_TEXT.pickPrompt(remaining);
    fanCards[Math.floor(FAN_CARD_COUNT / 2)]?.focus({ preventScroll: true });

    fan.onclick = (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('.tarot-fan-card');
      if (!btn || btn.disabled || btn.getAttribute('aria-pressed') === 'true' || remaining === 0) return;
      btn.setAttribute('aria-pressed', 'true');
      btn.disabled = true;
      remaining--;
      if (remaining > 0) {
        pickStatus.textContent = UI_TEXT.pickPrompt(remaining);
        return;
      }
      fanCards.forEach((b) => (b.disabled = true));
      fan.onclick = null;
      void submit(run, spread, question);
    };
  }

  // ---------- 送出請求 ----------

  async function submit(run: number, spread: SpreadId, question: string) {
    pending = true;
    pickStatus.textContent = UI_TEXT.waiting;
    fan.classList.add('is-waiting');
    waiting.hidden = false;

    const result = await requestReading(spread, question);
    if (run !== runId) return;
    pending = false;
    waiting.hidden = true;

    if (result.kind === 'care') {
      show('care');
      return;
    }
    if (result.kind === 'error') {
      track('tarot_reading_error', { error: result.code ?? 'UNKNOWN' });
      const entry = result.code ? ERROR_MESSAGES[result.code] : null;
      errorMessage.textContent = entry?.message ?? GENERIC_ERROR;
      retryBtn.hidden = !entry?.retry;
      show('error');
      return;
    }
    track('tarot_reading_success', { spread, has_question: question !== '' });
    await renderResult(run, result.data);
  }

  async function requestReading(spread: SpreadId, question: string): Promise<ApiResult> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CLIENT_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(READING_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spread, question }),
        signal: controller.signal,
      });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        // body 非 JSON（nginx 設定遺漏、本機無 nginx 等）→ 依狀態碼降級
      }
      if (body && typeof body === 'object') {
        const data = body as Record<string, unknown>;
        if (data.ok === true && data.care === true) return { kind: 'care' };
        if (data.ok === true && isValidReading(data, spread)) return { kind: 'reading', data: data as unknown as ReadingResponse };
        if (data.ok === false && isErrorCode(data.error)) return { kind: 'error', code: data.error };
      }
      if (res.status === 413) return { kind: 'error', code: 'PAYLOAD_TOO_LARGE' };
      if (res.status === 429) return { kind: 'error', code: 'RATE_LIMITED' };
      return { kind: 'error', code: null };
    } catch {
      // 逾時 → AI_FAILED（含重試鈕）；其他網路錯誤 → 通用錯誤
      return { kind: 'error', code: controller.signal.aborted ? 'AI_FAILED' : null };
    } finally {
      window.clearTimeout(timer);
    }
  }

  function isValidReading(data: Record<string, unknown>, spread: SpreadId): boolean {
    const cards = data.cards as ReadingResponse['cards'] | undefined;
    const reading = data.reading as ReadingResponse['reading'] | undefined;
    const n = SPREADS[spread].positions.length;
    return (
      Array.isArray(cards) && cards.length === n && cards.every((c) => getCard(c?.id)) &&
      !!reading && Array.isArray(reading.cards) && reading.cards.length === n &&
      typeof reading.summary === 'string' && typeof reading.advice === 'string'
    );
  }

  // ---------- result：依序翻牌＋逐段淡入 ----------

  const SUIT_SYMBOL: Record<string, string> = { wands: '♣', cups: '♥', swords: '♠', pentacles: '♦' };
  const RANK_LABEL = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'Kn', 'Q', 'K'];

  function toRoman(n: number): string {
    if (n === 0) return '0';
    const table: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let out = '';
    for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
    return out;
  }

  function cardNumeral(card: TarotCard): string {
    const n = parseInt(card.id.split('-')[1], 10);
    return card.arcana === 'major' ? toRoman(n) : RANK_LABEL[n - 1] ?? '';
  }

  function buildCard(entry: ReadingResponse['cards'][number], single: boolean): HTMLElement {
    const card = getCard(entry.id)!;
    const node = cardTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
    const set = (sel: string, text: string) => {
      const el = node.querySelector<HTMLElement>(sel);
      if (el) el.textContent = text;
    };
    node.classList.toggle('is-single', single);
    set('[data-position]', entry.position);
    set('[data-numeral]', cardNumeral(card));
    set('[data-symbol]', card.suit ? SUIT_SYMBOL[card.suit] : '✦');
    set('[data-face-name]', card.nameZh);
    set('[data-name-zh]', card.nameZh);
    set('[data-name-en]', card.nameEn);
    set('[data-orientation]', entry.reversed ? UI_TEXT.reversed : UI_TEXT.upright);
    const orientation = node.querySelector<HTMLElement>('[data-orientation]')!;
    orientation.className += entry.reversed
      ? ' bg-[#2E2A4F]/10 text-[#2E2A4F] dark:bg-[#FCE794]/20 dark:text-[#FCE794]'
      : ' bg-[#80A9D4]/15 text-[#4f7fae] dark:bg-[#8FB8E8]/20 dark:text-[#8FB8E8]';
    node.querySelector('[data-face]')!.classList.toggle('is-reversed', entry.reversed);
    node.querySelector('[data-flip]')!.setAttribute(
      'aria-label',
      `${entry.position}：${card.nameZh} ${card.nameEn}（${entry.reversed ? UI_TEXT.reversed : UI_TEXT.upright}）`,
    );
    node.querySelector('[data-flip]')!.setAttribute('role', 'img');
    return node;
  }

  function readingBlock(title: string, text: string, highlight = false): HTMLElement {
    const box = document.createElement('div');
    box.className = highlight
      ? 'tarot-fade rounded-3xl p-5 sm:p-7 border-2 border-[#FCE794] bg-[#FCE794]/20 dark:bg-[#FCE794]/10'
      : 'tarot-fade rounded-3xl p-5 sm:p-7 bg-white/95 dark:bg-[#231f40]/95 border border-gray-200/80 dark:border-white/20 shadow-sm';
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
    const single = data.cards.length === 1;
    resultTitle.textContent = SPREADS[data.spread].name;
    resultCards.replaceChildren(...data.cards.map((c) => buildCard(c, single)));
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
        const card = getCard(c.id)!;
        const label = `${c.position}・${card.nameZh}${c.reversed ? `（${UI_TEXT.reversed}）` : ''}`;
        return readingBlock(single ? card.nameZh + (c.reversed ? `（${UI_TEXT.reversed}）` : '') : label, data.reading.cards[i]);
      }),
      ...(single ? [] : [readingBlock(UI_TEXT.summaryTitle, data.reading.summary)]),
      readingBlock(UI_TEXT.adviceTitle, data.reading.advice, true),
    ];
    // 單張牌陣：summary 併入該牌解讀後方，避免兩段重複標題
    if (single) blocks[0].querySelector('p')!.textContent += `\n\n${data.reading.summary}`;
    blocks[0].querySelector('p')!.classList.add('whitespace-pre-line');

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
