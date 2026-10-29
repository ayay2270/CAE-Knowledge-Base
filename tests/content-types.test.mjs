import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const db = JSON.parse(source('data/knowledge-base.json'));
const knowledge = { content_type:'knowledge', title:'Rigid Wall', category:'lsdyna', summary:'摘要', technical_explanation:'法向有效側' };

test('SPCFORCE is independently searchable, cross-linked and has valid step figures',()=>{
 const run=app();const id='ocp-rail-spcforce-stress-limit-20261029';
 const e=db.entries.find(e=>e.id===id);assert.ok(e);assert.equal(e.content_type,'knowledge');
 assert.equal(new Set(db.entries.map(e=>e.id)).size,db.entries.length,'unique article IDs');
 run(`S.entries=${JSON.stringify(db.entries)};S.filter='all'`);
 for(const q of ['SPCFORCE','反力','60MPa','NLOUT','50kgf','Force→SPCD']){
  run(`S.q=${JSON.stringify(q)}`);assert.ok(run('visible().some(e=>e.id==='+JSON.stringify(id)+')'),q);
 }
 for(const relatedId of ['ocp-rail-force-spcd-test-to-fail-20261029','ocp-rail-spcd-123456-mismatch-20261029']){
  const related=db.entries.find(e=>e.id===relatedId);
  run('globalThis.related='+JSON.stringify(related));
  assert.ok(run('cSectionsHtml(cArticleSections(related,cFigs(related)))').includes('href="#'+id+'"'),'explicit incoming article link');
  run('globalThis.subject='+JSON.stringify(e));
  assert.ok(run('cSectionsHtml(cArticleSections(subject,cFigs(subject)))').includes('href="#'+relatedId+'"'),'explicit outgoing article link');
 }
 const steps=e.procedure.split('\n').map(s=>Number(s.match(/^(\d+)\./)?.[1]));
 assert.equal(e.figures.length,4);
 for(const f of e.figures){assert.ok(steps.includes(f.step));assert.equal(f.section,'procedure');assert.equal(f.mock,true);assert.match(source(f.src),/示意圖/);}
 run(`globalThis.e=${JSON.stringify(e)}`);assert.equal(run(`cSectionsHtml(cArticleSections(e,cFigs(e))).match(/id="fig-/g).length`),4);
});
function app(fetch = async () => { throw new Error('Unexpected network'); }, opts = {}) {
  const stored = opts.signedIn === false ? 'null' : JSON.stringify({access_token:'test',refresh_token:'test',expires_at:9999999999,user:{id:'11111111-1111-4111-8111-111111111111',email:'test@example.invalid'}});
  const ctx = vm.createContext({ navigator:{platform:'test'}, document:{addEventListener(){}}, URL, URLSearchParams, location:{search:''}, console, fetch, Response, crypto, localStorage:{getItem:() => stored} });
  for (const f of ['content-model','core','figures','add-knowledge','provider-local','provider-supabase']) vm.runInContext(source('js/'+f+'.js'), ctx, {filename:f});
  vm.runInContext(`CATS = ${JSON.stringify(db.categories)}; globalThis.KBData = {imageUrl:p=>p,canDelete:()=>false};`,ctx);
  return text => vm.runInContext(text,ctx);
}
test('required fields depend on explicit type; optional fields may be empty',()=>{
 const run=app(); run('AK.d=akBlank()'); assert.equal(run('akValidate(1)'),false); assert.equal(run('AK.err.content_type'),'required');
 run(`Object.assign(AK.d,${JSON.stringify(knowledge)})`); assert.equal(run('akValidate(2)'),true);
 run(`AK.d.technical_explanation=''`);assert.equal(run('akValidate(2)'),true);
 run(`AK.d.summary=''`);assert.equal(run('akValidate(2)'),false);
 run(`AK.d.content_type='troubleshooting'`); assert.equal(run('akValidate(2)'),false);
 run(`Object.assign(AK.d,{symptom:'a',root_cause:'b',solution:'c'})`); assert.equal(run('akValidate(2)'),true);
});
test('renderer hides inactive and empty optional sections, retains image-only sections',()=>{
 const run=app(); run(`globalThis.e=${JSON.stringify(knowledge)}`); assert.equal(run('cArticleSections(e,[]).map(s=>s[0]).join()'),'summary,technical_explanation');
 run(`e.images=[{src:'local.svg',section:'procedure',step:2}]`); assert.equal(run('cArticleSections(e,cFigs(e)).map(s=>s[0]).join()'),'summary,technical_explanation,procedure');
 assert.equal(run(`cSectionsHtml(cArticleSections(e,cFigs(e))).includes('問題現象')`),false);
});
test('all existing entries and legacy placements render without dropping figures',()=>{
 const run=app(); for(const e of db.entries){ run(`globalThis.e=${JSON.stringify(e)}`); assert.equal(run('KBContent.type(e)'),e.content_type === 'knowledge' ? 'knowledge' : 'troubleshooting'); assert.equal(run(`cSectionsHtml(cArticleSections(e,cFigs(e))).match(/id="fig-/g)?.length||0`),(e.figures||e.images).length); }
 assert.equal(run(`cFigs({images:[{section:'solution',step:'v'}]})[0].sec`),'verification');
});
test('search indexes all requested fields',()=>{
 const run=app(); for(const f of ['title','summary','technical_explanation','procedure','key_rules','notes','symptom','root_cause','solution','verification','tags']){
 run(`S.entries=[{id:'match',category:'lsdyna',${JSON.stringify(f)}:${f==='tags'?'["uniqueneedle"]':'"uniqueneedle"'}}]; S.q='uniqueneedle'`); assert.equal(run('visible().length'),1,f); }
});
test('step placements use actual steps, CRLF and Chinese numbering; fallback keeps image',()=>{
 const run=app(); run(String.raw`AK.d={...akBlank(),content_type:'knowledge',procedure:'2. second\r\n5、 fifth',images:[{place:'solution:1',url:'kept'}]}`);
 assert.equal(run('akPlaceOptions().map(x=>x[0]).join()'),'summary,technical_explanation,procedure,procedure:2,procedure:5,key_rules,note');
 assert.equal(run('akNormalizePlaces()'),1); assert.equal(run('AK.d.images[0].place'),'summary'); assert.equal(run('AK.d.images[0].url'),'kept');
});
test('Supabase load/create/update use new columns, normalize newlines, exclude author metadata',async()=>{
 const req=[]; const run=app(async(url,init)=>{req.push({url,init});return Response.json(init.method==='GET'?(url.includes('software_categories')?db.categories:[{...knowledge,technical_explanation:'a\r\nb'}]):[{...JSON.parse(init.body),id:'22222222-2222-4222-8222-222222222222'}]);});
 run(`globalThis.p=createSupabaseProvider({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})`);
 assert.equal((await run('p.load()')).entries[0].technical_explanation,'a\nb');
 await run(`p.createEntry(${JSON.stringify({...knowledge,user_id:'forbidden',views:99})})`); await run(`p.updateEntry('22222222-2222-4222-8222-222222222222',${JSON.stringify(knowledge)})`);
 assert.ok(req.find(r=>r.url.includes('technical_explanation')));
 const gets=req.filter(r=>r.init.method==='GET');
 assert.ok(gets.length>=1);assert.ok(gets.every(r=>r.init.headers.Authorization==='Bearer test'));
 for(const r of req.filter(r=>['POST','PATCH'].includes(r.init.method))){const body=JSON.parse(r.init.body); assert.equal(body.content_type,'knowledge');assert.equal(body.symptom,'');assert.equal('user_id'in body,false);assert.equal('views'in body,false);assert.equal(r.init.headers.Authorization,'Bearer test');}
 assert.equal(run('p.canDelete("seed-row")'),true);
});
test('pre-migration load falls back to legacy columns and writes fail explicitly',async()=>{
 const req=[];const legacy=db.entries.find(e=>!e.content_type);const run=app(async(url,init)=>{req.push(url);if(url.includes('software_categories'))return Response.json(db.categories);if(url.includes('content_type')||init.method!=='GET')return Response.json({code:'42703'},{status:400});return Response.json([legacy]);});
 run(`globalThis.p=createSupabaseProvider({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})`);
 assert.equal((await run('p.load()')).entries[0].content_type,'troubleshooting');assert.equal(req.length,3);await assert.rejects(run(`p.createEntry(${JSON.stringify(knowledge)})`),/phase5-content-types.sql/);
});
test('local provider normalizes legacy type and preserves default figures',async()=>{
 const run=app(async()=>Response.json(db));const result=await run('LocalProvider.load()');for(const e of db.entries)assert.equal(result.entries.find(x=>x.id===e.id).content_type,e.content_type==='knowledge'?'knowledge':'troubleshooting');assert.equal(result.entries.find(e=>e.id==='demo-hm-step').figures.length,8);
});
test('migration is additive and extends only phase4 content update grants',()=>{
 const sql=source('supabase/phase5-content-types.sql').replace(/--[^\n]*/g,'');assert.doesNotMatch(sql,/\b(drop|delete|truncate|rename)\b|\bupdate\s+public\./i);assert.equal((sql.match(/add column if not exists/g)||[]).length,6);assert.match(sql,/grant insert \(content_type, summary, technical_explanation, procedure, key_rules, verification\)/);assert.match(sql,/grant update \(content_type, summary, technical_explanation, procedure, key_rules, verification\)/);
});


