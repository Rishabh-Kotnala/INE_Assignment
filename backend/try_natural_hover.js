const { chromium } = require('playwright');
async function tryNaturalHover() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('response', res => {
        if(res.url().includes('quote')) {
            console.log('Quote API fetched:', res.url());
        }
    });

    await page.goto('https://demo.inelabteamdev.com/item/2887');
    await page.waitForTimeout(2000);
    
    // Explicitly hide overlays
    await page.evaluate(() => {
        const scrim = document.querySelector('.consent-scrim');
        if (scrim) scrim.style.display = 'none';
        
        const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"]');
        overlays.forEach(o => o.style.display = 'none');
    });

    const box = await page.locator('.offer-panel').boundingBox();
    if(box) {
        console.log('Moving mouse to:', box.x + box.width/2, box.y + box.height/2);
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 10 });
        await page.waitForTimeout(3000);
        console.log(await page.locator('.offer-panel').innerText());
    }
    
    await browser.close();
}
tryNaturalHover().catch(console.error);
