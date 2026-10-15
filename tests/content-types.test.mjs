import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const db = JSON.parse(source('data/knowledge-base.json'));
const knowledge = { content_type:'knowledge', title:'Rigid Wall', category:'lsdyna', summary:'摘要', technical_explanation:'法向有效側' };
function app(fetch = async () => { throw new Error('Unexpected network'); }) {
  const ctx = vm.createContext({ navigator:{platform:'test'}, document:{addEventListener(){}}, URL, URLSearchParams, location:{search:''}, console, fetch, Response, crypto, localStorage:{getItem:() => JSON.stringify({access_token:'test',refresh_token:'test',expires_at:9999999999,user:{id:'11111111-1111-4111-8111-111111111111',email:'test@example.invalid'}})} });
  for (const f of ['content-model','core','figures','add-knowledge','provider-local','provider-supabase']) vm.runInContext(source('js/'+f+'.js'), ctx, {filename:f});
  vm.runInContext(`CATS = ${JSON.stringify(db.categories)}; globalThis.KBData = {imageUrl:p=>p,canDelete:()=>false};`,ctx);
  return text => vm.runInContext(text,ctx);
}
test('required fields depend on explicit type; optional fields may be empty',()=>{
 const run=app(); run('AK.d=akBlank()'); assert.equal(run('akValidate(1)'),false); assert.equal(run('AK.err.content_type'),'required');
 run(`Object.assign(AK.d,${JSON.stringify(knowledge)})`); assert.equal(run('akValidate(2)'),true);
 run(`AK.d.content_type='troubleshooting'`); assert.equal(run('akValidate(2)'),false);
 run(`Object.assign(AK.d,{symptom:'a',root_cause:'b',solution:'c'})`); assert.equal(run('akValidate(2)'),true);
});
test('renderer hides inactive and empty optional sections, retains image-only sections',()=>{
 const run=app(); run(`globalThis.e=${JSON.stringify(knowledge)}`); assert.equal(run('cArticleSections(e,[]).map(s=>s[0]).join()'),'summary,technical_explanation');
 run(`e.images=[{src:'local.svg',section:'procedure',step:2}]`); assert.equal(run('cArticleSections(e,cFigs(e)).map(s=>s[0]).join()'),'summary,technical_explanation,procedure');
 assert.equal(run(`cSectionsHtml(cArticleSections(e,cFigs(e))).includes('問題現象')`),false);
});
test('all existing entries and legacy placements render without dropping figures',()=>{
 const run=app(); for(const e of db.entries){ run(`globalThis.e=${JSON.stringify(e)}`); assert.equal(run('KBContent.type(e)'),'troubleshooting'); assert.equal(run(`cSectionsHtml(cArticleSections(e,cFigs(e))).match(/id="fig-/g)?.length||0`),(e.figures||e.images).length); }
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
 assert.ok(req.find(r=>r.url.includes('technical_explanation')));for(const r of req.filter(r=>['POST','PATCH'].includes(r.init.method))){const body=JSON.parse(r.init.body); assert.equal(body.content_type,'knowledge');assert.equal(body.symptom,'');assert.equal('user_id'in body,false);assert.equal('views'in body,false);assert.equal(r.init.headers.Authorization,'Bearer test');}
});
test('pre-migration load falls back to legacy columns and writes fail explicitly',async()=>{
 const req=[];const run=app(async(url,init)=>{req.push(url);if(url.includes('software_categories'))return Response.json(db.categories);if(url.includes('content_type')||init.method!=='GET')return Response.json({code:'42703'},{status:400});return Response.json([db.entries[0]]);});
 run(`globalThis.p=createSupabaseProvider({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})`);
 assert.equal((await run('p.load()')).entries[0].content_type,'troubleshooting');assert.equal(req.length,3);await assert.rejects(run(`p.createEntry(${JSON.stringify(knowledge)})`),/phase5-content-types.sql/);
});
test('local provider normalizes legacy type and preserves default figures',async()=>{
 const run=app(async()=>Response.json(db));const result=await run('LocalProvider.load()');assert.equal(result.entries[0].content_type,'troubleshooting');assert.equal(result.entries.find(e=>e.id==='demo-hm-step').figures.length,8);
});
test('migration is additive and extends only phase4 content update grants',()=>{
 const sql=source('supabase/phase5-content-types.sql').replace(/--[^\n]*/g,'');assert.doesNotMatch(sql,/\b(drop|delete|truncate|rename)\b|\bupdate\s+public\./i);assert.equal((sql.match(/add column if not exists/g)||[]).length,6);assert.match(sql,/grant update \(content_type, summary, technical_explanation, procedure, key_rules, verification\)/);
});


test('type-aware snippets and legacy-only placements never leak into knowledge',()=>{
 const run=app();
 run(`globalThis.e={content_type:'troubleshooting',symptom:'active symptom',summary:'dormant summary'}; S.q=''`);
 assert.equal(run('KBH.snippet(e)'), 'active symptom');
 run(`AK.d={...akBlank(),content_type:'troubleshooting',images:[{place:'ref',url:'reference'},{place:'fails',url:'failure'}]}`);
 assert.equal(run('akNormalizePlaces()'),0);
 run(`AK.d.content_type='knowledge'`);assert.equal(run('akNormalizePlaces()'),2);assert.equal(run('AK.d.images.map(im=>im.place).join()'),'summary,summary');
});
