/**
 * Headless E2E against local Vite (demo mode).
 * Run: npx tsx scripts/e2e-smoke.ts
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CAE_KB_URL ?? 'http://127.0.0.1:43127'
const OUT = '/opt/cursor/artifacts'
mkdirSync(OUT, { recursive: true })

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      `--user-data-dir=/tmp/cae-kb-e2e-${Date.now()}`,
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(15000)

  const fail = async (msg: string) => {
    await page.screenshot({ path: `${OUT}/cae_kb_e2e_fail.png`, fullPage: true })
    throw new Error(msg)
  }

  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() =>
    document.body?.innerText.includes('CAE Knowledge Base'),
  )
  await page.screenshot({ path: `${OUT}/cae_kb_e2e_01_home.png` })

  // Seed entries present
  const titles = await page.$$eval('h3', (els) => els.map((e) => e.textContent ?? ''))
  if (!titles.some((t) => t.includes('Washer'))) await fail('missing washer seed')
  if (!titles.some((t) => t.includes('LS-DYNA'))) await fail('missing LS-DYNA seed')

  // Search
  const searchSel = 'input[placeholder*="搜尋"]'
  await page.click(searchSel)
  await page.type(searchSel, 'washer')
  await new Promise((r) => setTimeout(r, 300))
  let count = await page.$$eval('ul.space-y-2 > li', (els) => els.length)
  if (count !== 1) await fail(`search expected 1, got ${count}`)
  await page.screenshot({ path: `${OUT}/cae_kb_e2e_02_search.png` })
  await page.$eval(searchSel, (el) => {
    const input = el as HTMLInputElement
    const proto = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )
    proto?.set?.call(input, '')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await new Promise((r) => setTimeout(r, 200))

  // Category filter chip LS-DYNA in middle column only
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('section button.rounded-full')]
    const chip = chips.find((b) => b.textContent?.trim() === 'LS-DYNA')
    ;(chip as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 200))
  count = await page.$$eval('ul.space-y-2 > li', (els) => els.length)
  if (count !== 1) await fail(`LS-DYNA filter expected 1, got ${count}`)

  // Favorites via sidebar
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('aside button')].find((x) =>
      x.textContent?.includes('我的最愛'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 200))
  count = await page.$$eval('ul.space-y-2 > li', (els) => els.length)
  if (count < 1) await fail('favorites empty')

  // Back to All
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('aside button')].find((x) =>
      x.textContent?.trim().startsWith('All'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 200))

  // Add entry
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('aside button')].find((x) =>
      x.textContent?.includes('新增條目'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await page.waitForSelector('input[placeholder*="Washer"]')
  await page.type('input[placeholder*="Washer"]', 'E2E 測試條目')
  const textareas = await page.$$('textarea')
  await textareas[0].type('自動化測試現象')
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent === '儲存')
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  await page.waitForFunction(() =>
    [...document.querySelectorAll('h3')].some((h) => h.textContent?.includes('E2E 測試條目')),
  )
  await page.screenshot({ path: `${OUT}/cae_kb_e2e_03_created.png` })

  // Soft delete — accept confirm
  page.once('dialog', async (d) => d.accept())
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      x.textContent?.includes('刪除'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 400))

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('aside button')].find((x) =>
      x.textContent?.includes('回收桶'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  const inTrash = await page.evaluate(() =>
    [...document.querySelectorAll('h3')].some((h) => h.textContent?.includes('E2E 測試條目')),
  )
  if (!inTrash) await fail('not in trash')
  await page.screenshot({ path: `${OUT}/cae_kb_e2e_04_trash.png` })

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) =>
      x.textContent?.includes('還原'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 300))

  // Category manager
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('aside button')].find((x) =>
      x.textContent?.includes('管理分類'),
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await page.waitForSelector('input[placeholder="新分類名稱"]')
  await page.type('input[placeholder="新分類名稱"]', 'TempCat')
  await page.evaluate(() => {
    const form = document.querySelector('form')
    const b = form && [...form.querySelectorAll('button')].find((x) => x.textContent?.includes('新增'))
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 300))
  await page.screenshot({ path: `${OUT}/cae_kb_e2e_05_categories.png` })
  const hasTemp = await page.evaluate(() =>
    [...document.querySelectorAll('li span')].some((s) => s.textContent === 'TempCat'),
  )
  if (!hasTemp) await fail('TempCat not created')

  console.log('e2e-smoke: OK')
  await browser.close()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
