const { chromium } = require('playwright');

async function testHover() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    try {
        console.log('Accepting cookies...');
        await page.click('button[aria-label="Allow cookies"]', { timeout: 3000 });
        await page.waitForTimeout(500);
    } catch (e) { }

    console.log('Finding panel...');
    const panel = page.locator('.offer-panel');
    const box = await panel.boundingBox();
    
    if (box) {
        console.log('Moving mouse to panel...');
        await page.mouse.move(box.x + 10, box.y + 10);
        await page.waitForTimeout(500);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    }

    console.log('Waiting for price...');
    try {
        // Wait for offer-locked to be removed
        await page.waitForFunction(() => {
            return !document.querySelector('.offer-panel').classList.contains('offer-locked');
        }, { timeout: 10000 });
        console.log('Panel unlocked!');
    } catch(e) {
        console.log('Panel did not unlock. Still locked.');
    }

    const html = await page.innerHTML('.offer-panel');
    console.log(html);

    await browser.close();
}

testHover().catch(console.error);
