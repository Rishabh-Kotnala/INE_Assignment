const { chromium } = require('playwright');
const fs = require('fs');

async function testHover() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to product page...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    // Handle cookie consent if it appears
    try {
        console.log('Accepting cookies...');
        await page.click('button[aria-label="Allow cookies"]', { timeout: 3000 });
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log('No cookie consent found or clicked already.');
    }

    console.log('Hovering over the price area...');
    await page.hover('.offer-panel');

    console.log('Waiting for price to unlock...');
    // The panel might change class or load text
    await page.waitForTimeout(4000);

    const offerPanelHtml = await page.innerHTML('.offer-panel');
    console.log('Offer Panel HTML after hover:', offerPanelHtml);
    
    // Extracting all text to see if price is visible
    const text = await page.textContent('.offer-panel');
    console.log('Offer Panel Text:', text.trim().replace(/\s+/g, ' '));

    await browser.close();
}

testHover().catch(console.error);
