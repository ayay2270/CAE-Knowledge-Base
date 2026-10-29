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
 assert.equal((entry.procedure.match(/^\d+\. /gm)||[]).length,30);
 assert.equal(entry.images.length,7);assert.deepEqual(entry.images,entry.figures);
 assert.doesNotMatch(text,/28157|1345|1\.379|2\.947|2\.948|59\.948|445\.05|0\.034|0\.278/);
 for(const f of entry.images){assert.match(entry.procedure,new RegExp('(?:^|\\n)'+f.step+'\\. '));assert.match(read(f.src),/示意圖/);}
 const doc=read('docs/knowledge/'+id.replace(/-20261029$/,'')+'.md');
 assert.match(doc,/待 Solver 試跑/);assert.match(doc,/不可直接求解/);assert.match(doc,/TSTIME/);
 for(const page of ['nlparm_bulk','nladapt_bulk','nlout_bulk','cntnlsub_sub','spcd_bulk','tload1_bulk','spcforce_io'])assert.ok(entry.reference_source.includes(page));
});
test('stall revision stays in one entry and treats user checkpoints as unverified targets',()=>{
 assert.equal(db.entries.length,22);assert.equal(db.entries.filter(e=>e.id===id).length,1);
 const text=entry.technical_explanation+'\n'+entry.procedure+'\n'+entry.notes;
 assert.match(text,/使用者回報，未獨立重現/);
 assert.match(text,/待驗證的根因假說/);
 assert.match(text,/未明文定義.*絕對／增量解讀/);
 assert.match(text,/候選 D 分別 -0\.82575 與 -1\.101/);
 assert.equal(-1.101*.75,-.82575);assert.ok(Math.abs(-1.101-(-.82575)-(-.27525))<1e-12);
 for(const value of ['26088','26087','SPCD_STAGE1','SPCD_STAGE2','SUBCASE TIME','CURRENT TIME','LOAD FACTOR','Contact Status','SPCFORCE Z','UZ 應由 -0.82575 變得更負'])assert.ok(text.includes(value),value);
 assert.match(text,/MONITOR DISP 預設.*不能當作 Node 26088 UZ/);
 assert.match(text,/兩方案均未經本案 Solver 試跑/);
 assert.match(text,/與此 B 方案擇一/);
 assert.match(entry.procedure,/26\. .*0 mm.*-0\.82575 mm/);
 assert.match(entry.procedure,/27\. .*不跳回 0.*-1\.101 mm/);
 assert.match(entry.procedure,/28\. .*Averaging.*網格收斂/);
 for(const f of entry.images.slice(5)){
  assert.equal(f.mock,true);assert.match(f.caption,/非.*曲線|非求解數據/);
  assert.match(read(f.src),/累積 Time/);assert.match(read(f.src),/待驗證・示意圖/);
 }
 assert.match(read(entry.images[5].src),/-0\.82575/);
 assert.match(read(entry.images[6].src),/平台/);
});
test('adaptive topic is searchable and linked from both the OCP index and SPCFORCE article',()=>{
 const ctx=vm.createContext({navigator:{platform:'test'},document:{addEventListener(){}},console});
 for(const name of ['content-model','core','figures'])vm.runInContext(read('js/'+name+'.js'),ctx);
 vm.runInContext(`CATS=${JSON.stringify(db.categories)};S.entries=${JSON.stringify(db.entries)};`,ctx);
 for(const q of ['Two-Stage','Nonlinear Analysis','TTERM','DTMAX','CNTNLSUB','VALUE REAL','TSTIME','結果停滯']){
  vm.runInContext(`S.q=${JSON.stringify(q)}`,ctx);assert.ok(vm.runInContext(`visible().some(e=>e.id===${JSON.stringify(id)})`,ctx),q);
 }
 for(const sourceId of ['ocp-rail-force-spcd-test-to-fail-20261029','ocp-rail-spcforce-stress-limit-20261029'])assert.ok(JSON.stringify(db.entries.find(e=>e.id===sourceId)).includes('](#'+id+')'));
});
