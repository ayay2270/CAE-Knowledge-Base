import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=process.env.TEST_PORT||'18498',out=process.env.REVIEW_DIR||'test-results/adaptive-time';
await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:port},stdio:'pipe',windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('server exit '+code)));});
let browser;
try{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),remote=[],errors=[];
 await context.route(/https:\/\/[^/]+\.supabase\.co\//,r=>{remote.push(r.request().url());return r.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${port}/?source=local`,id='optistruct-nlstat-two-stage-adaptive-time-increment-control-20261029';
 for(const q of ['Two-Stage','Nonlinear Analysis','CNTNLSUB','TSTIME','VALUE REAL']){
  await page.goto(base+'#search/'+encodeURIComponent(q));await page.locator(`.k-row[data-id="${id}"]`).waitFor();
 }
 console.log('PASS five topic searches');
 for(const source of ['ocp-rail-force-spcd-test-to-fail-20261029','ocp-rail-spcforce-stress-limit-20261029']){
  await page.goto(base+'#'+source);await page.locator(`article a[href="#${id}"]`).first().click();await page.waitForFunction(id=>S.sel===id,id);
  await page.goBack();await page.waitForFunction(id=>S.sel===id,source);
 }
 await page.goto(base+'#'+id);await page.locator('article h1').waitFor();await page.reload();await page.locator('article h1').waitFor();
 assert.match(await page.locator('#sec-summary').innerText(),/尚未完成求解驗證/);
 assert.equal(await page.locator('article .c-steps>li').count(),18);
 assert.equal(await page.locator('article figure').count(),5);
 const imgs=await page.locator('article figure img').evaluateAll(els=>els.map(e=>({src:e.getAttribute('src'),step:e.closest('li').id})));
 assert.deepEqual(imgs.map(e=>e.step),['step-5','step-8','step-10','step-11','step-17']);
 for(let i=0;i<5;i++){
  const img=page.locator('article figure img').nth(i);await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());
  await page.locator('article figure button').nth(i).click();await page.locator('.c-lb-img img').evaluate(e=>e.decode());
  assert.match(await page.locator('.c-lb-tag').innerText(),/Step/);await page.locator('#cLbX').click();
 }
 await page.locator('#detail').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:path.join(out,'adaptive-article-desktop.png')});
 for(const viewport of [{width:375,height:812},{width:812,height:375},{width:1440,height:1000}]){
  await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth));
  if(viewport.width===375)await page.screenshot({path:path.join(out,'adaptive-article-mobile.png')});
 }
 console.log('PASS cross-links, Back, deep link/reload, 18 steps, 5 lightboxes, responsive layout');
 await page.setViewportSize({width:1100,height:620});
 for(const f of imgs){
  await page.goto(`http://127.0.0.1:${port}/`+f.src);
  const overflow=await page.locator('svg text').evaluateAll(els=>els.filter(e=>{const b=e.getBBox();return b.x<0||b.y<0||b.x+b.width>1100||b.y+b.height>620;}).map(e=>e.textContent));
  assert.deepEqual(overflow,[],f.src);await page.screenshot({path:path.join(out,path.basename(f.src,'.svg')+'.png')});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 console.log('PASS five original SVG diagrams without clipping; no browser errors or production requests');
}finally{await browser?.close();server.kill();}
