// ==========================================
// 課程許願池互動邏輯（由 wishlist.astro 以頁面層級 <script> 引入，全頁一份）
// - Google 試算表為唯一資料來源：進站 get_all 同步課程名稱、講師、課程時數、預定價格、圖示、配色、票數、門檻與卡片排序
// - G 欄 status 為手動下架開關：「已結束」＝卡片隱藏下架（清空即恢復）、「已開課」＝卡片保留但停止投票
// - 一票綁定「編號＋課名」：localStorage 記住的是課名，改名即新課、所有人可重新許願
// - SSR 不寫死課程：首屏為骨架卡（data-wish-skeleton），同步成功後全部卡片 clone 自
//   wishlist.astro 的 <template id="wish-card-template"> 動態建立（單一版型來源）；
//   API 失敗且頁面尚無卡片時顯示 #wish-error 錯誤區塊
// - 未設定 PUBLIC_WISHLIST_API_URL 時為純前端 Demo 模式（DEMO_COURSES 示範資料＋localStorage 模擬計票）
// ==========================================
  const API_URL = import.meta.env.PUBLIC_WISHLIST_API_URL || '';
  const CLIENT_KEY = 'starwoven_client_id';
  const DEMO_KEY = 'starwoven_wish_demo_votes';
  const voteKey = (id: string) => `starwoven_wish_${id}`;

  // 配色白名單（L 欄鍵值 → Tailwind 漸層，共 8 色）：
  // 以完整 class 字串常駐於此，Tailwind v4 自動內容掃描保證收進 CSS bundle
  const STYLE_MAP: Record<string, string> = {
    pink: 'from-[#F3D9E4] to-[#E3B7CC]',
    blue: 'from-[#D9E9F6] to-[#B3D2EA]',
    teal: 'from-[#D5EDE7] to-[#A8D8CC]',
    purple: 'from-[#E4DDF0] to-[#C4B4DC]',
    gold: 'from-[#FBEBC8] to-[#F5D98D]',
    orange: 'from-[#F8E0CD] to-[#EFC09C]',
    sage: 'from-[#E2EBD8] to-[#C3D9B5]',
    sand: 'from-[#EFE9E1] to-[#DDD2C4]',
  };

  // get_all 回傳的單列課程資料（對應試算表 A~L 欄；duration 為 I 欄、price 為 J 欄自由文字）
  interface SheetRow {
    id: string | number;
    name?: string;
    total_votes?: number;
    threshold?: number;
    status?: string;
    teacher?: string;
    duration?: string;
    price?: string;
    icon?: string;
    style?: string;
  }

  // Demo 模式示範課程（僅未設定 API 網址時使用；內容為示意，不與試算表同步）
  const DEMO_COURSES: SheetRow[] = [
    { id: '1', name: '托特塔羅・高階解盤專題', teacher: '學長老師', duration: '6 堂 × 2 小時', total_votes: 7, threshold: 10, icon: '🃏', style: 'pink' },
    { id: '2', name: '阿卡西靈魂藍圖深度工作坊', teacher: '古古老師', duration: '2 日密集工作坊', total_votes: 3, threshold: 8, icon: '📖', style: 'blue' },
    { id: '3', name: '臼井靈氣三階・大師班', teacher: '學長老師', duration: '3 階共 24 小時', total_votes: 11, threshold: 12, icon: '👐', style: 'teal' },
    { id: '4', name: '占星合盤・關係星圖對話', teacher: '皮皮老師', duration: '4 堂 × 1.5 小時', total_votes: 5, threshold: 10, icon: '💫', style: 'purple' },
    { id: '5', name: '金錢靈氣・豐盛顯化工作坊', teacher: '黎夢老師', duration: '單日 6 小時', total_votes: 9, threshold: 10, icon: '🪙', style: 'gold' },
    { id: '6', name: '生命靈數・流年藍圖專題', teacher: '皮皮老師', duration: '4 堂 × 2 小時', total_votes: 2, threshold: 8, icon: '🔢', style: 'orange' },
  ];

  // G 欄 status 手動下架開關（須與試算表填寫值完全一致）：
  // 已結束＝卡片隱藏下架（清空即恢復）；已開課＝卡片保留但停止投票；其他值視同募集中
  const STATUS_OPENED = '已開課';
  const STATUS_ENDED = '已結束';

  let sessionClientId: string | null = null;

  function generateUUID(): string {
    return (
      (crypto.randomUUID && crypto.randomUUID()) ||
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (Math.random() * 16) | 0;
        return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      })
    );
  }

  function getClientId(): string {
    try {
      let cid = localStorage.getItem(CLIENT_KEY);
      if (!cid) {
        cid = generateUUID();
        localStorage.setItem(CLIENT_KEY, cid);
      }
      return cid;
    } catch {
      // localStorage 停用時改用本頁面工作階段的隨機 UUID，
      // 避免無儲存權限的訪客共用固定 ID，在後端被視為同一人而互相擋票
      if (!sessionClientId) sessionClientId = generateUUID();
      return sessionClientId;
    }
  }

  function readVotes(card: HTMLElement): number {
    return parseInt(card.dataset.votes || '0', 10) || 0;
  }

  function setText(card: HTMLElement, selector: string, text: string) {
    const el = card.querySelector<HTMLElement>(selector);
    if (el) el.textContent = text;
  }

  function renderCard(card: HTMLElement, animate = false) {
    const votes = readVotes(card);
    const threshold = parseInt(card.dataset.threshold || '1', 10) || 1;
    const reached = votes >= threshold;

    const fill = card.querySelector<HTMLElement>('.wish-bar-fill');
    if (fill) {
      fill.style.width = `${Math.min(100, (votes / threshold) * 100)}%`;
      fill.classList.toggle('bg-[#58A497]', reached);
      fill.classList.toggle('bg-[#F5A623]', !reached);
    }

    const progress = card.querySelector<HTMLElement>('.wish-progress-text');
    if (progress) progress.textContent = `${votes} / ${threshold}`;

    const pill = card.querySelector<HTMLElement>('.wish-pill-count');
    if (pill) {
      pill.textContent = String(votes);
      if (animate) {
        pill.classList.remove('wish-pop');
        void pill.offsetWidth;
        pill.classList.add('wish-pop');
      }
    }

    const tag = card.querySelector<HTMLElement>('.wish-reached');
    if (tag) tag.classList.toggle('hidden', !reached);
  }

  type BtnState = 'default' | 'pending' | 'voted' | 'retry' | 'closed';

  function setBtn(card: HTMLElement, state: BtnState) {
    const btn = card.querySelector<HTMLButtonElement>('.wish-btn');
    const label = card.querySelector<HTMLElement>('.wish-btn-label');
    if (!btn || !label) return;
    btn.classList.remove('is-pending', 'is-voted', 'is-retry', 'is-closed');
    // 以 disabled 屬性鎖定，同時阻擋滑鼠、觸控與鍵盤（Enter/Space）觸發
    btn.disabled = state === 'pending' || state === 'voted' || state === 'closed';
    if (state === 'pending') {
      btn.classList.add('is-pending');
      label.textContent = '✦ 許願傳送中…';
    } else if (state === 'voted') {
      btn.classList.add('is-voted');
      label.textContent = '✓ 已成功許願';
    } else if (state === 'retry') {
      btn.classList.add('is-retry');
      label.textContent = '連線稍候，點此重試';
    } else if (state === 'closed') {
      btn.classList.add('is-closed');
      label.textContent = '✓ 已開課';
    } else {
      label.textContent = '✦ 我想一起';
    }
  }

  // 「認名字」已許願判定：localStorage 存的是課名，儲存值 === 卡片當前課名才算投過
  // 格子重用（同編號換新課名）時自動失效，所有人可對新課重新許願
  function hasVoted(card: HTMLElement): boolean {
    const current = card.dataset.courseName || '';
    if (!current) return false;
    try {
      return localStorage.getItem(voteKey(card.dataset.courseId || '')) === current;
    } catch {
      return false;
    }
  }

  // 依卡片當前課名重新判定已許願狀態（三個時機之一：初始化／get_all 課名更新後）
  function refreshVotedState(card: HTMLElement) {
    // 投票進行中不插手：交由回應抵達時的課名比對處理
    if (card.dataset.pending === '1') return;
    if (hasVoted(card)) {
      card.dataset.voted = '1';
      setBtn(card, 'voted');
    } else if (card.dataset.voted === '1') {
      // 改名 = 新課：清除記憶體旗標、按鈕解鎖回預設態，開放對新課許願
      //（localStorage 中的舊課名紀錄留作無害殘留，不主動清除）
      delete card.dataset.voted;
      setBtn(card, 'default');
    }
  }

  // G 欄 status 手動下架開關：已結束＝隱藏（清空即恢復上架）；已開課＝保留卡片但停止投票；
  // 其他值（含空白）＝募集中。卡片 display 統一由此管理（syncFromSheet 不再直接還原顯示）
  function applyStatus(card: HTMLElement) {
    const status = card.dataset.wishStatus || '';
    if (status === STATUS_ENDED) {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';
    if (status === STATUS_OPENED) {
      card.querySelector<HTMLElement>('.wish-reached')?.classList.add('hidden');
      setBtn(card, 'closed');
      return;
    }
    // 募集中：若先前為已開課，需還原達標標籤與按鈕正確態
    delete card.dataset.wishStatus;
    if (card.dataset.pending === '1') return; // 投票進行中不插手
    renderCard(card); // 還原「達標」標籤（已開課期間被隱藏）
    if (hasVoted(card) || card.dataset.voted === '1') {
      card.dataset.voted = '1';
      setBtn(card, 'voted');
    } else {
      delete card.dataset.voted;
      setBtn(card, 'default');
    }
  }

  function trackWish(id: string, name: string, mode: string) {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'course_wish_click', { course_id: id, course_name: name, mode });
    }
  }

  // 配色替換：先移除白名單全部漸層，再加上新鍵值對應者
  // 鍵值不在白名單 → 既有卡片保留原樣（新卡片由 createCard 先決定預設鍵值 blue）
  function applyStyle(card: HTMLElement, key: string) {
    const next = STYLE_MAP[key];
    if (!next) return;
    const hero = card.querySelector<HTMLElement>('[data-wish-hero]');
    if (!hero) return;
    Object.values(STYLE_MAP).forEach((cls) => cls.split(' ').forEach((c) => hero.classList.remove(c)));
    next.split(' ').forEach((c) => hero.classList.add(c));
  }

  // 既有卡片內容同步（既有卡片：空字串欄位保留原值不覆寫）
  function updateCardContent(card: HTMLElement, row: SheetRow) {
    // 門檻：正整數才採用，不受票數守衛限制
    const th = Number(row.threshold);
    if (Number.isFinite(th) && th > 0) card.dataset.threshold = String(th);

    // 課名：有更新時同步寫入 data-course-name（卡片當前課名的唯一來源）
    const name = typeof row.name === 'string' ? row.name : '';
    const nameChanged = !!name && name !== (card.dataset.courseName || '');
    if (nameChanged) {
      setText(card, '.wish-title', name);
      card.dataset.courseName = name;
    }
    if (typeof row.teacher === 'string' && row.teacher) setText(card, '.wish-teacher', row.teacher);
    // 課程時數／預定價格：非空才更新並顯示整行（既有卡片空字串保留原值不覆寫）；
    // hidden 掛在整行 <p> 上，顯示時切換父層
    if (typeof row.duration === 'string' && row.duration) {
      const durationEl = card.querySelector<HTMLElement>('.wish-duration');
      if (durationEl) {
        durationEl.textContent = row.duration;
        durationEl.closest('p')?.classList.remove('hidden');
      }
    }
    if (typeof row.price === 'string' && row.price) {
      const priceEl = card.querySelector<HTMLElement>('.wish-price');
      if (priceEl) {
        priceEl.textContent = row.price;
        priceEl.closest('p')?.classList.remove('hidden');
      }
    }
    if (typeof row.icon === 'string' && row.icon) setText(card, '.wish-icon', row.icon);

    applyStyle(card, String(row.style || ''));

    // 認名字：課名更新後重新判定；改名解鎖後視為新課，票數恢復正常同步
    if (nameChanged) refreshVotedState(card);

    // 票數守衛（DEC-036）：pending／voted 中的卡片不覆寫票數。
    // 例外：本次同步已換課名（改名即新課）——畫面上的 pending 樂觀 +1 屬於舊課，
    // 對新課無意義，直接套用新課票數；稍後抵達的舊投票回應走課名不符路徑，
    // 本就不回填票數，兩者不衝突
    if (typeof row.total_votes === 'number') {
      if (nameChanged || (card.dataset.pending !== '1' && card.dataset.voted !== '1')) {
        card.dataset.votes = String(row.total_votes);
      }
    }

    renderCard(card);

    // G 欄 status 手動下架開關（須在 renderCard 之後，避免「達標」標籤被重新顯示）
    card.dataset.wishStatus = typeof row.status === 'string' ? row.status.trim() : '';
    applyStatus(card);
  }

  // 動態建立卡片：clone 模板（單一版型來源），再以 textContent 填值（無 HTML 注入風險）
  function createCard(row: SheetRow): HTMLElement | null {
    const tpl = document.querySelector<HTMLTemplateElement>('#wish-card-template');
    if (!tpl || !tpl.content.firstElementChild) return null;
    const card = tpl.content.firstElementChild.cloneNode(true) as HTMLElement;

    card.dataset.courseId = String(row.id);
    card.dataset.courseName = typeof row.name === 'string' ? row.name : '';
    card.dataset.votes = String(typeof row.total_votes === 'number' ? row.total_votes : 0);
    const th = Number(row.threshold);
    card.dataset.threshold = Number.isFinite(th) && th > 0 ? String(th) : '1';

    setText(card, '.wish-title', card.dataset.courseName);
    setText(card, '.wish-teacher', typeof row.teacher === 'string' ? row.teacher : '');
    // 課程時數／預定價格留空 → 整行隱藏（hidden 掛在整行 <p> 上）
    const durationEl = card.querySelector<HTMLElement>('.wish-duration');
    const duration = typeof row.duration === 'string' ? row.duration : '';
    if (durationEl) {
      if (duration) {
        durationEl.textContent = duration;
        durationEl.closest('p')?.classList.remove('hidden');
      } else {
        durationEl.closest('p')?.classList.add('hidden');
      }
    }
    const priceEl = card.querySelector<HTMLElement>('.wish-price');
    const price = typeof row.price === 'string' ? row.price : '';
    if (priceEl) {
      if (price) {
        priceEl.textContent = price;
        priceEl.closest('p')?.classList.remove('hidden');
      } else {
        priceEl.closest('p')?.classList.add('hidden');
      }
    }
    setText(card, '.wish-icon', typeof row.icon === 'string' && row.icon ? row.icon : '✦');

    // 配色：鍵值留空或非法 → 預設 blue
    const styleKey = String(row.style || '');
    applyStyle(card, STYLE_MAP[styleKey] ? styleKey : 'blue');

    // G 欄 status：initCard 前先寫入，initCard 之後才套用（closed 狀態須蓋過 refreshVotedState 的按鈕判定）
    card.dataset.wishStatus = typeof row.status === 'string' ? row.status.trim() : '';

    initCard(card);
    applyStatus(card);
    return card;
  }

  // 首屏骨架卡（SSR 佔位，無課程資料）：首次同步成功時移除
  function removeSkeletons() {
    document.querySelectorAll('[data-wish-skeleton]').forEach((el) => el.remove());
  }

  // 初始載入失敗：僅在頁面尚無任何課程卡片時才顯示錯誤區塊
  //（已有卡片的後續同步失敗屬背景抖動，維持現狀靜默處理）
  function showLoadError() {
    if (document.querySelector('[data-wish-card]')) return;
    removeSkeletons();
    document.getElementById('wish-error')?.classList.remove('hidden');
  }

  // 試算表驅動同步：最終 DOM 順序 = 試算表列順序
  function syncFromSheet(list: SheetRow[]) {
    const grid = document.querySelector<HTMLElement>('[data-wish-grid]');
    if (!grid) return;
    removeSkeletons(); // 首次成功同步：移除首屏骨架卡（重複呼叫無害）
    const seen = new Set<string>();
    list.forEach((row) => {
      if (!row || row.id == null) return;
      const id = String(row.id).trim();
      if (!id) return;
      seen.add(id);
      let card = Array.from(grid.querySelectorAll<HTMLElement>('[data-wish-card]')).find(
        (c) => (c.dataset.courseId || '') === id
      );
      if (card) {
        updateCardContent(card, row);
      } else {
        card = createCard(row) || undefined;
      }
      if (card) {
        // 卡片 display 統一由 applyStatus 管理（updateCardContent／createCard 內已呼叫）：
        // 「已結束」卡片即使仍在清單中也維持隱藏，清空 G 欄重新上架時才還原顯示
        grid.appendChild(card); // 既有節點會被搬移，依列序歸位
      }
    });
    // 不在清單中的卡片 → 隱藏（不刪除，重新出現時可還原）
    grid.querySelectorAll<HTMLElement>('[data-wish-card]').forEach((card) => {
      if (!seen.has(card.dataset.courseId || '')) card.style.display = 'none';
    });
  }

  // 進站與 course_changed 後共用：向試算表拉取最新全量資料
  // 同步請求序號：初始同步與 course_changed 重新同步可能併發，回應順序不保證；
  // 只採用「最後一次發出」的回應，避免較舊回應亂序覆寫較新的課程資料。
  // 12 秒逾時：Apps Script 冷啟動偶有 10 秒級延遲；逾時／格式異常且頁面尚無卡片 → 錯誤區塊
  let syncSeq = 0;
  function refreshFromSheet() {
    const mySeq = ++syncSeq;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    fetch(`${API_URL}?action=get_all`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        window.clearTimeout(timer);
        if (mySeq !== syncSeq) return; // 已有更新的同步請求發出，忽略此過期回應
        if (!d || d.status !== 'success' || !Array.isArray(d.data)) {
          showLoadError(); // 回應格式異常：視同連線失敗
          return;
        }
        syncFromSheet(d.data as SheetRow[]);
      })
      .catch(() => {
        window.clearTimeout(timer);
        if (mySeq !== syncSeq) return;
        showLoadError();
      });
  }

  async function vote(card: HTMLElement) {
    const id = card.dataset.courseId;
    if (!id) return;
    if (card.dataset.wishStatus === STATUS_OPENED) return; // 已開課：停止投票（正常情況按鈕已 disabled）
    // data-voted 為記憶體旗標：即使 localStorage 停用，本頁已投票的卡片也不會重複送票
    if (hasVoted(card) || card.dataset.voted === '1') {
      setBtn(card, 'voted');
      return;
    }
    // 並發防護：pending 期間忽略任何重複觸發（含程式化 click）
    if (card.dataset.pending === '1') return;

    // 樂觀更新：快照投票前票數（供失敗回滾還原）與當下課名（綁定投票版本），立即 +1 並鎖定按鈕
    const before = readVotes(card);
    const snapshotName = card.dataset.courseName || '';
    card.dataset.pending = '1';
    card.dataset.votes = String(before + 1);
    renderCard(card, true);
    setBtn(card, 'pending');

    // Demo 模式：未設定 API 時純前端模擬，票數僅存本機（認名字以示範課程課名為準）
    if (!API_URL) {
      window.setTimeout(() => {
        try {
          localStorage.setItem(voteKey(id), snapshotName);
          const demo = JSON.parse(localStorage.getItem(DEMO_KEY) || '{}') as Record<string, number>;
          demo[id] = (demo[id] || 0) + 1;
          localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
        } catch {}
        delete card.dataset.pending;
        card.dataset.voted = '1';
        setBtn(card, 'voted');
        trackWish(id, snapshotName, 'demo');
      }, 650);
      return;
    }

    // 正式模式：呼叫 Apps Script，8 秒逾時自動斷開
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      const url = `${API_URL}?action=vote&course_id=${encodeURIComponent(id)}&course_name=${encodeURIComponent(snapshotName)}&client_id=${encodeURIComponent(getClientId())}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      window.clearTimeout(timer);

      const status: string = (data && data.status) || '';
      const responseName: string = data && typeof data.course_name === 'string' ? data.course_name : '';

      // 先比對、再分支：回應課名 ≠ 卡片當前課名（等待期間 get_all 已把卡片換成新課）
      // → 視同 course_changed，絕不鎖定新課、不寫記憶
      if (
        status === 'course_changed' ||
        ((status === 'success' || status === 'already_voted') && responseName !== (card.dataset.courseName || ''))
      ) {
        // 課程已換：解除 pending、不鎖定、不寫記憶，重新同步卡片後可對新課許願。
        // 僅當卡片仍停留在舊課（get_all 尚未更新）才回滾樂觀 +1；
        // 卡片已是新課時不回填舊課票數快照，交由重新同步帶入正確票數
        if (snapshotName === (card.dataset.courseName || '')) {
          card.dataset.votes = String(before);
        }
        delete card.dataset.pending;
        renderCard(card);
        setBtn(card, 'default');
        trackWish(id, snapshotName, 'course_changed');
        refreshFromSheet();
        return;
      }

      if (status === 'success') {
        if (typeof data.votes === 'number') {
          card.dataset.votes = String(data.votes);
          renderCard(card);
        }
        try {
          // 只記後端確認過的課名（此處已保證與卡片當前課名一致）
          localStorage.setItem(voteKey(id), responseName);
        } catch {}
        delete card.dataset.pending;
        card.dataset.voted = '1';
        setBtn(card, 'voted');
        trackWish(id, responseName, 'live');
      } else if (status === 'already_voted') {
        // 後端判定此前已投過（本機旗標遺失）：本次不新增票數，還原樂觀更新快照後鎖定
        card.dataset.votes = String(before);
        renderCard(card);
        try {
          localStorage.setItem(voteKey(id), responseName);
        } catch {}
        delete card.dataset.pending;
        card.dataset.voted = '1';
        setBtn(card, 'voted');
        trackWish(id, responseName, 'already_voted');
      } else if (status === 'course_closed') {
        // 等待期間業主已收票（已開課／已結束）：後端拒收，不計票、不記已投、不進重試態。
        // 回滾樂觀 +1，套用後端回報的狀態值，卡片即時轉停投或下架
        delete card.dataset.pending;
        if (snapshotName === (card.dataset.courseName || '')) {
          card.dataset.votes = String(before);
          renderCard(card);
          const closed = typeof data.course_status === 'string' ? data.course_status.trim() : '';
          card.dataset.wishStatus = closed === STATUS_ENDED ? STATUS_ENDED : STATUS_OPENED;
          applyStatus(card);
          trackWish(id, snapshotName, 'course_closed');
        } else {
          // 卡片已被 get_all 換成新課：不回填舊課快照、不鎖定，交由重新同步帶入正確狀態
          renderCard(card);
          setBtn(card, 'default');
          refreshFromSheet();
        }
      } else {
        throw new Error((data && data.code) || 'VOTE_FAILED');
      }
    } catch {
      window.clearTimeout(timer);
      delete card.dataset.pending;
      // 等待期間卡片已被 get_all 換成新課：不回填舊課票數快照、不進重試態，
      // 解除鎖定並重新同步，由新回應帶入新課的正確票數
      if (snapshotName !== (card.dataset.courseName || '')) {
        renderCard(card);
        setBtn(card, 'default');
        refreshFromSheet();
        return;
      }
      // 失敗回滾：還原投票前快照（而非從目前值 -1），解除鎖定，2.5 秒後恢復可重試
      card.dataset.votes = String(before);
      renderCard(card);
      setBtn(card, 'retry');
      window.setTimeout(() => {
        if (!hasVoted(card) && card.dataset.voted !== '1') setBtn(card, 'default');
      }, 2500);
    }
  }

  // 動態卡片共用的初始化：渲染、認名字判定、綁定投票
  function initCard(card: HTMLElement) {
    renderCard(card);
    refreshVotedState(card);
    card.querySelector<HTMLElement>('.wish-btn')?.addEventListener('click', () => vote(card));
  }

  const grid = document.querySelector<HTMLElement>('[data-wish-grid]');
  // 進入條件：有 Grid 容器（SSR 僅骨架卡，課程卡片全部由 JS 動態建立）
  if (grid) {
    // 錯誤區塊的重新整理按鈕
    document.getElementById('wish-error-reload')?.addEventListener('click', () => window.location.reload());

    if (!API_URL) {
      // Demo 模式：以示範課程建卡，並套用本機累積票數，讓重整後票數仍持續累計
      let demo: Record<string, number> = {};
      try {
        demo = JSON.parse(localStorage.getItem(DEMO_KEY) || '{}');
      } catch {}
      syncFromSheet(
        DEMO_COURSES.map((c) => ({
          ...c,
          total_votes: (c.total_votes || 0) + (demo[String(c.id)] || 0),
        }))
      );
    } else {
      // 正式模式：進站時同步試算表最新內容（課程、票數、門檻、排序）
      refreshFromSheet();
    }
  }
