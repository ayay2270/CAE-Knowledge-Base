/* Figures, article view and lightbox — inline section and solution-step figures.
   Every figure keeps its caption, its section / step tag and a full-size viewer. */

const SEC = { summary: ['知識摘要'], technical_explanation: ['技術說明'], procedure: ['操作 / 設定步驟'], key_rules: ['關鍵參數 / 判斷規則'], symptom: ['問題現象'], root_cause: ['原因分析'], solution: ['解決方法'], verification: ['驗證結果'], fails: ['試過但無效'], note: ['注意事項'], ref: ['參考來源'] };
const CI = { figs: [] };
const sectionKey = s => ({ failed_attempts: 'fails', notes: 'note', reference_source: 'ref' }[s] || s);
function cSectionIds(e) {
  return KBContent.type(e) === 'knowledge'
    ? ['summary', 'technical_explanation', 'procedure', 'key_rules', 'note', 'ref']
    : ['symptom', 'root_cause', 'solution', 'verification', 'fails', 'note', 'ref'];
}
/* Legacy solution:v figures now belong to verification. Unknown placements stay visible. */
function cFigs(e) {
  const ids = cSectionIds(e);
  const source = e.figures || e.images || [];
  return source.map((im, i) => {
    let sec = sectionKey(im.section), step = im.step ?? 0;
    if (sec === 'solution' && step === 'v') { sec = 'verification'; step = 0; }
    if (!ids.includes(sec)) { sec = ids[0]; step = 0; }
    return { ...im, key: im.key ?? i === 0, sec, step, pri: im.order ?? i,
      title: im.title || im.caption || `圖片 ${i + 1}`, caption: im.caption || '',
      sectionLabel: sec === 'note' && KBContent.type(e) === 'knowledge' ? '注意事項 / 限制' : SEC[sec][0] };
  }).sort((a, b) => ids.indexOf(a.sec) - ids.indexOf(b.sec) || (+a.step || 0) - (+b.step || 0) || a.pri - b.pri).map((f, i) => ({ ...f, n: i + 1 }));
}
const stepLabel = f => ['solution', 'procedure'].includes(f.sec) && f.step ? `Step ${f.step}` : '';
const figWhere = f => (f.sectionLabel || (SEC[f.sec] || SEC.symptom)[0]) + (stepLabel(f) ? ' · ' + stepLabel(f) : '');
const imgTag = f => f.src ? `<img src="${esc(f.src)}" alt="${esc(f.title)}" width="960" height="600" loading="lazy" decoding="async">` : `<img data-path="${esc(f.path)}" alt="${esc(f.title)}">`;
const chips = (list, lab = true) => list.length ? `<div class="c-figrefs"><i class="ti ti-photo" aria-hidden="true"></i>${lab ? '<span>相關圖</span>' : ''}${list.map(f => `<button class="c-chip" data-act="cLb" data-n="${f.n}" title="${esc(f.title)}">圖 ${f.n}</button>`).join('')}</div>` : '';
function parseSteps(text) {
  const items = []; let cur = null; const pre = [];
  for (const ln of String(text || '').replace(/\r\n?/g, '\n').split('\n')) {
    const m = ln.match(/^\s*(\d+)[.)、．]\s+(.*)$/);
    if (m) { cur = { number: +m[1], text: m[2] }; items.push(cur); }
    else if (cur && ln.trim()) cur.text += ' ' + ln.trim();
    else if (!cur && ln.trim()) pre.push(ln);
  }
  return items.length >= 1 ? { pre: pre.join('\n'), items } : null;
}
const stepText = t => `<div class="prose"><p>${inline(esc(t))}</p></div>`;


