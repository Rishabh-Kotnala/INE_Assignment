const { chromium } = require('playwright');

async function testAggressiveHover() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    try { await page.click('button[aria-label="Allow cookies"]', { timeout: 2000 }); } catch(e){}

    // Try multiple interaction strategies on the panel
    console.log('Dispatching mouseenter, mouseover, hover, and click...');
    const panel = await page.$('.offer-panel');
    if (panel) {
        await panel.dispatchEvent('mouseenter');
        await panel.dispatchEvent('mouseover');
        await panel.click({ force: true });
        await page.hover('.offer-panel', { force: true });
    }

    // Wait and observe
    await page.waitForTimeout(3000);
    const html = await page.innerHTML('.offer-panel');
    console.log('--- PANEL HTML AFTER INTERACTION ---');
    console.log(html);
    
    // Sometimes the price is appended elsewhere?
    const allText = await page.evaluate(() => document.body.innerText);
    if (allText.includes('$') || allText.includes('₹') || allText.includes('£')) {
        console.log('Found currency symbol on page somewhere!');
    }

    await browser.close();
}

testAggressiveHover().catch(console.error);
