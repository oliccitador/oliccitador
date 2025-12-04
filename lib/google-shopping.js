/**
 * Google Shopping Scraper Module
 * Scrapes Google Shopping results for Brazilian prices
 * ZERO-COST implementation (no paid APIs)
 */

/**
 * Scrape Google Shopping for a given query
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { loja, preco, link, titulo }
 */
export async function searchGoogleShopping(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.google.com/search?tbm=shop&q=${encodedQuery}&hl=pt-BR&gl=BR`;

        console.log(`[GOOGLE-SHOPPING] Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const results = [];

        // Regex patterns for Google Shopping HTML structure
        // Note: Google changes classes frequently, so we use structural patterns where possible

        // Pattern 1: Standard Grid Item
        // Looks for price pattern R$ X.XXX,XX followed by merchant name
        const itemRegex = /<div[^>]*class="[^"]*sh-dgr__content[^"]*"[^>]*>([\s\S]*?)<\/div>/gs;

        let match;
        while ((match = itemRegex.exec(html)) !== null) {
            const itemHtml = match[1];

            // Extract Title
            const titleMatch = itemHtml.match(/<h3[^>]*>([^<]+)<\/h3>/) ||
                itemHtml.match(/<div[^>]*class="[^"]*tAxDx[^"]*"[^>]*>([^<]+)<\/div>/);

            // Extract Price
            const priceMatch = itemHtml.match(/R\$\s*([\d.,]+)/);

            // Extract Merchant
            const merchantMatch = itemHtml.match(/<div[^>]*class="[^"]*aULzUe[^"]*"[^>]*>([^<]+)<\/div>/) ||
                itemHtml.match(/<span[^>]*class="[^"]*IuHnof[^"]*"[^>]*>([^<]+)<\/span>/);

            // Extract Link
            const linkMatch = itemHtml.match(/href="([^"]+)"/);

            if (titleMatch && priceMatch) {
                const priceStr = priceMatch[1].replace(/\./g, '').replace(',', '.');
                const price = parseFloat(priceStr);

                // Filter out invalid prices
                if (isNaN(price) || price <= 0) continue;

                let link = linkMatch ? linkMatch[1] : '';
                if (link.startsWith('/url?q=')) {
                    link = link.split('/url?q=')[1].split('&')[0];
                }
                if (link.startsWith('/')) {
                    link = 'https://www.google.com' + link;
                }

                results.push({
                    titulo: titleMatch[1].replace(/&amp;/g, '&'),
                    preco: price,
                    preco_formatado: `R$ ${priceMatch[1]}`,
                    loja: merchantMatch ? merchantMatch[1] : 'Google Shopping',
                    link: decodeURIComponent(link),
                    fonte: 'google_shopping'
                });
            }
        }

        console.log(`[GOOGLE-SHOPPING] Found ${results.length} results`);
        return results.slice(0, 5); // Return top 5

    } catch (error) {
        console.error('[GOOGLE-SHOPPING] Error:', error.message);
        return [];
    }
}
