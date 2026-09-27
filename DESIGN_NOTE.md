# Design Note: Scraping Reliability & Trade-offs

## AI Usage Disclosure
AI tools (Google Gemini) were used as a pair-programmer to build the boilerplate structure (Express server, React frontend UI, and database schema logic) and to accelerate the analysis of the DOM structure. 
During the initial attempt, the AI confidently tried to scrape the mock store using standard HTTP fetching (`axios` and `cheerio`), assuming the price would be present in the initial HTML or a clean API response. However, the store explicitly locked the price behind a dynamically injected `.offer-locked` DOM structure that required client-side Javascript evaluation. I corrected the AI by redirecting the strategy to use **Playwright**, orchestrating synthetic interactions to unlock the panel, and implementing robust fallback text-extraction regexes to parse dynamically rendered DOM nodes.

## Reliability Strategy
The core challenge was navigating the mock store's intentionally difficult behavior (prices locked behind UI delays, asynchronous loading, and potential 404/500 errors). 

To ensure the scraper stays reliable across unattended runs:
1. **Headless Browser Fallbacks**: The scraper utilizes Playwright to render the JS bundle fully. It awaits network idleness and strictly handles cookie consent overlays (the `.consent-scrim`) which otherwise block pointer events.
2. **Retry Mechanism**: The backend triggers a simple retry loop (max 3 attempts). If a request errors out or a page shifts unexpectedly causing a timeout, the scraper catches the error and retries with a random jitter delay (1-3 seconds).
3. **Graceful Failures**: If the scraper completely fails to extract the price (e.g. the structure changes entirely and fallback regexes fail), it stores `outcome: 'failed'` in the database and explicitly leaves the price and stock fields empty, ensuring we never pollute the database with stale or incorrect data.
4. **Resilient DOM Selectors**: Instead of relying on a single, brittle CSS class (which the manifest file indicated can rotate, e.g., `crn-w7`), the scraper attempts to find known text nodes and falls back to scanning the entire offer panel's text content for currency symbols (`$`, `₹`, `£`, `€`) using Regex.

## Trade-offs
* **Playwright vs Lightweight HTTP**: Due to the heavy obfuscation and event-driven price rendering, lightweight HTTP fetching was discarded. The trade-off is higher memory usage and slower execution times on the backend. This limits the number of products that can be scraped concurrently on a free-tier Render instance.
* **Synchronous vs Asynchronous Cron**: Free-tier instances sleep. To prevent the cron service from timing out while Playwright scrapes multiple products, the `/api/scrape` endpoint responds immediately with a success message while delegating the actual browser automation to a background promise chain.
