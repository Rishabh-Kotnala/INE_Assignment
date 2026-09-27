const { chromium } = require('playwright');
async function testDeleteScrim() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://demo.inelabteamdev.com/item/2369');
    await page.waitForTimeout(2000);
    
    // Nuke the scrim
    await page.evaluate(() => {
        document.querySelectorAll('.consent-scrim').forEach(e => e.remove());
    });
    
    const box = await page.locator('.offer-panel').boundingBox();
    if (box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 5 });
        await page.waitForTimeout(4000);
        console.log(await page.locator('.offer-panel').innerText());
    }
    await browser.close();
}
testDeleteScrim().catch(console.error);
