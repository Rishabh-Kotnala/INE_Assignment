const { chromium } = require('playwright');

async function testHover3() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    // Handle cookie consent strictly
    try {
        console.log('Accepting cookies...');
        await page.click('button[aria-label="Allow cookies"]', { timeout: 3000 });
        console.log('Waiting for consent scrim to disappear...');
        // Wait for the scrim to be hidden
        await page.waitForSelector('.consent-scrim', { state: 'hidden', timeout: 5000 });
    } catch (e) {
        console.log('No cookie consent found or already hidden.');
    }

    console.log('Attempting to trigger onMouseEnter/onMouseMove organically...');
    const panel = page.locator('.offer-panel');
    const box = await panel.boundingBox();
    
    if (box) {
        // Start from outside and move in
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await page.waitForTimeout(500);
        await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 10, { steps: 5 });
    }

    console.log('Waiting for price to unlock...');
    try {
        await page.waitForFunction(() => {
            return !document.querySelector('.offer-panel').classList.contains('offer-locked');
        }, { timeout: 5000 });
        console.log('Panel unlocked!');
        const html = await page.innerHTML('.offer-panel');
        console.log(html);
        
        // Also fetch the full text to easily regex the price
        const text = await panel.innerText();
        console.log("Panel Text:", text);
    } catch(e) {
        console.log('Still locked :(');
    }

    await browser.close();
}

testHover3().catch(console.error);
