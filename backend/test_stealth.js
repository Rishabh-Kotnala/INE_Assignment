const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function testStealth() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://demo.inelabteamdev.com/item/2369');
    await page.waitForTimeout(3000);
    try { await page.click('button[aria-label="Allow cookies"]'); } catch(e){}
    await page.waitForTimeout(1000);
    const box = await page.locator('.offer-panel').boundingBox();
    if (box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 5 });
        await page.waitForTimeout(4000);
        console.log(await page.locator('.offer-panel').innerText());
    }
    await browser.close();
}
testStealth().catch(console.error);
