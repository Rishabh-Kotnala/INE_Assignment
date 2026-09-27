const { chromium } = require('playwright');
async function dumpAuth() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://demo.inelabteamdev.com/item/2887');
    
    try { await page.click('button[aria-label="Allow cookies"]'); } catch(e){}
    await page.waitForTimeout(2000);
    
    const cookies = await context.cookies();
    const ls = await page.evaluate(() => JSON.stringify(window.localStorage));
    const ss = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    
    console.log('COOKIES:', cookies);
    console.log('LOCALSTORAGE:', ls);
    console.log('SESSIONSTORAGE:', ss);
    await browser.close();
}
dumpAuth().catch(console.error);
