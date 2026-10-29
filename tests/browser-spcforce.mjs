import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=process.env.REVIEW_DIR || '.local-review/spcforce';
await fs.mkdir(out,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'8098'},stdio:'pipe',windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
let browser;
try{
 browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route(/https:\/\/[^/]+\.supabase\.co\//,()=>{throw new Error('Unexpected Supabase request');});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8098/',id='ocp-rail-spcforce-stress-limit-20261029';
 const old=['ocp-rail-force-spcd-test-to-fail-20261029','ocp-rail-spcd-123456-mismatch-20261029'];
 for(const q of ['SPCFORCE','反力','60MPa','NLOUT','50kgf','Force→SPCD']){
  await page.goto(base+'?source=local#search/'+encodeURIComponent(q));
  await page.locator(`.k-row[data-id="${id}"]`).waitFor();
 }
 console.log('PASS six search queries find the independent tutorial');
 for(const previous of old){
  await page.goto(base+'?source=local#'+previous);
  await page.locator(`.c-related [data-id="${id}"]`).click();
  await page.waitForFunction(id=>S.sel===id,id);
  await page.locator(`.c-related [data-id="${previous}"]`).waitFor();
  await page.goBack();await page.waitForFunction(id=>S.sel===id,previous);
 }
 console.log('PASS both Force→SPCD articles link to SPCFORCE and Back restores the article');
 await page.goto(base+'?source=local#'+id);await page.locator('article h1').waitFor();
 await page.reload();await page.locator('article h1').waitFor();
 assert.equal(await page.locator('article .k-content-type').innerText(),'技術知識');
 assert.equal(await page.locator('article figure').count(),4);
 const images=await page.locator('article figure img').evaluateAll(els=>els.map(e=>({src:e.getAttribute('src'),step:e.closest('li')?.id})));
 assert.deepEqual(images.map(e=>e.step),['step-2','step-5','step-6','step-7']);
 for(let i=0;i<4;i++){
  const img=page.locator('article figure img').nth(i);await img.scrollIntoViewIfNeeded();
  await img.evaluate(e=>e.decode());assert.ok(await img.evaluate(e=>e.naturalWidth>0));
  await page.locator('article figure button').nth(i).click();await page.locator('.c-lb-img img').evaluate(e=>e.decode());
  assert.match(await page.locator('.c-lb-tag').innerText(),/Step/);await page.locator('#cLbX').click();
 }
 await page.locator('#detail').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:path.join(out,'spcforce-article-desktop.png')});
 for(const viewport of [{width:375,height:812},{width:812,height:375},{width:1440,height:1000}]){
  await page.setViewportSize(viewport);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('#detail').evaluate(e=>e.scrollWidth<=e.clientWidth));
  if(viewport.width===375)await page.screenshot({path:path.join(out,'spcforce-article-mobile.png')});
 }
 console.log('PASS deep link/reload, all four step figures, lightbox and responsive widths');
 await page.setViewportSize({width:960,height:600});
 for(const {src} of images){
  await page.goto(base+src);await page.locator('svg').waitFor();
  const overflow=await page.locator('svg text').evaluateAll(els=>els.filter(e=>{const b=e.getBBox();return b.x<0||b.y<0||b.x+b.width>960||b.y+b.height>600;}).map(e=>e.textContent));
  assert.deepEqual(overflow,[],src+' SVG text bounds');
  await page.screenshot({path:path.join(out,path.basename(src,'.svg')+'.png')});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS all SVG text stays in bounds; no browser errors');
}finally{await browser?.close();server.kill();}
