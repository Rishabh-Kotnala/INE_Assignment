const { chromium } = require('playwright');

async function testFullScrape() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    try {
        console.log('Accepting cookies...');
        await page.click('button[aria-label="Allow cookies"]', { timeout: 3000 });
        await page.waitForSelector('.consent-scrim', { state: 'hidden' });
    } catch (e) {
        console.log('No cookie consent found');
    }

    console.log('Clicking an option...');
    await page.click('button.opt-chip:nth-child(2)'); // Click first actual option (after span)
    await page.waitForTimeout(1000);

    console.log('Hovering over price panel...');
    const panel = page.locator('.offer-panel');
    await panel.hover({ force: true });
    
    // Sometimes we just need to click the panel
    await panel.click({ force: true });

    // Let's watch network for quote fetches
    page.on('response', async res => {
        if(res.url().includes('quote')) {
            console.log('QUOTE FETCHED:', res.url());
            console.log(await res.text());
        }
    });

    console.log('Waiting for unlocking...');
    try {
        // Wait for text to change from "Price locked"
        await page.waitForFunction(() => {
            const el = document.querySelector('.offer-panel');
            return el && !el.innerText.includes('Price locked');
        }, { timeout: 8000 });
        console.log('Unlocked!');
    } catch(e) {
        console.log('Still locked...');
    }

    const html = await page.innerHTML('.offer-panel');
    console.log('Final HTML:', html);
    const text = await page.innerText('.offer-panel');
    console.log('Final Text:', text);

    await browser.close();
}
testFullScrape().catch(console.error);
