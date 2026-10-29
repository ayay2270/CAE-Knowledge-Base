import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const db=JSON.parse(await fs.readFile(path.join(root,'data/knowledge-base.json'),'utf8'));
const ocp=db.entries.filter(e=>e.id.startsWith('ocp-rail-'));
const index='ocp-rail-force-spcd-test-to-fail-20261029';
const tutorial='ocp-rail-hyperview-node-uz-force-to-spcd-20261029';
const out=process.env.REVIEW_DIR||path.join(root,'test-results','ocp-rail');
await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PORT:'8098'},stdio:'pipe',windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(new Error('server exit '+c)));});
let browser;
const errors=[],remote=[];
try{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route(/https:\/\/[^/]+\.supabase\.co\//,r=>{remote.push(r.request().url());return r.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8098/?source=local';
 async function open(id){await page.goto(base+'#'+id);await page.waitForFunction(id=>C.view==='article'&&S.sel===id,id);}
 for(const e of ocp){
  await open(e.id);
  assert.equal(await page.locator('.c-article>h1').innerText(),e.title);
  assert.equal(await page.locator('.c-inline-fig').count(),e.images.length);
  const bad=await page.locator('.c-inline-fig img').evaluateAll(async imgs=>{
   await Promise.all(imgs.map(im=>{im.loading='eager';return im.decode().catch(()=>{});}));
   return imgs.filter(im=>!im.complete||im.naturalWidth===0).map(im=>im.src);
  });assert.deepEqual(bad,[],e.id);
  if(e.id!==index){await page.locator(`.c-article .prose a[href="#${index}"]`).first().click();await page.waitForFunction(id=>S.sel===id,index);assert.match(page.url(),/\?source=local#/);}
 }
 console.log('PASS all 11 OCP entries, all inline images, and backlinks load');
 await open(index);
 for(const e of ocp.filter(e=>e.id!==index)){
  await page.locator(`.c-article a[href="#${e.id}"]`).first().click();await page.waitForFunction(id=>S.sel===id,e.id);
  await page.goBack();await page.waitForFunction(id=>S.sel===id,index);
 }
 console.log('PASS index links and browser Back preserve local source and article state');
 await page.goto(base);await page.locator('#q').fill('HyperView UZ');await page.waitForFunction(()=>S.q==='HyperView UZ');await page.locator('#q').press('Enter');await page.waitForFunction(()=>C.view==='search');
 await page.locator(`.k-row[data-id="${tutorial}"]`).click();await page.waitForFunction(id=>S.sel===id,tutorial);
 assert.equal(await page.locator('.c-steps>li').count(),28);
 await page.locator('.c-inline-thumb').first().click();await page.locator('#cLb').waitFor();
 assert.ok(await page.locator('#cLb .c-lb-img img').evaluate(im=>im.complete&&im.naturalWidth>0));
 await page.screenshot({path:path.join(out,'tutorial-lightbox.png')});
 await page.keyboard.press('Escape');await page.locator('#cLb').waitFor({state:'detached'});
 await page.locator('#detail').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:path.join(out,'tutorial-desktop.png')});
 await page.locator('#step-9').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'tutorial-node-selection.png')});
 await page.setViewportSize({width:390,height:844});await open(tutorial);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile page overflow');
 await page.locator('#step-19').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'tutorial-mobile.png')});
 console.log('PASS search, 28 tutorial steps, lightbox, desktop/mobile layout');
 await page.setViewportSize({width:1100,height:620});
 const svgs=await fs.readdir(path.join(root,'assets/figures/ocp-rail'));
 for(const f of svgs.filter(f=>/^(07|08|09|10|11)-/.test(f))){
  await page.goto('http://127.0.0.1:8098/assets/figures/ocp-rail/'+f);
  const overflow=await page.locator('svg text').evaluateAll(nodes=>nodes.filter(el=>{const b=el.getBBox();return b.x<0||b.y<0||b.x+b.width>1100||b.y+b.height>620;}).map(el=>el.textContent));
  assert.deepEqual(overflow,[],f+': text out of canvas');
  await page.screenshot({path:path.join(out,f.replace('.svg','.png'))});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 console.log('PASS five SVGs rendered without text clipping; no page errors or production requests');
}finally{await browser?.close();server.kill();}