function cInlineFigs(list) {
  if (!list.length) return '';
  return `<div class="c-inline-figs ${list.length === 1 ? 'one' : ''}">${list.map(f => `<figure id="fig-${f.n}" class="c-inline-fig"><button class="c-inline-thumb" data-act="cLb" data-n="${f.n}" aria-label="放大圖 ${f.n}：${esc(f.title || f.caption)}">${imgTag(f)}<span class="c-fig-zoom" aria-hidden="true"><i class="ti ti-arrows-maximize"></i></span></button><figcaption>圖 ${f.n}. ${esc(f.title || f.caption || '')}${f.title && f.caption && f.title !== f.caption ? `<span>${esc(f.caption)}</span>` : ''}</figcaption></figure>`).join('')}</div>`;
}
function cRelated(e) {
  const tags = new Set((e.tags || []).map(t => t.toLowerCase()));
  return S.entries.filter(x => x.id !== e.id).map(x => ({entry:x,score:(x.category === e.category ? 3 : 0) + (x.tags || []).filter(t => tags.has(t.toLowerCase())).length * 2})).filter(x => x.score > 0).sort((a,b) => b.score-a.score || new Date(b.entry.updated_at)-new Date(a.entry.updated_at) || a.entry.id.localeCompare(b.entry.id)).slice(0,4).map(x => x.entry);
}
/* Shared section HTML for Step 4 and the published reading view. */
function cArticleSections(e, figs) {
  const p = KBH.parts(e), bySec = id => figs.filter(f => f.sec === id);
  const sections = p.sections.filter(f => f.id !== 'notes').map(f => {
    const images = bySec(f.id);
    if (!f.required && f.empty && !images.length) return null;
    const st = f.steps && parseSteps(e[f.id]);
    let body = `<div class="prose">${f.html}</div>`;
    if (st) {
      const numbered = new Set(st.items.map(it => it.number));
      body = (st.pre ? `<div class="prose">${md(st.pre)}</div>` : '') +
        `<ol class="c-steps">${st.items.map(it => `<li id="step-${it.number}"><span class="c-sn" aria-label="Step ${it.number}">${it.number}</span><div class="c-sb">${stepText(it.text)}${cInlineFigs(images.filter(im => Number(im.step) === it.number))}</div></li>`).join('')}</ol>` + cInlineFigs(images.filter(im => !numbered.has(Number(im.step))));
    } else body += cInlineFigs(images);
    return [f.id, f.label, body];
  }).filter(Boolean);
  if (KBContent.type(e) === 'troubleshooting' && (p.failsHtml || bySec('fails').length)) sections.push(['fails', '試過但無效', `<div class="prose">${p.failsHtml}</div>${cInlineFigs(bySec('fails'))}`]);
  if (p.noteHtml || bySec('note').length) sections.push(['note', KBContent.type(e) === 'knowledge' ? '注意事項 / 限制' : '注意事項', `<div class="prose">${p.noteHtml}</div>${cInlineFigs(bySec('note'))}`]);
  if (p.refHtml || bySec('ref').length) sections.push(['ref', '參考來源', `<div class="prose c-ref">${p.refHtml}</div>${cInlineFigs(bySec('ref'))}`]);
  return sections;
}
const cSectionsHtml = sections => sections.map(([id, label, body]) => `<section id="sec-${id}"><h2>${label}</h2>${body}</section>`).join('');
function cArticle(el, e) {
  const p = KBH.parts(e), figs = CI.figs = cFigs(e);
  const root = catByKey(C.root) || C_OTHER;
  const sections = cArticleSections(e, figs);
  const related = cRelated(e);
  el.innerHTML = `<div class="c-page-wrap"><article class="c-article">
    ${cCrumb([{t:'所有文章',act:'cHome'},{t:root.label,act:'cCat',k:C.root},...(p.c.parent ? [{t:p.c.label,act:'cCat',k:e.category}] : []),{t:e.title}])}
    <div class="c-article-label">${esc(p.c.label)}</div> ${KBContent.badge(e)}<h1>${esc(e.title)}</h1>
    <div class="c-meta"><span>更新：<time datetime="${esc(e.updated_at)}">${fmtDate(e.updated_at)}</time></span>${e._prototype ? '<span class="k-proto">本機原型</span>' : ''}<span class="c-actions">${p.actions}</span></div>
    ${cSectionsHtml(sections)}
    ${related.length ? `<section id="sec-related" class="c-related"><h2>相關知識</h2>${related.map(r => `<button data-act="cOpen" data-id="${esc(r.id)}"><span>${esc(r.title)}</span><small>${esc(catInfo(r.category).label)}</small><i class="ti ti-arrow-right" aria-hidden="true"></i></button>`).join('')}</section>` : ''}
    </article><aside class="c-toc" aria-label="文章目錄"><div class="c-toc-in"><div class="c-toc-h">On this page</div>${sections.map(([id,label]) => `<a href="#sec-${id}" data-act="cJump" data-t="sec-${id}">${label}</a>`).join('')}${related.length ? '<a href="#sec-related" data-act="cJump" data-t="sec-related">相關知識</a>' : ''}</div></aside></div>`;
}

