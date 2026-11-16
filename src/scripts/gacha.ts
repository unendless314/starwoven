import {
  CAPTURED_CODE_KEY,
  CODE_MAX_LENGTH,
  DEMO_ONCE_RESULT_KEY,
  PRIZES,
  PUBLIC_RESULTS_KEY,
  REDEEM_TIMEOUT_MS,
  type GachaResult,
} from '../lib/gacha/config';
import { ERROR_MESSAGES, GENERIC_ERROR, UI_TEXT } from '../lib/gacha/copy';

const API_URL = import.meta.env.PUBLIC_GACHA_API_URL || '';
const MODE = API_URL ? 'live' : 'demo';
const LINEAR_CODE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
const DEMO_POOL = PRIZES.filter((prize) => prize !== '塔羅占卜');

const CONFETTI_COLORS = [
  'var(--color-star-gold)',
  '#F3D9E4',
  '#B3D2EA',
  '#C4B4DC',
  '#A8D8CC',
  '#EFC09C',
  'var(--color-accent-blue)',
];

type Step = 'setup' | 'ritual' | 'result' | 'error';

interface ApiResponse {
  status?: string;
  code?: string;
  draw_id?: unknown;
  prize?: unknown;
  code_type?: unknown;
  repeated?: unknown;
}

interface StoredResult extends GachaResult {
  code: string;
}

