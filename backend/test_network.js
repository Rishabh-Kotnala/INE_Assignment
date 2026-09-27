const { chromium } = require('playwright');

async function testNetwork() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('response', async response => {
        const url = response.url();
        if (url.includes('inelabteamdev') || url.includes('.json') || url.includes('api')) {
            console.log('Response URL:', url, 'Status:', response.status());
            if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
                try {
                    const text = await response.text();
                    console.log('--- Body Preview ---');
                    console.log(text.substring(0, 300));
                    console.log('--------------------');
                } catch (e) {
                    console.log('Could not read body');
                }
            }
        }
    });

    console.log('Navigating...');
    await page.goto('https://demo.inelabteamdev.com/', { waitUntil: 'networkidle' });
    
    // Click on a product to see how the product page loads
    console.log('Clicking on the first product...');
    await page.click('button.card-open');
    await page.waitForTimeout(5000);
    
    await browser.close();
}

testNetwork().catch(console.error);
