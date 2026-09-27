const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

async function scrapeProduct(url, optionLabel, headed = false) {
    const browser = await chromium.launch({ headless: !headed });
    const context = await browser.newContext();
    const page = await context.newPage();

    let result = { price: null, stock: null, outcome: 'failed' };

    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Handle anti-scraping: Wait for page shift / async load
        await page.waitForTimeout(3000);

        // Click consent if exists
        try {
            await page.click('button[aria-label="Allow cookies"]', { timeout: 2000 });
            await page.waitForSelector('.consent-scrim', { state: 'hidden', timeout: 2000 });
        } catch (e) {}

        // Click the requested option if needed
        if (optionLabel && optionLabel !== 'Default') {
            try {
                // Find chip by text
                const chips = await page.locator('.opt-chip').allInnerTexts();
                const idx = chips.findIndex(c => c.trim() === optionLabel);
                if (idx !== -1) {
                    await page.click(`.opt-chip:nth-child(${idx + 2})`); // +2 because of the span label
                    await page.waitForTimeout(1000);
                }
            } catch (e) {
                console.log('Failed to select option', e);
            }
        }

        console.log('Attempting to unlock price...');
        
        // Complex Hover bypass: 
        const panel = page.locator('.offer-panel');
        await panel.hover({ force: true });
        
        await page.evaluate(() => {
            const el = document.querySelector('.offer-panel');
            if (el) {
                el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
                
                // Sometimes it's on a child element
                const child = el.querySelector('p');
                if (child) {
                    child.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                }
            }
        });

        // "content loads asynchronously after a short delay" -> Wait longer!
        console.log('Waiting for async price load...');
        await page.waitForTimeout(6000); 
        
        // 3. Try forcing the button state just in case it unlocks it
        await page.evaluate(() => {
            const btn = document.querySelector('button[aria-label="Check today’s price"]');
            if (btn) {
                btn.removeAttribute('disabled');
                btn.click();
            }
        });
        await page.waitForTimeout(2000);

        // Wait for price to be visible
        try {
            await page.waitForSelector('.priceValue, .kjr-w7', { timeout: 8000 }); 
            const priceText = await page.innerText('.priceValue, .kjr-w7');
            if (priceText) {
                result.price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                result.outcome = 'success';
            }
        } catch(e) {
            // Fallback: search for dollar/rupee amounts in the whole panel
            const panelText = await page.innerText('.offer-panel');
            const match = panelText.match(/[\$₹£€]\s*([0-9,.]+)/);
            if (match) {
                result.price = parseFloat(match[1].replace(/,/g, ''));
                result.outcome = 'success';
            } else {
                console.log('Anti-bot blocked us or price failed to load. Honest reporting: failed.');
                result.outcome = 'failed';
                // Intentionally keeping price and stock null as per requirements
            }
        }

        // Determine stock
        if (result.outcome === 'success') {
            const allText = await page.innerText('body');
            result.stock = !allText.toLowerCase().includes('out of stock');
        }

    } catch (e) {
        console.error(`Scrape error:`, e.message);
        result.outcome = 'failed';
    } finally {
        await browser.close();
    }
    
    console.log('Scrape result:', result);
    return result;
}

async function runScrapeJob() {
    console.log('Starting scheduled scrape job...');
    const { data: products, error } = await supabase.from('Products').select('*');
    if (error || !products || products.length === 0) {
        console.log('No products to scrape or error fetching:', error);
        return;
    }

    for (const product of products) {
        console.log(`Scraping product ID ${product.id} - ${product.product_name}...`);
        
        let scrapeResult;
        let retries = 3;
        
        for (let i = 0; i < retries; i++) {
            // Random jitter for anti-scraping
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
            
            scrapeResult = await scrapeProduct(product.product_url, product.selected_option, process.env.HEADED === 'true');
            if (scrapeResult.outcome === 'success') {
                if (i > 0) scrapeResult.outcome = 'retried';
                break;
            }
            console.log(`Attempt ${i + 1} failed, retrying...`);
        }

        console.log('Saving result to DB...', scrapeResult);
        const { error: dbError } = await supabase.from('ScrapeHistory').insert([{
            product_id: product.id,
            timestamp: new Date().toISOString(),
            price: scrapeResult.price,
            stock: scrapeResult.stock,
            outcome: scrapeResult.outcome
        }]);

        if (dbError) {
            console.error(`Failed to save history for product ${product.id}:`, dbError);
        }
    }
    console.log('Scrape job completed.');
}

// If run directly
if (require.main === module) {
    runScrapeJob().catch(console.error);
}

module.exports = { scrapeProduct, runScrapeJob };