/* ---------------- lightbox ---------------- */
const LB = { i: 0, full: false, opener: null };
function lbDraw() {
  const lb = $('#cLb'); if (!lb) return;
  const list = CI.figs, f = list[LB.i];
  const url = f.src || KBData.imageUrl(f.path) || '';
  lb.classList.toggle('full', LB.full);
  lb.innerHTML = `<div class="c-lb-top"><span class="c-lb-n">圖 ${f.n} <em>/ ${list.length}</em></span><span class="c-lb-tag">${esc(figWhere(f))}</span><span class="sp"></span>
      <button data-act="cLbFull" aria-pressed="${LB.full}" title="切換原始大小"><i class="ti ${LB.full ? 'ti-arrows-minimize' : 'ti-zoom-in-area'}"></i>${LB.full ? '符合視窗' : '原始大小'}</button>
      <button data-act="cLbClose" id="cLbX" aria-label="關閉（Esc）"><i class="ti ti-x"></i></button></div>
    <div class="c-lb-stage"><button class="c-lb-nav" data-act="cLbStep" data-v="-1" aria-label="上一張" ${list.length < 2 ? 'disabled' : ''}><i class="ti ti-chevron-left"></i></button>
      <div class="c-lb-img"><img src="${url}" alt="${esc(f.title)}"></div>
      <button class="c-lb-nav" data-act="cLbStep" data-v="1" aria-label="下一張" ${list.length < 2 ? 'disabled' : ''}><i class="ti ti-chevron-right"></i></button></div>
    <div class="c-lb-cap"><b>${esc(f.title)}</b>${f.caption ? `<span>${esc(f.caption)}</span>` : ''}</div>
    ${list.length > 1 ? `<div class="c-lb-strip">${list.map((x, k) => `<button class="${k === LB.i ? 'on' : ''}" data-act="cLbGo" data-k="${k}" aria-label="圖 ${x.n}：${esc(x.title)}">${x.src ? `<img src="${x.src}" alt="">` : `<img src="${KBData.imageUrl(x.path) || ''}" alt="">`}<span>${x.n}</span></button>`).join('')}</div>` : ''}`;
  lb.querySelector('.c-lb-strip .on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function lbKey(ev) {
  if (ev.key === 'Escape') lbClose();
  else if (ev.key === 'ArrowLeft') lbStep(-1);
  else if (ev.key === 'ArrowRight') lbStep(1);
  else if (ev.key === 'Tab') { const els = $$('#cLb button:not(:disabled)'); if (!els.length) return; const a = document.activeElement, first = els[0], last = els[els.length - 1]; if (ev.shiftKey && a === first) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && a === last) { ev.preventDefault(); first.focus(); } }
}
function lbStep(d) { const n = CI.figs.length; LB.i = (LB.i + d + n) % n; lbDraw(); $('#cLb .c-lb-nav:not(:disabled), #cLbX')?.focus(); }
function lbOpen(n) {
  const i = CI.figs.findIndex(f => f.n === n); if (i < 0) return;
  LB.i = i; LB.full = false; LB.opener = document.activeElement;
  let lb = $('#cLb'); if (!lb) { lb = document.createElement('div'); lb.id = 'cLb'; lb.className = 'c-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', '圖片預覽'); document.body.appendChild(lb); }
  document.addEventListener('keydown', lbKey);
  document.body.classList.add('c-lb-open');
  lbDraw(); $('#cLbX')?.focus();
}
function lbClose() { $('#cLb')?.remove(); document.removeEventListener('keydown', lbKey); document.body.classList.remove('c-lb-open'); LB.opener?.focus?.(); }


Object.assign(actions, {
  cLb: b => lbOpen(+b.dataset.n),
  cLbClose: lbClose, cLbStep: b => lbStep(+b.dataset.v), cLbGo: b => { LB.i = +b.dataset.k; lbDraw(); },
  cLbFull: () => { LB.full = !LB.full; lbDraw(); $('#cLbX')?.focus(); }
});;
