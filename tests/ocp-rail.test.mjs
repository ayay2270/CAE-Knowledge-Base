import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const db=JSON.parse(read('data/knowledge-base.json'));
const ocp=db.entries.filter(e=>e.id.startsWith('ocp-rail-'));
const indexId='ocp-rail-force-spcd-test-to-fail-20261029';
const tutorialId='ocp-rail-hyperview-node-uz-force-to-spcd-20261029';
const allText=e=>Object.values(e).filter(v=>typeof v==='string').join('\n');
function app(){
 const ctx=vm.createContext({navigator:{platform:'test'},console,document:{addEventListener(){}}});
 for(const f of ['content-model','core','figures'])vm.runInContext(read('js/'+f+'.js'),ctx);
 vm.runInContext(`CATS=${JSON.stringify(db.categories)};S.entries=${JSON.stringify(db.entries)};globalThis.KBData={canDelete:()=>false};`,ctx);
 return code=>vm.runInContext(code,ctx);
}
test('OCP entries use existing schema, unique IDs, active category and required content',()=>{
 assert.equal(new Set(db.entries.map(e=>e.id)).size,db.entries.length);
 const allowed=new Set(['id','category','content_type','title','tags','summary','technical_explanation','procedure','key_rules','notes','reference_source','images','figures','created_at','updated_at','symptom','root_cause','solution','failed_attempts','verification']);
 for(const e of ocp){
  for(const k of Object.keys(e))assert.ok(allowed.has(k),e.id+': unexpected field '+k);
  assert.ok(db.categories.some(c=>c.key===e.category&&c.is_active),e.id);
  assert.ok(e.tags.includes('OCP-Rail'));
  const required=e.content_type==='knowledge'?['summary','technical_explanation','procedure']:['symptom','root_cause','solution'];
  for(const f of required)assert.ok(e[f]?.trim(),e.id+': '+f);
  assert.ok(!Number.isNaN(Date.parse(e.updated_at)));
 }
 assert.equal(db.entries.filter(e=>e.id.startsWith('demo-')).length,10,'retain all ten original demo entries');
});
test('every independent OCP entry links back to the stable index and index links to each',()=>{
 const index=ocp.find(e=>e.id===indexId);assert.ok(index);
 for(const e of ocp){
  for(const m of allText(e).matchAll(/\]\(#([a-z0-9-]+)\)/g))assert.ok(db.entries.some(x=>x.id===m[1]),e.id+': missing '+m[1]);
  if(e.id!==indexId){assert.ok(allText(e).includes('](#'+indexId+')'),e.id);assert.ok(index.procedure.includes('](#'+e.id+')'),e.id);}
 }
});
test('search ranks the relevant independent knowledge lines for realistic queries',()=>{
 const run=app();
 const cases=[['HyperView UZ',tutorialId],['SPCFORCE 平衡','ocp-rail-spcforce-equivalence-20261029'],['press-fit','ocp-rail-press-fit-contact-20261029'],['Tetra10 收斂','ocp-rail-tetra4-tetra10-convergence-20261029'],['Auto-SPC','ocp-rail-rbe-hole-nodes-autospc-20261029'],['Stress Legend','ocp-rail-stress-contour-reading-20261029']];
 for(const [q,id]of cases){run(`S.q=${JSON.stringify(q)}`);assert.ok(run('visible().slice(0,3).map(e=>e.id)').includes(id),q);}
});
test('all OCP figures resolve locally and attach to real rendered sections and steps',()=>{
 const run=app();
 for(const e of ocp){
  assert.deepEqual(e.figures,e.images,e.id+': duplicate figure formats diverged');
  run(`globalThis.e=${JSON.stringify(e)}`);
  assert.equal(run('cFigs(e).length'),e.images.length);
  const html=run('cSectionsHtml(cArticleSections(e,cFigs(e)))');
  assert.equal((html.match(/id="fig-/g)||[]).length,e.images.length,e.id);
  for(const im of e.images){
   assert.ok(im.src.startsWith('assets/figures/ocp-rail/'),im.src);
   assert.ok(im.title&&im.caption&&im.mock===true,im.src);
   const svg=read(im.src);assert.match(svg,/<svg\b[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/);assert.match(svg,/<\/svg>\s*$/);
   const sec=({note:'notes',ref:'reference_source'}[im.section]||im.section);
   assert.ok(e[sec],e.id+': missing section '+sec);
   if(im.step)assert.match(e[sec],new RegExp('(?:^|\\n)'+im.step+'\\. '),e.id+': nonexistent step');
  }
 }
 const index=ocp.find(e=>e.id===indexId);assert.equal(index.images.length,6,'preserve original figure gallery');
});
test('Markdown companion documents retain resolvable article and image links',()=>{
 for(const e of ocp){
  const stem=e.id===indexId?'ocp-rail-force-spcd-test-to-fail':e.id.replace(/-20261029$/,'');
  const file='docs/knowledge/'+stem+'.md';const content=read(file);
  assert.ok(content.includes('?source=local#'+e.id),file);
  for(const m of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
   const [target,hash]=m[1].split('#');if(/^https?:/.test(target))continue;
   const pathname=target.split('?')[0];
   assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),pathname)),file+': '+target);
   if(hash)assert.ok(db.entries.some(e=>e.id===hash),hash);
  }
  for(const im of e.images)assert.ok(content.includes('../../'+im.src),file+': missing image '+im.src);
 }
});
test('article links render as safe hash links while script URLs and authored HTML stay text',()=>{
 const run=app();
 assert.equal(run(`md('[教學](#${tutorialId})')`),`<p><a href="#${tutorialId}">教學</a></p>`);
 const bad=run(`md('[bad](javascript:alert(1)) [bad](#x" onclick="alert(1)) <img src=x onerror=alert(1)>')`);
 assert.doesNotMatch(bad,/<a\b|<img\b|onclick="/);assert.match(bad,/&lt;img/);
});