test('type-aware snippets and legacy-only placements never leak into knowledge',()=>{
 const run=app();
 run(`globalThis.e={content_type:'troubleshooting',symptom:'active symptom',summary:'dormant summary'}; S.q=''`);
 assert.equal(run('KBH.snippet(e)'), 'active symptom');
 run(`AK.d={...akBlank(),content_type:'troubleshooting',images:[{place:'ref',url:'reference'},{place:'fails',url:'failure'}]}`);
 assert.equal(run('akNormalizePlaces()'),0);
 run(`AK.d.content_type='knowledge'`);assert.equal(run('akNormalizePlaces()'),2);assert.equal(run('AK.d.images.map(im=>im.place).join()'),'summary,summary');
});

test('missing schema blocks create/update before writes and succeeds on retry after migration',async()=>{
 let ready=false;const req=[];
 const run=app(async(url,init)=>{
  req.push({url,method:init.method});
  if(init.method==='GET')return ready?Response.json([]):Response.json({code:'PGRST204'},{status:400});
  return Response.json([{...JSON.parse(init.body),id:'22222222-2222-4222-8222-222222222222'}]);
 });
 run(`globalThis.p=createSupabaseProvider({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})`);
 await assert.rejects(run(`p.createEntry(${JSON.stringify(knowledge)})`),e=>e.code==='CONTENT_SCHEMA_MISSING');
 await assert.rejects(run(`p.updateEntry('22222222-2222-4222-8222-222222222222',${JSON.stringify(knowledge)})`),e=>e.code==='CONTENT_SCHEMA_MISSING');
 assert.ok(req.every(r=>r.method==='GET'));assert.ok(req.every(r=>r.url.includes('limit=0')));
 ready=true;assert.equal((await run(`p.createEntry(${JSON.stringify(knowledge)})`)).content_type,'knowledge');
 assert.equal(req.filter(r=>r.method==='POST').length,1);
});
test('schema failure in form keeps draft and stops before image upload',async()=>{
 let network=0;const run=app(async()=>{network++;throw new Error('unexpected request');});
 run(`globalThis.C={view:'add'}; document.querySelector=()=>({disabled:false}); akRefresh=()=>{}; toast=()=>{};
 KBData={auth:{session:()=>({user:{id:'test'}})},ensureContentSchema:async()=>{throw new Error('missing schema');}};
 AK.d={...akBlank(),content_type:'knowledge',title:'Retained title',summary:'Retained summary',images:[{url:'data:image/png;base64,test',caption:'Retained image',place:'summary'}]};`);
 await run('akSaveLive()');assert.equal(network,0);assert.equal(run('AK.d.summary'),'Retained summary');assert.equal(run('AK.d.images.length'),1);
});
test('empty technical explanation is omitted in both preview and reading sections',()=>{
 const run=app();run(`globalThis.e={...${JSON.stringify(knowledge)},technical_explanation:''}`);
 assert.equal(run('cArticleSections(e,[]).map(s=>s[0]).join()'),'summary');
 run(`e.images=[{section:'technical_explanation',src:'example.svg'}]`);
 assert.equal(run('cArticleSections(e,cFigs(e)).map(s=>s[0]).join()'),'summary,technical_explanation');
});

