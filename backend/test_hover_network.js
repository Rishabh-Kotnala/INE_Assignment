const { chromium } = require('playwright');

async function testHoverNetwork() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('response', async res => {
        if (res.url().includes('inelabteamdev')) {
            console.log('NET:', res.url());
            if (res.url().includes('quote') || res.url().includes('price') || res.url().includes('stock')) {
                try { console.log(await res.text()); } catch(e){}
            }
        }
    });

    console.log('Navigating...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    try {
        await page.click('button[aria-label="Allow cookies"]', { timeout: 3000 });
        await page.waitForSelector('.consent-scrim', { state: 'hidden' });
    } catch (e) { }

    console.log('Hovering...');
    await page.hover('.offer-panel', { force: true });
    
    // Also try forcing the hover state via CSS just in case
    await page.evaluate(() => {
        const el = document.querySelector('.offer-panel');
        if(el) {
            el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
        }
    });

    await page.waitForTimeout(5000);
    const html = await page.innerHTML('.offer-panel');
    console.log('HTML:', html);

    await browser.close();
}
testHoverNetwork().catch(console.error);
