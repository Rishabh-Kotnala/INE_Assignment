const { chromium } = require('playwright');

async function testSearch() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('response', res => {
        if (res.url().includes('api/v2')) {
            console.log('API call:', res.url());
        }
    });

    console.log('Goto homepage...');
    await page.goto('https://demo.inelabteamdev.com/');
    await page.waitForTimeout(3000);
    
    // Type something in the search bar if it exists
    const searchInputs = await page.locator('input[type="text"], input[type="search"]');
    if (await searchInputs.count() > 0) {
        console.log('Found search input, typing...');
        await searchInputs.first().fill('halvard');
        await page.waitForTimeout(2000);
    } else {
        console.log('No search input found on homepage');
    }

    await browser.close();
}
testSearch().catch(console.log);
