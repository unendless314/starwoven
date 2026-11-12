// ==========================================
// 星靈出攤（首頁出攤公告）互動邏輯（規格書 demo_docs/booth_plan.md）
// - 由 index.astro 以頁面層級 <script> 引入（全頁一份）
// - 「星靈出攤」試算表＋Apps Script 為唯一資料來源（只讀，JSONP）；SSR 不寫死任何活動
// - 卡片一律 clone 自 <template id="booth-card-template">；依活動數 3／2／1／0 自動排版
// - 0 場、載入失敗、未設定 PUBLIC_BOOTH_API_URL 皆顯示提示卡 #booth-empty（對訪客靜默）；
//   失敗原因記錄於主控台與 GA4 `booth_load_error`，容器 data-booth-state 標示目前狀態
// ==========================================

const API_URL = import.meta.env.PUBLIC_BOOTH_API_URL || '';
const TIMEOUT_MS = 12000; // Apps Script 冷啟動偶有 10 秒級延遲
const MAX_EVENTS = 3;

// 欄數與資訊列排版：以完整 class 字串常駐於此，確保 Tailwind v4 內容掃描收進 CSS bundle
const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
};
const INFO_STACKED = 'mt-2 flex flex-col gap-1';
const INFO_INLINE = 'mt-2 flex flex-row flex-wrap gap-x-5 gap-y-1';
// 懸停效果僅套用於帶 href 之卡片
const LINK_CARD_CLASSES =
  'cursor-pointer hover:border-[#80A9D4]/55 dark:hover:border-white/30 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#80A9D4]';

type BoothState = 'loading' | 'ok' | 'empty' | 'error';
type FailReason = 'timeout' | 'network' | 'bad_response' | 'no_api_url';

interface BoothEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  url: string;
}

// JSONP 傳輸（DEC-067）：複製自 wishlist.ts，callback 前綴改為 __boothJsonp_；
// 刻意不從許願池 import，避免動到已穩定之許願池程式（booth_plan.md 第五節第 5 小節）。
// 逾時後保留 noop 回呼讓遲到的回應靜默落地，成功／失敗時才清除。
let jsonpSeq = 0;
function jsonp<T>(url: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const cb = `__boothJsonp_${++jsonpSeq}`;
    const win = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      win[cb] = () => {};
      script.remove();
      reject(new Error('JSONP_TIMEOUT'));
    }, timeoutMs);
    win[cb] = (data: T) => {
      window.clearTimeout(timer);
      delete win[cb];
      script.remove();
      resolve(data);
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      delete win[cb];
      script.remove();
      reject(new Error('JSONP_ERROR'));
    };
    script.src = `${url}&callback=${cb}`;
    document.head.appendChild(script);
  });
}

function gtagEvent(name: string, params: Record<string, string>) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', name, params);
}

// 前端再驗證一次：只接受 http(s) 協定
function safeUrl(raw: string): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function normalize(raw: unknown): BoothEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title);
  if (!title) return null;
  return { title, date: str(r.date), time: str(r.time), location: str(r.location), url: str(r.url) };
}

function initBooth() {
  const grid = document.querySelector<HTMLElement>('[data-booth-grid]');
  const template = document.getElementById('booth-card-template') as HTMLTemplateElement | null;
  const empty = document.getElementById('booth-empty');
  if (!grid || !template || !empty) return;

  function setState(state: BoothState) {
    grid!.dataset.boothState = state;
  }

  function clearSkeleton() {
    grid!.querySelectorAll('[data-booth-skeleton]').forEach((el) => el.remove());
  }

  function showEmpty(state: 'empty' | 'error') {
    clearSkeleton();
    grid!.hidden = true;
    empty!.hidden = false;
    setState(state);
  }

  function fail(reason: FailReason, code = '') {
    console.warn('[booth] load failed:', reason, code);
    gtagEvent('booth_load_error', { reason, code });
    showEmpty('error');
  }

  function buildCard(ev: BoothEvent, single: boolean): HTMLElement {
    const frag = template!.content.cloneNode(true) as DocumentFragment;
    const card = frag.querySelector<HTMLAnchorElement>('[data-booth-card]')!;

    card.querySelector('[data-booth-title]')!.textContent = ev.title;

    const info = card.querySelector<HTMLElement>('[data-booth-info]')!;
    info.className = single ? INFO_INLINE : INFO_STACKED;
    (['date', 'time', 'location'] as const).forEach((key) => {
      const row = info.querySelector<HTMLElement>(`[data-booth-row="${key}"]`)!;
      if (ev[key]) {
        row.querySelector('[data-booth-text]')!.textContent = ev[key];
      } else {
        row.remove(); // 留空 → 整行不顯示
      }
    });
    if (!info.children.length) info.remove();

    const url = safeUrl(ev.url);
    const more = card.querySelector<HTMLElement>('[data-booth-more]')!;
    if (url) {
      card.href = url.href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.className += ` ${LINK_CARD_CLASSES}`;
      more.hidden = false;
      card.addEventListener('click', (e) => {
        // 只送網域，不送完整網址（隱私與高基數報表考量）
        gtagEvent('booth_link_click', { booth_title: ev.title, destination_host: url.hostname });
        // 阻止冒泡至 GoogleAnalytics.astro 之 document 層級外連監聽：該監聽以子字串比對
        // line.me 等網域，命中時會以完整 href 送出 destination，違反「只送網域」原則。
        // 只停止冒泡、不 preventDefault，連結照常另開新分頁。
        e.stopPropagation();
      });
    } else {
      more.remove();
    }
    return card;
  }

  function render(events: BoothEvent[]) {
    clearSkeleton();
    if (!events.length) {
      showEmpty('empty'); // 正常狀態，不記錄為失敗
      return;
    }
    grid!.className = `${grid!.className} ${GRID_COLS[events.length]}`;
    const single = events.length === 1;
    events.forEach((ev) => grid!.appendChild(buildCard(ev, single)));
    setState('ok');
  }

  setState('loading');

  if (!API_URL) {
    fail('no_api_url');
    return;
  }

  jsonp<{ status?: string; code?: string; data?: unknown }>(`${API_URL}?action=get_all`, TIMEOUT_MS)
    .then((res) => {
      if (!res || res.status !== 'success' || !Array.isArray(res.data)) {
        fail('bad_response', res && typeof res.code === 'string' ? res.code : '');
        return;
      }
      const events = res.data
        .slice(0, MAX_EVENTS)
        .map(normalize)
        .filter((ev): ev is BoothEvent => ev !== null);
      render(events);
    })
    .catch((err: unknown) => {
      fail(err instanceof Error && err.message === 'JSONP_TIMEOUT' ? 'timeout' : 'network');
    });
}

initBooth();
