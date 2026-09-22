import puppeteer from 'puppeteer-core'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--user-data-dir=/tmp/cae-kb-mobile',
    ],
    defaultViewport: { width: 390, height: 844, isMobile: true },
  })
  const page = await browser.newPage()
  await page.goto('http://127.0.0.1:43127/', { waitUntil: 'networkidle0' })
  await page.screenshot({ path: '/opt/cursor/artifacts/cae_kb_mobile_list.png' })
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(
      (x) => x.getAttribute('aria-label') === '開啟選單',
    )
    ;(b as HTMLButtonElement | undefined)?.click()
  })
  await new Promise((r) => setTimeout(r, 400))
  await page.screenshot({ path: '/opt/cursor/artifacts/cae_kb_mobile_sidebar.png' })
  await browser.close()
  console.log('mobile screenshots: OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
