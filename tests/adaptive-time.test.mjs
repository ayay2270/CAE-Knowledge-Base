import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const db=JSON.parse(read('data/knowledge-base.json'));
const id='optistruct-nlstat-two-stage-adaptive-time-increment-control-20261029';
const entry=db.entries.find(e=>e.id===id);
const forbidden=/26088|26087|28157|1345|1\.101|1\.379|2\.947|2\.948|59\.948|445\.05|0\.034|0\.278/;
test('OCP teaching data and linked figures contain no model-specific node IDs or readings',()=>{
 for(const e of db.entries.filter(e=>e.id.startsWith('ocp-rail-'))){
  assert.doesNotMatch(JSON.stringify(e),forbidden,e.id);
  for(const f of e.images)assert.doesNotMatch(read(f.src),forbidden,f.src);
 }
});
test('adaptive draft preserves candidate controls and separates document confirmation from solver validation',()=>{
 assert.equal(entry.title,'OptiStruct NLSTAT – Two-Stage Adaptive Time Increment Control');
 assert.equal(entry.category,'optistruct');assert.ok(entry.tags.includes('Nonlinear Analysis'));
 assert.match(entry.summary,/尚未完成求解驗證/);
 const text=Object.values(entry).filter(v=>typeof v==='string').join('\n');
 for(const key of ['TTERM=0.75','TTERM=0.25','NINC=8','NINC=36','DTMAX=0.1','DTMAX=0.007','DIRECT=NO','CNTNLSUB=YES','VALUE REAL 不勾','TSTIME=TOT','D=F','0.09375','0.00694444'])assert.ok(text.includes(key),key);
 assert.match(text,/NINC 會被忽略/);assert.match(text,/逐步卸載/);assert.match(text,/不是.*Crack Load|不稱真正 Crack Load/);
 assert.equal((entry.procedure.match(/^\d+\. /gm)||[]).length,18);
 assert.equal(entry.images.length,5);assert.deepEqual(entry.images,entry.figures);
 assert.doesNotMatch(text,forbidden);
 for(const f of entry.images){assert.match(entry.procedure,new RegExp('(?:^|\\n)'+f.step+'\\. '));assert.match(read(f.src),/示意圖/);}
 const doc=read('docs/knowledge/'+id.replace(/-20261029$/,'')+'.md');
 assert.match(doc,/待 Solver 試跑/);assert.match(doc,/不可直接求解/);assert.match(doc,/TSTIME/);
 for(const page of ['nlparm_bulk','nladapt_bulk','nlout_bulk','cntnlsub_sub','spcd_bulk','tload1_bulk','spcforce_io'])assert.ok(entry.reference_source.includes(page));
});
test('adaptive topic is searchable and linked from both the OCP index and SPCFORCE article',()=>{
 const ctx=vm.createContext({navigator:{platform:'test'},document:{addEventListener(){}},console});
 for(const name of ['content-model','core','figures'])vm.runInContext(read('js/'+name+'.js'),ctx);
 vm.runInContext(`CATS=${JSON.stringify(db.categories)};S.entries=${JSON.stringify(db.entries)};`,ctx);
 for(const q of ['Two-Stage','Nonlinear Analysis','TTERM','DTMAX','CNTNLSUB','VALUE REAL','TSTIME']){
  vm.runInContext(`S.q=${JSON.stringify(q)}`,ctx);assert.ok(vm.runInContext(`visible().some(e=>e.id===${JSON.stringify(id)})`,ctx),q);
 }
 for(const sourceId of ['ocp-rail-force-spcd-test-to-fail-20261029','ocp-rail-spcforce-stress-limit-20261029'])assert.ok(JSON.stringify(db.entries.find(e=>e.id===sourceId)).includes('](#'+id+')'));
});