const sqlText = file => source(file).replace(/--[^\n]*/g, '');
const OWNER = '11111111-1111-4111-8111-111111111111';
const NEW_PATH = `${OWNER}/22222222-2222-4222-8222-222222222222.jpg`;
const ORIG_PATH = `${OWNER}/33333333-3333-4333-8333-333333333333.jpg`;

test('schema.sql does not grant or revoke application privileges',()=>{
 const sql=sqlText('supabase/schema.sql');
 assert.doesNotMatch(sql,/revoke\s+all/i);
 assert.doesNotMatch(sql,/create\s+policy/i);
 assert.doesNotMatch(sql,/\bgrant\b/i);
 assert.match(sql,/enable row level security/i);
});
test('privileges.sql is the single-owner access source',()=>{
 const sql=sqlText('supabase/privileges.sql');
 assert.match(sql,/76fbe155-0879-4687-910a-fda12add9c2f/);
 assert.match(sql,/kb_is_owner/);
 assert.doesNotMatch(sql,/security\s+definer/i);
 assert.doesNotMatch(sql,/\bto\s+anon\b/i);
 assert.match(sql,/grant execute on function public\.kb_is_owner\(\) to authenticated/i);
 assert.match(sql,/revoke all on table public\.entries from anon/i);
 assert.match(sql,/revoke all on table public\.entries from authenticated/i);
 assert.match(sql,/revoke all on table public\.software_categories from authenticated/i);
 assert.match(sql,/revoke all privileges \(/i);
 for (const name of ['entries_public_read','kb_images_public_read','entries_author_insert','entries_author_update','entries_author_delete','kb_images_author_insert','kb_images_author_delete']) assert.ok(sql.includes(name),name);
 assert.match(sql,/grant select, delete on table public\.entries to authenticated/i);
 assert.doesNotMatch(sql,/grant\s+(select,\s*)?insert(\s*,\s*delete)?\s+on table public\.entries/i);
 const insertCols = [...sql.matchAll(/grant insert \(\s*([^)]+)\)/gi)].map(m => m[1].replace(/\s+/g,' ').trim());
 assert.deepEqual(insertCols, [
  'title, category, tags, symptom, root_cause, solution, failed_attempts, notes, reference_source, images',
  'content_type, summary, technical_explanation, procedure, key_rules, verification'
 ]);
 for (const blocked of ['id','user_id','created_at','updated_at','views']) assert.equal(insertCols.some(cols => cols.split(', ').includes(blocked)), false, blocked);
 assert.match(sql,/entries_owner_select/);
 assert.match(sql,/kb_images_owner_delete/);
});
test('retired phase scripts cannot recreate policies',()=>{
 for (const file of ['supabase/phase2-auth-write.sql','supabase/phase3-delete-own.sql','supabase/phase4-edit-own.sql']) {
  const sql=sqlText(file);
  assert.doesNotMatch(sql,/create\s+policy/i);
  assert.doesNotMatch(sql,/\bgrant\b/i);
 }
});
test('logged-out supabase reads do not hit the network',async()=>{
 let n=0;const run=app(async()=>{n++;throw new Error('fetch');},{signedIn:false});
 run(`globalThis.p=createSupabaseProvider({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})`);
 await assert.rejects(run('p.load()'),/not signed in/);
 await run(`p.prepareImages(['${NEW_PATH}'])`);
 assert.equal(n,0);
 assert.equal(run('p.canDelete("x")'),false);
});
test('supabase boot does not merge local prototypes',()=>{
 const main=source('js/main.js');
 assert.match(main,/KBData\.id === 'local' \? \[\.\.\.LocalStore\.list\(\), \.\.\.db\.entries\] : \[\.\.\.db\.entries\]/);
 assert.doesNotMatch(main,/LocalStore\.clear\(/);
});
function saveHarness(fetch){
 const run=app(fetch||(async()=>({blob:async()=>({type:'image/jpeg'})})));
 run(`globalThis.C={view:'add'};document.querySelector=()=>({disabled:false});akRefresh=()=>{};toast=()=>{};authOpen=()=>{};akClose=()=>{};cOpen=()=>{};renderSide=()=>{};AK.saving=false;AK.editId=null;AK.editLocal=false;S.entries=[];`);
 return run;
}
test('save is single-flight and reuses an uploaded path',async()=>{
 const run=saveHarness();
 run(`globalThis.uploads=0;globalThis.gate=new Promise(r=>{globalThis.release=r;});globalThis.saved=null;
  AK.d={...akBlank(),content_type:'knowledge',title:'T',summary:'S',root:'lsdyna',images:[{url:'data:image/jpeg;base64,xx',caption:'c',place:'summary',uploaded:'${NEW_PATH}'}]};
  KBData={auth:{session:()=>({user:{id:'${OWNER}'}})},canWrite:true,ensureContentSchema:async()=>{uploads++;await gate;},uploadImage:async()=>{throw new Error('reused upload');},createEntry:async body=>{saved=body.images[0].path;return{...body,id:'22222222-2222-4222-8222-222222222222'};},discardUploads:async()=>[]};`);
 const first=run('akSaveLive()');
 await Promise.resolve();
 await run('akSaveLive()');
 assert.equal(run('uploads'),1);
 run('release()');
 await first;
 assert.equal(run('uploads'),1);
 assert.equal(run('saved'),NEW_PATH);
 assert.equal(run('AK.saving'),false);
});
test('http row-write failure deletes only new uploads and a failed delete is reused',async()=>{
 const run=saveHarness();
 run(`globalThis.uploads=0;globalThis.discarded=[];globalThis.failDiscard=true;
  AK.d={...akBlank(),content_type:'knowledge',title:'T',summary:'S',root:'lsdyna',images:[{url:'data:image/jpeg;base64,xx',caption:'new',place:'summary'},{url:'data:image/jpeg;base64,yy',caption:'old',place:'summary',orig:{path:'${ORIG_PATH}',caption:'old'}}]};
  KBData={auth:{session:()=>({user:{id:'${OWNER}'}})},canWrite:true,ensureContentSchema:async()=>{},
   uploadImage:async()=>{uploads++;return '${NEW_PATH}';},
   createEntry:async body=>{if(failDiscard){const e=new Error('no');e.status=400;throw e;}return{...body,id:'22222222-2222-4222-8222-222222222222'};},
   discardUploads:async paths=>{discarded.push(...paths);return failDiscard?paths:[];}};`);
 await run('akSaveLive()');
 assert.deepEqual([...run('discarded')],[NEW_PATH]);
 assert.equal(run('AK.d.images[0].uploaded'),NEW_PATH);
 run('failDiscard=false');
 await run('akSaveLive()');
 assert.equal(run('uploads'),1);
 assert.deepEqual([...run('discarded')],[NEW_PATH]);
});
test('network row-write failure keeps the new upload and does not delete originals',async()=>{
 const run=saveHarness();
 run(`globalThis.discarded=0;
  AK.d={...akBlank(),content_type:'knowledge',title:'T',summary:'S',root:'lsdyna',images:[{url:'data:image/jpeg;base64,xx',caption:'new',place:'summary',orig:null},{orig:{path:'${ORIG_PATH}'},url:'keep',caption:'old',place:'summary'}]};
  KBData={auth:{session:()=>({user:{id:'${OWNER}'}})},canWrite:true,ensureContentSchema:async()=>{},
   uploadImage:async()=>'${NEW_PATH}',
   createEntry:async()=>{throw new Error('network');},
   discardUploads:async()=>{discarded++;return[];}};`);
 await run('akSaveLive()');
 assert.equal(run('discarded'),0);
 assert.equal(run('AK.d.images[0].uploaded'),NEW_PATH);
 assert.equal(run('AK.d.images[1].orig.path'),ORIG_PATH);
});
test('discardUploads skips paths it does not own',async()=>{
 const req=[];const run=app(async(url,init)=>{req.push({url,init});return new Response(null,{status:200});});
 run(`globalThis.p=createSupabaseProvider({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})`);
 const failed=await run(`p.discardUploads(['other/22222222-2222-4222-8222-222222222222.jpg','${NEW_PATH}'])`);
 assert.deepEqual([...failed],['other/22222222-2222-4222-8222-222222222222.jpg']);
 assert.equal(req.length,1);
 assert.equal(req[0].init.method,'DELETE');
 assert.ok(req[0].url.endsWith('/'+NEW_PATH));
 assert.equal(req[0].init.headers.Authorization,'Bearer test');
});
