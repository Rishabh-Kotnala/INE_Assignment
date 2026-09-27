const { chromium } = require('playwright');

async function crack() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://demo.inelabteamdev.com/item/2369');
    await page.waitForTimeout(2000);
    
    try { await page.click('button[aria-label="Allow cookies"]', { timeout: 2000 }); } catch(e){}
    await page.waitForTimeout(1000);
    
    // Simulate human mouse movement
    const box = await page.locator('.offer-panel').boundingBox();
    if(box) {
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 100 });
        await page.waitForTimeout(5000); // Wait for the network request and react state
        const text = await page.locator('.offer-panel').innerText();
        console.log("RESULT:", text);
    }
    await browser.close();
}
crack().catch(console.error);
