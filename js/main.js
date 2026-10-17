/* Start-up: draw the shell, then load. Supabase mode waits for the owner session and does not
   mix this browser's LocalStorage prototypes into the live list. `?source=local` still does. */
let loadGen = 0, kbLoaded = false;

function showLocked() {
  loadGen++;
  kbLoaded = false;
  CATS = [];
  S.entries = [];
  S.sel = null;
  C.view = 'all';
  C.cat = null;
  authRenderHeader();
  renderSide();
  const el = $('#detail');
  if (el) el.innerHTML = `<div class="c-page-wrap">${emptyHtml('ti-lock', '請先登入', '登入後才能閱讀這份知識庫。')}</div>`;
}

async function loadKb() {
  const gen = ++loadGen;
  const el = $('#detail');
  if (el) el.innerHTML = `<div class="loading"><div class="spin"></div>載入中…</div>`;
  try {
    const db = await KBData.load();
    if (gen !== loadGen) return;
    CATS = db.categories.map(c => ({ ...c }));
    S.entries = KBData.id === 'local' ? [...LocalStore.list(), ...db.entries] : [...db.entries];
    kbLoaded = true;
  } catch (err) {
    if (gen !== loadGen) return;
    if (KBData.id === 'supabase' && (!KBData.auth.session() || err.message === 'not signed in')) { showLocked(); return; }
    const hint = KBData.id === 'supabase' ? '請檢查 js/config.js 的設定、Supabase 專案狀態與網路連線。' : '請透過本機網頁伺服器開啟（見 README），不要直接用檔案方式開啟。';
    if (el) el.innerHTML = `<div class="c-page-wrap">${emptyHtml('ti-database-off', '資料載入失敗', esc(err.message || String(err)) + '<br>' + hint)}</div>`;
    return;
  }
  if (gen !== loadGen) return;
  authRenderHeader();
  renderSide();
  afterLoad();
}

async function boot() {
  $('#root').innerHTML = appMarkup();
  KBH.wireSearch();
  wireUi();
  if (KBData.id === 'supabase' && KBData.auth && !KBData.auth.session()) { showLocked(); return; }
  await loadKb();
}

if (KBData.id === 'supabase' && KBData.auth) {
  KBData.auth.onChange(session => { if (!session) showLocked(); else if (!kbLoaded) loadKb(); });
}

boot();
