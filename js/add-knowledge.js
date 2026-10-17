/* 新增知識 — Add Knowledge flow.

   A four-step form that produces an entry in the existing knowledge schema:
   content_type, type-specific knowledge / troubleshooting fields, and shared metadata / images.
   Save: with Supabase configured and a signed-in user the entry is inserted into the database (images go to the private
   kb-images bucket). Otherwise it is a PROTOTYPE: LocalStorage only (js/local-store.js), nothing is uploaded. */
const AK = { step: 1, d: null, err: {}, prev: null, editId: null, editLocal: false, saving: false };   // editId: the entry being edited (null = new entry)
const AK_STEPS = ['基本資訊', '內容填寫', '附圖與其他', '確認儲存'];
const AK_MAX_IMAGES = 8;

function akBlank() { return { root: '', sub: '', title: '', content_type: '', ...Object.fromEntries(KBContent.textFields.map(f => [f, ''])), failed: [''], ref: '', tags: '', images: [] }; }
function akPlaceOptions() {
  const fields = KBContent.fields(AK.d), o = [];
  for (const f of fields) {
    o.push([sectionKey(f.id), f.label]);
    if (f.steps) for (const step of parseSteps(AK.d[f.id])?.items || []) o.push([f.id + ':' + step.number, f.label + ' · Step ' + step.number]);
  }
  for (const im of AK.d.images) {
    if (['fails', 'ref'].includes(im.place) && KBContent.type(AK.d) === 'troubleshooting' && !o.some(([v]) => v === im.place)) o.push([im.place, SEC[im.place][0]]);
  }
  return o;
}
function akPlaceOf(im) { const o = akPlaceOptions(); return o.some(x => x[0] === im.place) ? im.place : o[0][0]; }
function akNormalizePlaces() {
  let moved = 0;
  for (const im of AK.d.images) { const place = akPlaceOf(im); if (place !== im.place) { im.place = place; moved++; } }
  return moved;
}
function akSetType(type) {
  if (!['knowledge', 'troubleshooting'].includes(type)) return;
  AK.d.content_type = type; delete AK.err.content_type;
  const moved = akNormalizePlaces();
  akRefresh(`#ak-type-${type}`);
  if (moved) toast(`${moved} 張圖片位置已調整到「${akPlaceOptions()[0][1]}」，可在附圖與其他重新選擇。`);
}
/* Both persistence paths and preview use the same semantic payload. */
function akPayload() {
  const d = AK.d;
  return KBContent.payload({
    ...Object.fromEntries(KBContent.textFields.map(f => [f, (d[f] || '').trim()])),
    content_type: d.content_type, title: d.title.trim(), category: akCategoryKey(d),
    tags: d.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
    reference_source: d.ref.trim(), failed_attempts: d.failed.map(s => s.trim()).filter(Boolean)
  });
}
function akPlaceField(im) { const [section, step] = akPlaceOf(im).split(':'); return { section, step: step === 'v' ? 'v' : step ? +step : 0 }; }
function akPlaceLabel(im) { return akPlaceOptions().find(x => x[0] === akPlaceOf(im))[1]; }
function akRootNode(key) { return KBH.tree().find(t => t.c.key === key); }
function akCategoryKey(d) { const n = akRootNode(d.root); return n && n.kids.length ? d.sub : d.root; }
function akDirty() { const d = AK.d; return !!d && !!(d.content_type || d.root || d.sub || d.title || KBContent.textFields.some(f => d[f]) || d.ref || d.tags || d.images.length || d.failed.some(Boolean)); }

