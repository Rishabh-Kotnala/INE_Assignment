const { chromium } = require('playwright');
async function testBypass() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Hide webdriver
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    });

    await page.goto('https://demo.inelabteamdev.com/item/2887');
    await page.waitForTimeout(2000);
    
    try { await page.click('button[aria-label="Allow cookies"]'); } catch(e){}
    await page.waitForTimeout(2000);

    const box = await page.locator('.offer-panel').boundingBox();
    if(box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 10 });
        await page.waitForTimeout(4000);
        console.log(await page.locator('.offer-panel').innerText());
    }
    
    await browser.close();
}
testBypass().catch(console.error);
