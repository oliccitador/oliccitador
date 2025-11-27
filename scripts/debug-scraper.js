// Debug ScraperAPI implementation
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "440c46865556baaaa0d292ef1a2b92f7";

async function testScraperAPI(query) {
    console.log(`[TEST] Testing ScraperAPI with query: "${query}"`);

    try {
        const mlSearchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
        const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(mlSearchUrl)}`;

        console.log(`[TEST] Target URL: ${mlSearchUrl}`);
        console.log(`[TEST] ScraperAPI URL: ${scraperUrl}`);

        const response = await fetch(scraperUrl);

        console.log(`[TEST] Response Status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`[TEST] Error Body: ${text.substring(0, 500)}`);
            return;
        }

        const html = await response.text();
        console.log(`[TEST] HTML Length: ${html.length} bytes`);
        console.log(`[TEST] HTML Preview (first 1000 chars):\n${html.substring(0, 1000)}`);

        // Test parsing
        const productPattern = /<li class="ui-search-layout__item"[\s\S]*?<\/li>/gi;
        const matches = html.match(productPattern) || [];
        console.log(`[TEST] Found ${matches.length} product matches`);

        if (matches.length > 0) {
            console.log(`[TEST] First product HTML (first 2000 chars):\n${matches[0].substring(0, 2000)}`);

            // Test extraction logic
            const productHTML = matches[0];

            const titleMatch = productHTML.match(/<h2[^>]*class="[^"]*poly-component__title[^"]*"[^>]*>(.*?)<\/h2>/i);
            console.log(`[TEST] Title Match:`, titleMatch ? titleMatch[1] : 'NOT FOUND');

            const priceMatch = productHTML.match(/<span class="[^"]*andes-money-amount__fraction[^"]*"[^>]*>([0-9.]+)<\/span>/i);
            console.log(`[TEST] Price Match:`, priceMatch ? priceMatch[1] : 'NOT FOUND');

            const linkMatch = productHTML.match(/href="([^"]*)" class="[^"]*poly-component__title/i);
            console.log(`[TEST] Link Match:`, linkMatch ? linkMatch[1] : 'NOT FOUND');
        }

    } catch (error) {
        console.error('[TEST] Exception:', error);
    }
}

testScraperAPI("luva de segurança");
