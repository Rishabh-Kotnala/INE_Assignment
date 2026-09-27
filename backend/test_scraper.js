const { chromium } = require('playwright');
const fs = require('fs');

async function testScrape() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to demo store...');
    await page.goto('https://demo.inelabteamdev.com/', { waitUntil: 'networkidle' });

    console.log('Waiting for content to load...');
    await page.waitForTimeout(5000); // Wait for async loading to kick in

    const html = await page.content();
    console.log('HTML loaded, length:', html.length);
    
    // Write HTML to file to analyze selectors
    fs.writeFileSync('store_snapshot.html', html);
    console.log('Saved snapshot to store_snapshot.html');

    await browser.close();
    console.log('Done.');
}

testScrape().catch(console.error);