function akOpen() {
  if (C.view !== 'add') { cRemember(); AK.prev = cViewState(); }
  if (!AK.d) AK.d = akBlank();
  AK.step = AK.step || 1; AK.err = {};
  C.view = 'add'; S.sel = null;
  renderSide(); renderDetail(true); cWriteHistory();
}
/* Edit one of the user's own entries: the same four-step form, filled from the entry. */
function akPlaceFromImage(im) {
  if (im.section === 'solution' && im.step === 'v') return 'verification';
  // Keep older fails/ref mappings on edit, even though they are no longer offered for new placement.
  return im.section ? (im.step ? sectionKey(im.section) + ':' + im.step : sectionKey(im.section)) : 'symptom';
}
function akEdit(id) {
  const e = S.entries.find(x => x.id === id);
  if (!e || !(e._prototype || (KBData.canDelete && KBData.canDelete(id)))) return;
  if (AK.d && akDirty() && !confirm('放棄目前輸入的內容，改為編輯這篇知識？')) return;
  const root = KBH.tree().find(t => t.c.key === e.category || t.kids.some(k => (k.c || k).key === e.category));
  AK.d = {
    ...akBlank(), ...Object.fromEntries(KBContent.textFields.map(f => [f, e[f] || ''])), content_type: KBContent.type(e),
    root: root ? root.c.key : '', sub: root && root.c.key !== e.category ? e.category : '',
    title: e.title || '', symptom: e.symptom || '', root_cause: e.root_cause || '', solution: e.solution || '',
    failed: (e.failed_attempts || []).length ? [...e.failed_attempts] : [''], notes: e.notes || '', ref: e.reference_source || '', tags: (e.tags || []).join(', '),
    images: (e.figures || e.images || []).map(im => ({ url: KBData.imageUrl(im.path || im.src || ''), orig: im, caption: im.caption || '', place: akPlaceFromImage(im) }))
  };
  AK.editId = id; AK.editLocal = !!e._prototype; AK.step = 1; AK.err = {};
  akOpen();
}
function akClose(toSaved) {
  const p = AK.prev || { view: 'all' };
  AK.d = null; AK.step = 1; AK.err = {}; AK.editId = null; AK.editLocal = false;
  if (toSaved) return;
  if (history.state?.kb?.view === 'add' && history.state.fromApp) { history.back(); return; }
  cRestoreView(p);
}

/* ---------- validation ---------- */
function akValidate(step) {
  const d = AK.d, err = {}, need = 'required';
  if (step === 1) {
    if (!['knowledge', 'troubleshooting'].includes(d.content_type)) err.content_type = need;
    if (!d.root) err.root = need;
    const n = akRootNode(d.root);
    if (n && n.kids.length && !d.sub) err.sub = need;
    if (!d.title.trim()) err.title = need;
  }
  if (step === 2) { for (const f of KBContent.fields(d).filter(f => f.required)) if (!d[f.id].trim()) err[f.id] = need; }
  AK.err = err;
  return !Object.keys(err).length;
}