class RedeemError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const root = document.querySelector<HTMLElement>('[data-gacha-root]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const form = $<HTMLFormElement>('#gacha-form');
  const input = $<HTMLInputElement>('#gacha-code');
  const submitButton = $<HTMLButtonElement>('[data-submit]');
  const resultPrize = $('[data-result-prize]');
  const resultId = $('[data-result-id]');
  const resultRepeated = $('[data-result-repeated]');
  const resultPublic = $('[data-result-public]');
  const errorMessage = $('[data-error-message]');
  const retryButton = $<HTMLButtonElement>('[data-action="retry"]');
  const copyLabel = $('[data-copy-label]');
  const ritualMachine = $('[data-gacha-ritual-machine]');
  const resultCard = $('[data-result-card]');
  const confettiBox = $('[data-confetti]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pending = false;
  let runId = 0;
  let lastCode = '';
  let currentResult: GachaResult | null = null;

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 0 : ms));

  function show(step: Step, focus = true) {
    for (const element of steps) element.hidden = element.dataset.step !== step;
    const active = steps.find((element) => element.dataset.step === step);
    if (focus && active) {
      active.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      const heading = active.querySelector<HTMLElement>('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
  }

  function setPending(value: boolean) {
    pending = value;
    input.disabled = value;
    submitButton.disabled = value;
  }

  function reset() {
    runId++;
    setPending(false);
    currentResult = null;
    lastCode = '';
    input.value = '';
    input.removeAttribute('aria-invalid');
    copyLabel.textContent = UI_TEXT.copyButton;
    show('setup');
    input.focus({ preventScroll: true });
  }

  function showError(code: string) {
    const entry = ERROR_MESSAGES[code];
    errorMessage.textContent = entry?.message ?? GENERIC_ERROR;
    retryButton.hidden = !entry?.retry;
    setPending(false);
    show('error');
    track('gacha_redeem_error', { error: code || 'UNKNOWN', mode: MODE });
  }

  function showResult(result: GachaResult, restored = false) {
    const celebrate = !restored && !result.repeated;
    currentResult = result;
    resultCard.classList.toggle('is-quick', !celebrate);
    resultCard.classList.toggle('is-celebrating', celebrate);
    confettiBox.replaceChildren();
    if (celebrate && !reducedMotion) launchConfetti();
    resultPrize.textContent = result.prize;
    resultId.textContent = result.drawId;
    resultPublic.hidden = result.codeType !== '公開';
    resultRepeated.hidden = !result.repeated && !restored;
    resultRepeated.textContent = restored ? UI_TEXT.restored : UI_TEXT.repeated;
    copyLabel.textContent = UI_TEXT.copyButton;
    setPending(false);
    show('result');
  }

  function launchConfetti() {
    const random = (min: number, max: number) => min + Math.random() * (max - min);
    const pieces = Array.from({ length: 44 }, (_, i) => {
      const piece = document.createElement('i');
      const kind = i % 5;
      if (kind === 3) piece.className = 'is-round';
      if (kind === 4) {
        piece.className = 'is-star';
        piece.textContent = '✦';
      }
      const angle = random(-Math.PI, 0);
      const power = random(5, 13);
      piece.style.setProperty('--c', CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
      piece.style.setProperty('--x', `${(Math.cos(angle) * power * 1.4).toFixed(2)}rem`);
      piece.style.setProperty('--y', `${(Math.sin(angle) * power).toFixed(2)}rem`);
      piece.style.setProperty('--fall', `${random(12, 20).toFixed(2)}rem`);
      piece.style.setProperty('--r', `${Math.round(random(-720, 720))}deg`);
      piece.style.setProperty('--delay', `${random(1, 1.25).toFixed(2)}s`);
      return piece;
    });
    confettiBox.replaceChildren(...pieces);
  }

  async function redeem(code: string) {
    const run = ++runId;
    if (pending) return;
    lastCode = code;
    setPending(true);
    ritualMachine.classList.remove('is-revealing');
    ritualMachine.classList.add('is-spinning');
    show('ritual');
    track('gacha_start', { mode: MODE });

    try {
      const [result] = await Promise.all([
        API_URL ? liveRedeem(code) : demoRedeem(code),
        wait(1600),
      ]);
      if (run !== runId) return;
      if (result.codeType === '公開') savePublicResult(code, result);
      if (!API_URL && code === 'ONCE') saveDemoOnceResult(code, result);
      // 結果已確定並保存後才播放揭曉動畫；動畫期間按下重新輸入不影響結果。
      ritualMachine.classList.remove('is-spinning');
      ritualMachine.classList.add('is-revealing');
      await wait(1750);
      if (run !== runId) return;
      track('gacha_redeem_success', {
        code_type: result.codeType,
        repeated: result.repeated,
        mode: MODE,
      });
      showResult(result);
    } catch (error) {
      if (run !== runId) return;
      showError(error instanceof RedeemError ? error.code : 'INTERNAL_ERROR');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending) return;
    const code = normalizeCode(input.value);
    input.value = code;
    if (!LINEAR_CODE.test(code)) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');

    const stored = findStoredResult(PUBLIC_RESULTS_KEY, code);
    if (stored?.codeType === '公開') {
      lastCode = code;
      track('gacha_result_restore', { mode: MODE });
      showResult(stored, true);
      return;
    }
    const demoOnce = !API_URL && code === 'ONCE' ? findStoredResult(DEMO_ONCE_RESULT_KEY, code) : null;
    if (demoOnce) {
      lastCode = code;
      showResult({ ...demoOnce, repeated: true });
      return;
    }
    void redeem(code);
  });

  input.addEventListener('input', () => {
    const cursor = input.selectionStart;
    input.value = normalizeCode(input.value);
    if (cursor !== null) input.setSelectionRange(cursor, cursor);
    input.removeAttribute('aria-invalid');
  });

  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const demoCode = target.closest<HTMLElement>('[data-demo-code]')?.dataset.demoCode;
    if (demoCode && !pending) {
      input.value = demoCode;
      input.removeAttribute('aria-invalid');
      input.focus();
      return;
    }

    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'reset') reset();
    if (action === 'retry' && lastCode && !pending) void redeem(lastCode);
    if (action === 'copy' && currentResult) void copyDrawId(currentResult.drawId);
  });

  async function copyDrawId(drawId: string) {
    try {
      if (!navigator.clipboard) throw new Error('CLIPBOARD_UNAVAILABLE');
      await navigator.clipboard.writeText(drawId);
      copyLabel.textContent = UI_TEXT.copied;
    } catch {
      copyLabel.textContent = UI_TEXT.copyFailed;
    }
  }

  const capturedCode = consumeCapturedCode();
  if (capturedCode) {
    input.value = capturedCode;
    const stored = findStoredResult(PUBLIC_RESULTS_KEY, capturedCode);
    const demoOnce = !API_URL && capturedCode === 'ONCE' ? findStoredResult(DEMO_ONCE_RESULT_KEY, capturedCode) : null;
    const restored = stored?.codeType === '公開' ? stored : demoOnce;
    if (restored) {
      lastCode = capturedCode;
      track('gacha_result_restore', { mode: MODE });
      showResult({ ...restored, repeated: restored.codeType === '一次性' || restored.repeated }, true);
    }
  }
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().slice(0, CODE_MAX_LENGTH);
}

