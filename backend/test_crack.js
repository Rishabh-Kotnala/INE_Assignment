const { chromium } = require('playwright');
const fs = require('fs');

async function testCrack() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('response', async res => {
        if (res.url().includes('api/v2/items/')) {
            try {
                const json = await res.json();
                console.log('Intercepted:', res.url());
            } catch (e) {}
        }
    });

    console.log('Navigating to product page...');
    await page.goto('https://demo.inelabteamdev.com/item/2541', { waitUntil: 'networkidle' });

    console.log('Waiting for manual interaction... please hover over the price in the browser window to see what network calls happen!');
    
    // We leave it open for 30 seconds so we can observe the browser manually
    await page.waitForTimeout(30000);
    
    console.log('Done waiting.');
    await browser.close();
}

testCrack().catch(console.error);