/* ---------- rendering ---------- */
const akFieldErr = f => AK.err[f] ? `<div class="k-err" id="ak-error-${f}" role="alert">此欄位必填</div>` : '';
const akInv = f => AK.err[f] ? ` aria-invalid="true" aria-describedby="ak-error-${f}"` : '';
function akStepBody() {
  const d = AK.d;
  if (AK.step === 1) {
    const roots = KBH.tree(), n = akRootNode(d.root);
    return `<fieldset class="k-f wide k-type-group"><legend>內容類型 <b>*</b></legend><div class="k-type-options">
      ${[['knowledge', '技術知識', 'ti-book-2', '原理、設定、操作與經驗', '適用於工程知識、教學、SOP'], ['troubleshooting', '問題排除', 'ti-tool', '異常、原因與解決方式', '適用於報錯、模型異常、Debug']].map(([value, label, icon, desc, hint]) => `<label class="k-type-card" for="ak-type-${value}"><input id="ak-type-${value}" type="radio" name="content_type" value="${value}" data-f="content_type" required${d.content_type === value ? ' checked' : ''}${akInv('content_type')}><i class="ti ${icon}" aria-hidden="true"></i><span><strong>${label}</strong><span>${desc}</span><small>${hint}</small></span></label>`).join('')}
      </div>${akFieldErr('content_type')}</fieldset>
      <div class="k-f"><label for="ak-root">軟體分類 <b>*</b></label>
        <select id="ak-root" data-f="root"${akInv('root')}><option value="">請選擇軟體</option>${roots.map(({ c }) => `<option value="${esc(c.key)}" ${d.root === c.key ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>${akFieldErr('root')}</div>
      <div class="k-f"><label for="ak-sub">子分類 ${n && n.kids.length ? '<b>*</b>' : ''}</label>
        <select id="ak-sub" data-f="sub" ${n && n.kids.length ? '' : 'disabled'}${akInv('sub')}>${n && n.kids.length ? `<option value="">請選擇子分類</option>${n.kids.map(k => `<option value="${esc(k.key)}" ${d.sub === k.key ? 'selected' : ''}>${esc(k.label)}</option>`).join('')}` : `<option value="">${d.root ? '（此軟體沒有子分類）' : '請先選擇軟體分類'}</option>`}</select>${akFieldErr('sub')}</div>
      <div class="k-f wide"><label for="ak-title">文章標題 <b>*</b></label>
        <input id="ak-title" data-f="title" value="${esc(d.title)}" placeholder="例如：Drop Simulation — Rigid Wall 設定與方向判斷" autocomplete="off"${akInv('title')}>${akFieldErr('title')}</div>`;
  }
  if (AK.step === 2) {
    return KBContent.fields(d).map(f => {
      const ph = f.steps ? '1. 第一步…\n2. 第二步…\n3. 第三步…' : f.placeholder || '';
      const hint = f.steps ? '每行一個步驟，以「1.」「2.」「3.」編號，文章會顯示成步驟清單。' : f.hint;
      return `<div class="k-f wide"><label for="ak-${f.id}">${f.label}${f.required ? ' <b>*</b>' : ''}</label><textarea id="ak-${f.id}" data-f="${f.id}" rows="${f.rows}" placeholder="${esc(ph)}"${f.required ? ' required' : ''}${akInv(f.id)}>${esc(d[f.id])}</textarea>${hint ? `<div class="k-hint">${hint}</div>` : ''}${akFieldErr(f.id)}</div>`;
    }).join('');
  }
  if (AK.step === 3) {
    return `${KBContent.type(d) === 'troubleshooting' ? `<div class="k-f wide"><label>試過但無效</label>
        ${d.failed.map((f, i) => `<div class="k-failrow"><input data-f="failed" data-i="${i}" value="${esc(f)}" placeholder="例如：重新匯出 IGES —— 破面更多" autocomplete="off" aria-label="試過但無效 ${i + 1}"><button type="button" class="k-x" data-act="akRmFail" data-i="${i}" aria-label="移除這一項"${d.failed.length < 2 && !f ? ' disabled' : ''}><i class="ti ti-x"></i></button></div>`).join('')}
        <button type="button" class="k-link" data-act="akAddFail"><i class="ti ti-plus"></i>再加一項</button></div>` : ''}
      <div class="k-f wide"><label for="ak-ref">參考來源</label><input id="ak-ref" data-f="ref" value="${esc(d.ref)}" placeholder="例如：Altair HyperMesh Help — Geometry Cleanup" autocomplete="off"></div>
      <div class="k-f wide"><label for="ak-tags">標籤</label><input id="ak-tags" data-f="tags" value="${esc(d.tags)}" placeholder="以逗號分隔，例如：geometry, cleanup, step" autocomplete="off"></div>
      <div class="k-f wide"><label>圖片附件 <span class="k-opt">（最多 ${AK_MAX_IMAGES} 張，會先縮小；${akLive() ? '儲存時上傳到資料庫' : '只存在本機'}）</span></label>
        <button type="button" class="k-drop" data-act="akPick" id="akDrop"><i class="ti ti-photo-up"></i><b>選擇圖片，或把圖片拖曳到這裡</b><small>PNG / JPG；加入後可替每張圖寫說明，並選擇放在哪個段落或步驟</small></button>
        <input type="file" id="akFile" accept="image/*" multiple hidden>
        ${d.images.length ? `<div class="k-imgs">${d.images.map((im, i) => `<figure class="k-img"><img src="${im.url}" alt="${esc(im.caption || '附圖 ' + (i + 1))}"><button type="button" class="k-x over" data-act="akRmImg" data-i="${i}" aria-label="移除圖 ${i + 1}"><i class="ti ti-x"></i></button><input data-f="imgcap" data-i="${i}" value="${esc(im.caption)}" placeholder="圖 ${i + 1} 說明" aria-label="圖 ${i + 1} 說明"><select data-f="imgplace" data-i="${i}" aria-label="圖 ${i + 1} 放在哪裡">${akPlaceOptions().map(([v, l]) => `<option value="${v}"${v === akPlaceOf(im) ? ' selected' : ''}>${l}</option>`).join('')}</select></figure>`).join('')}</div>` : ''}</div>`;
  }
  /* step 4: preview */
  const key = akCategoryKey(d), info = catInfo(key);
  const entry = { ...akPayload(), images: d.images.map(im => ({ src: im.url, caption: im.caption.trim(), ...akPlaceField(im) })) };
  const figs = CI.figs = cFigs(entry);
  return `<div class="k-prev c-article"><p class="k-prev-path">${KBH.icon(key)}${esc(info.path)}</p>${KBContent.badge(entry)}<h2>${esc(d.title)}</h2>
      ${entry.tags.length ? `<div class="k-tags">${entry.tags.map(t => `<span class="k-tag">#${esc(t)}</span>`).join('')}</div>` : ''}
      ${cSectionsHtml(cArticleSections(entry, figs))}</div>
    <p class="k-hint">${AK.editId ? '確認無誤後按「儲存修改」，這篇知識會被更新。' : akLive() ? '確認無誤後按「儲存到資料庫」。' : '確認無誤後按「儲存到本機」。此為<b>原型</b>：資料只存在這個瀏覽器，不會上傳。'}</p>`;

}
/* Real saving (Supabase, signed in) vs. the local prototype (sample data / no database configured). */
const akLive = () => !AK.editLocal && !!(KBData.canWrite && KBData.auth);
const AK_NOTE_PROTO = '<b>本機原型</b>　儲存的資料只會留在這個瀏覽器（LocalStorage），不會上傳到 GitHub 或資料庫。';
const akNote = () => AK.editLocal ? AK_NOTE_PROTO : AK.editId ? `<b>編輯知識</b>　修改後會更新這篇文章（登入帳號：${esc(KBData.auth.session()?.user.email || '')}）。你可以調整內容、換圖或改圖片位置。` : akLive() ? `<b>儲存到資料庫</b>　登入帳號：${esc(KBData.auth.session()?.user.email || '')}。送出後會寫入 Supabase，圖片會上傳到私有的 kb-images。` : AK_NOTE_PROTO;
function akRender(el) {
  const last = AK.step === 4;
  el.innerHTML = `<div class="k-addpage"><div class="k-add-card">
    <header class="k-add-h"><h1>${AK.editId ? '編輯知識' : '新增知識'}</h1><div class="k-proto-note${akLive() ? ' live' : ''}"><i class="ti ${akLive() ? 'ti-cloud-upload' : 'ti-flask'}"></i><span>${akNote()}</span></div></header>
    <div class="k-add-body">
      <ol class="k-steps" aria-label="步驟">${AK_STEPS.map((s, i) => `<li class="${i + 1 === AK.step ? 'on' : i + 1 < AK.step ? 'done' : ''}"><button type="button" data-act="akGo" data-s="${i + 1}" ${i + 1 === AK.step ? 'aria-current="step"' : ''}><span class="k-sn">${i + 1 < AK.step ? '<i class="ti ti-check"></i>' : i + 1}</span>${s}</button></li>`).join('')}</ol>
      <form class="k-form" id="akForm" novalidate><h2 class="k-form-h">${AK_STEPS[AK.step - 1]}${AK.step === 2 ? `（${KBContent.label(AK.d)}）` : ''}</h2><div class="k-fields">${akStepBody()}</div></form>
    </div>
    <footer class="k-add-f">
      ${akLive() ? '' : `<button type="button" class="k-link muted" data-act="akClear"${LocalStore.count() ? '' : ' disabled'}>清除本機原型資料（${LocalStore.count()}）</button>`}<span class="spacer"></span>
      <button type="button" class="k-btn" data-act="akCancel">取消</button>
      ${AK.step > 1 ? `<button type="button" class="k-btn" data-act="akPrev">上一步</button>` : ''}
      <button type="button" class="k-btn pri" data-act="${last ? 'akSave' : 'akNext'}">${last ? (AK.editId ? '<i class="ti ti-device-floppy"></i>儲存修改' : akLive() ? '<i class="ti ti-cloud-upload"></i>儲存到資料庫' : '<i class="ti ti-device-floppy"></i>儲存到本機（原型）') : '下一步'}</button>
    </footer></div></div>`;
  $('#detail').scrollTop = 0;
}
function akRefresh(focusSel) { akRender($('#detail')); if (focusSel) $(focusSel)?.focus(); }

/* ---------- images (resized in the browser, stored as data URLs) ---------- */
function akResize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('無法讀取圖片')); };
    img.src = url;
  });
}
async function akAddFiles(files) {
  const list = [...files].filter(f => f.type.startsWith('image/'));
  for (const f of list) {
    if (AK.d.images.length >= AK_MAX_IMAGES) { toast(`最多 ${AK_MAX_IMAGES} 張圖片`, true); break; }
    try { AK.d.images.push({ url: await akResize(f), caption: f.name.replace(/\.[^.]+$/, ''), place: akPlaceOptions()[0][0] }); } catch (e) { toast(`${f.name}：${e.message}`, true); }
  }
  akRefresh();
}

/* ---------- save (PROTOTYPE: LocalStorage only) ---------- */
/* Drops storage objects created by this attempt after a definite HTTP row-write failure.
   Original images and paths from an uncertain network failure are left alone. */
async function akDiscardNewUploads(uploaded) {
  const originals = new Set(AK.d.images.map(im => im.orig && im.orig.path).filter(Boolean));
  const fresh = uploaded.filter(item => item.path && !originals.has(item.path));
  if (!fresh.length || !KBData.discardUploads) return;
  let failed;
  try { failed = await KBData.discardUploads(fresh.map(item => item.path)); } catch (e) { return; }
  const keep = new Set(failed || []);
  for (const item of fresh) if (!keep.has(item.path)) delete item.im.uploaded;
}
/* Saves to Supabase: upload the images first, then insert the entry. Nothing is added to the list unless the insert succeeds. */
async function akSaveLive() {
  if (AK.saving) return;
  const d = AK.d, btn = $('#detail [data-act="akSave"]');
  if (!KBData.auth.session()) { toast('登入已失效，請重新登入', true); return authOpen(akSaveLive); }
  AK.saving = true;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="k-spin"></span>儲存中…'; }
  const uploaded = [];
  try {
    if (KBData.ensureContentSchema) await KBData.ensureContentSchema();
    const images = [];
    for (const im of d.images.slice()) {
      if (im.orig) { images.push({ ...im.orig, caption: im.caption.trim(), ...akPlaceField(im) }); continue; }   // already stored: keep the file
      if (im.uploaded) { images.push({ path: im.uploaded, caption: im.caption.trim(), ...akPlaceField(im) }); continue; }
      const blob = await (await fetch(im.url)).blob();
      const up = await KBData.uploadImage(blob); im.uploaded = up;
      uploaded.push({ im, path: up });
      images.push({ path: up, caption: im.caption.trim(), ...akPlaceField(im) });
    }
    const body = { ...akPayload(), images };
    if (AK.editId) {
      const id = AK.editId, old = S.entries.find(x => x.id === id);
      const kept = new Set(images.map(i => i.path).filter(Boolean));
      const removed = ((old && old.images) || []).map(i => i.path).filter(p => p && !kept.has(p));
      const r = await KBData.updateEntry(id, body, removed);
      S.entries = S.entries.map(x => x.id === id ? r.entry : x);
      akClose(true); renderSide();
      toast(r.imagesFailed ? `已更新，但有 ${r.imagesFailed} 張舊圖片未能刪除` : '已更新', !!r.imagesFailed);
      return cOpen(id, { replace: true });
    }
    const saved = await KBData.createEntry(body);
    S.entries.unshift(saved);
    akClose(true);
    toast('已儲存到資料庫');
    cOpen(saved.id, { replace: true });
  } catch (err) {
    if (err.status) await akDiscardNewUploads(uploaded);
    if (err.status === 401) { toast('登入已失效，請重新登入後再儲存', true); authOpen(akSaveLive); }
    else toast(err.message || '儲存失敗', true);
    if (btn && C.view === 'add') akRefresh();
  } finally { AK.saving = false; }
}

function akSave() {
  if (AK.saving) return;
  if (akLive()) return akSaveLive();
  AK.saving = true;
  try {
    const d = AK.d, now = new Date().toISOString();
    const editing = AK.editLocal, old = editing ? S.entries.find(e => e.id === AK.editId) : null;
    const entry = {
      ...old, ...akPayload(), id: editing ? AK.editId : 'local-' + Date.now().toString(36),
      images: d.images.map(im => ({ ...(im.orig || {}), path: im.url, src: undefined, caption: im.caption.trim(), ...akPlaceField(im) })),
      created_at: old?.created_at || now, updated_at: now, _prototype: true
    };
    try { editing ? LocalStore.update(entry) : LocalStore.add(entry); } catch (e) { toast('瀏覽器空間不足，無法儲存（請減少圖片）', true); return; }
    if (editing) S.entries = S.entries.map(e => e.id === entry.id ? entry : e);
    else S.entries.unshift(entry);
    akClose(true);
    toast('已儲存到本機原型（只存在這個瀏覽器）');
    cOpen(entry.id, { replace: true });
  } finally { AK.saving = false; }
}

/* ---------- events ---------- */
document.addEventListener('input', e => {
  const t = e.target, f = t.dataset?.f; if (AK.saving || !f || C.view !== 'add' || !AK.d) return;
  if (f === 'failed') AK.d.failed[+t.dataset.i] = t.value;
  else if (f === 'imgcap') AK.d.images[+t.dataset.i].caption = t.value;
  else if (f === 'imgplace') AK.d.images[+t.dataset.i].place = t.value;
  else if (['root', 'sub', 'content_type'].includes(f)) return;
  else { AK.d[f] = t.value; if (AK.err[f] && t.value.trim()) { delete AK.err[f]; t.removeAttribute('aria-invalid'); t.parentElement.querySelector('.k-err')?.remove(); } }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (AK.saving || C.view !== 'add' || !AK.d) return;
  if (t.dataset.f === 'content_type') { akSetType(t.value); }
  else if (t.id === 'ak-root') { AK.d.root = t.value; AK.d.sub = ''; delete AK.err.root; delete AK.err.sub; akRefresh(AK.d.root && akRootNode(AK.d.root)?.kids.length ? '#ak-sub' : '#ak-root'); }
  else if (t.id === 'ak-sub') { AK.d.sub = t.value; delete AK.err.sub; t.removeAttribute('aria-invalid'); t.parentElement.querySelector('.k-err')?.remove(); }
  else if (t.id === 'akFile') { akAddFiles(t.files); t.value = ''; }
});
document.addEventListener('dragover', e => { if (e.target.closest?.('#akDrop')) { e.preventDefault(); e.target.closest('#akDrop').classList.add('over'); } });
document.addEventListener('dragleave', e => { e.target.closest?.('#akDrop')?.classList.remove('over'); });
document.addEventListener('drop', e => { if (e.target.closest?.('#akDrop')) { e.preventDefault(); e.target.closest('#akDrop').classList.remove('over'); if (!AK.saving) akAddFiles(e.dataTransfer.files); } });
document.addEventListener('keydown', e => {
  if (C.view === 'add' && !AK.saving && e.key === 'Enter' && e.target.tagName === 'INPUT' && !['file', 'radio'].includes(e.target.type)) { e.preventDefault(); actions.akNext(); }
});

Object.assign(actions, {
  kAdd: () => {
    if (AK.saving) return;
    if (KBData.canWrite && KBData.auth && !KBData.auth.session()) return authOpen(akOpen);
    if (AK.editId) { if (akDirty() && !confirm('放棄目前的編輯，改為新增知識？')) return; AK.d = null; AK.editId = null; AK.editLocal = false; AK.step = 1; }
    akOpen();
  },
  kEdit: b => { if (AK.saving) return; akEdit(b.dataset.id); },
  akCancel: () => { if (AK.saving) return; if (akDirty() && !confirm('放棄目前輸入的內容？')) return; akClose(false); },
  akPrev: () => { if (AK.saving) return; AK.step = Math.max(1, AK.step - 1); AK.err = {}; akRefresh(); },
  akNext: () => { if (AK.saving) return; if (AK.step === 4) return actions.akSave(); if (!akValidate(AK.step)) { akRefresh(); $('#detail [aria-invalid="true"]')?.focus(); return; } AK.step++; AK.err = {}; akRefresh(); },
  akGo: b => { if (AK.saving) return; const s = +b.dataset.s; if (s > AK.step) { for (let i = AK.step; i < s; i++) if (!akValidate(i)) { AK.step = i; akRefresh(); $('#detail [aria-invalid="true"]')?.focus(); return; } } AK.step = s; AK.err = {}; akRefresh(); },
  akAddFail: () => { if (AK.saving) return; AK.d.failed.push(''); akRefresh(); $$('#akForm input[data-f="failed"]').at(-1)?.focus(); },
  akRmFail: b => { if (AK.saving) return; AK.d.failed.splice(+b.dataset.i, 1); if (!AK.d.failed.length) AK.d.failed = ['']; akRefresh(); },
  akRmImg: b => { if (AK.saving) return; AK.d.images.splice(+b.dataset.i, 1); akRefresh(); },
  akPick: () => { if (AK.saving) return; $('#akFile')?.click(); },
  akSave: () => { if (AK.saving) return; if (!akValidate(1)) { AK.step = 1; akRefresh(); $('#detail [aria-invalid="true"]')?.focus(); return; } if (!akValidate(2)) { AK.step = 2; akRefresh(); $('#detail [aria-invalid="true"]')?.focus(); return; } akSave(); },
  akClear: () => {
    if (AK.saving || akLive()) return;
    const n = LocalStore.count(); if (!n || !confirm(`清除這個瀏覽器中 ${n} 筆本機原型資料？`)) return;
    LocalStore.clear(); S.entries = S.entries.filter(e => !e._prototype); akRefresh(); renderSide(); toast('已清除本機原型資料');
  }
});