function consumeCapturedCode(): string {
  const win = window as unknown as { __starwovenGachaCode?: string };
  let code = '';
  try {
    code = sessionStorage.getItem(CAPTURED_CODE_KEY) || '';
    sessionStorage.removeItem(CAPTURED_CODE_KEY);
  } catch {}
  if (!code && win.__starwovenGachaCode) code = win.__starwovenGachaCode;
  delete win.__starwovenGachaCode;
  return normalizeCode(code);
}

function track(event: string, params: Record<string, string | boolean>) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', event, params);
}

let jsonpSeq = 0;
function jsonp<T>(url: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const callback = `__gachaJsonp_${++jsonpSeq}`;
    const win = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      win[callback] = () => {};
      script.remove();
      reject(new RedeemError('TIMEOUT'));
    }, timeoutMs);
    win[callback] = (data: T) => {
      window.clearTimeout(timer);
      delete win[callback];
      script.remove();
      resolve(data);
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      delete win[callback];
      script.remove();
      reject(new RedeemError('NETWORK'));
    };
    script.src = `${url}&callback=${callback}`;
    document.head.appendChild(script);
  });
}

async function liveRedeem(code: string): Promise<GachaResult> {
  const url = `${API_URL}?action=redeem&code=${encodeURIComponent(code)}`;
  const response = await jsonp<ApiResponse>(url, REDEEM_TIMEOUT_MS);
  if (response.status === 'error') throw new RedeemError(response.code || 'INTERNAL_ERROR');
  if (
    response.status !== 'success' ||
    typeof response.draw_id !== 'string' ||
    typeof response.prize !== 'string' ||
    !response.prize ||
    (response.code_type !== '一次性' && response.code_type !== '公開')
  ) {
    throw new RedeemError('INTERNAL_ERROR');
  }
  return {
    drawId: response.draw_id,
    prize: response.prize,
    codeType: response.code_type,
    repeated: response.repeated === true,
  };
}

async function demoRedeem(code: string): Promise<GachaResult> {
  if (code === 'ENDED') throw new RedeemError('INACTIVE_CODE');
  if (code === 'EMPTY') throw new RedeemError('NO_ELIGIBLE_PRIZE');
  if (code !== 'DEMO' && code !== 'ONCE') throw new RedeemError('INVALID_CODE');
  const pool = code === 'ONCE' ? DEMO_POOL : PRIZES;
  return {
    drawId: `DEMO-${randomCode(8)}`,
    prize: pool[randomIndex(pool.length)],
    codeType: code === 'ONCE' ? '一次性' : '公開',
    repeated: false,
  };
}

function randomIndex(length: number): number {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / length) * length;
  do crypto.getRandomValues(values); while (values[0] >= limit);
  return values[0] % length;
}

function randomCode(length: number): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let output = '';
  while (output.length < length) output += alphabet[randomIndex(alphabet.length)];
  return output;
}

function readStorage(key: string): StoredResult[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredResult => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Record<string, unknown>;
      return (
        typeof value.code === 'string' &&
        typeof value.drawId === 'string' &&
        typeof value.prize === 'string' &&
        (value.codeType === '一次性' || value.codeType === '公開') &&
        typeof value.repeated === 'boolean'
      );
    });
  } catch {
    return [];
  }
}

function findStoredResult(key: string, code: string): StoredResult | null {
  return readStorage(key).find((result) => result.code === code) ?? null;
}

function writeStoredResult(key: string, code: string, result: GachaResult) {
  try {
    const results = readStorage(key).filter((item) => item.code !== code);
    results.unshift({ code, ...result });
    localStorage.setItem(key, JSON.stringify(results.slice(0, 10)));
  } catch {}
}

function savePublicResult(code: string, result: GachaResult) {
  writeStoredResult(PUBLIC_RESULTS_KEY, code, result);
}

function saveDemoOnceResult(code: string, result: GachaResult) {
  writeStoredResult(DEMO_ONCE_RESULT_KEY, code, result);
}
