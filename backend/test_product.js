const { chromium } = require('playwright');
const fs = require('fs');

async function testProduct() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to demo store...');
    await page.goto('https://demo.inelabteamdev.com/', { waitUntil: 'networkidle' });

    console.log('Clicking on the first product...');
    await page.click('button.card-open');
    
    // Wait for the new page to load
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    const html = await page.content();
    fs.writeFileSync('product_snapshot.html', html);
    console.log('Saved product snapshot to product_snapshot.html');

    await browser.close();
}

testProduct().catch(console.error);
