/**
 * SerpApi Integration
 * Uses SerpApi.com for reliable Google Shopping results
 */

const SERPAPI_KEY = process.env.SERPAPI_KEY || process.env.BRIGHTDATA_API_TOKEN; // Fallback to the variable we just set
const BASE_URL = 'https://serpapi.com/search.json';

/**
 * Search Google Shopping via SerpApi
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { titulo, preco, loja, link }
 */
export async function searchGoogleShoppingAPI(query) {
    if (!SERPAPI_KEY) {
        console.error('[SERPAPI] API Key not configured');
        return [];
    }

    try {
        console.log(`[SERPAPI] Searching: "${query}"`);

        const params = new URLSearchParams({
            engine: "google_shopping",
            q: query,
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: SERPAPI_KEY
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SERPAPI] API Error ${response.status}: ${errorText}`);
            return [];
        }

        const data = await response.json();
        const results = [];

        const shoppingResults = data.shopping_results || [];

        for (const item of shoppingResults.slice(0, 10)) {
            if (item.price) {
                // Price usually comes as "R$ 1.234,56"
                const priceStr = item.price;
                const cleanPrice = priceStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
                const priceVal = parseFloat(cleanPrice);

                if (priceVal && !isNaN(priceVal)) {
                    results.push({
                        titulo: item.title,
                        preco: priceVal,
                        preco_formatado: priceStr,
                        loja: item.source || item.merchant?.name || 'Loja Online',
                        link: item.link,
                        fonte: 'serpapi_shopping'
                    });
                }
            }
        }

        console.log(`[SERPAPI] Found ${results.length} valid results`);
        return results;

    } catch (error) {
        console.error('[SERPAPI] Error:', error.message);
        return [];
    }
}

/**
 * Fallback: Direct Google Search via SerpApi
 */
export async function searchGoogleAPI(query) {
    if (!SERPAPI_KEY) {
        return [];
    }

    try {
        console.log(`[SERPAPI] Google Search: "${query}"`);

        const params = new URLSearchParams({
            engine: "google",
            q: query + " preço comprar",
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: SERPAPI_KEY
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);
        const data = await response.json();
        const results = [];

        const organicResults = data.organic_results || [];

        for (const item of organicResults.slice(0, 5)) {
            // Try to extract price from rich snippet or snippet
            let priceVal = null;
            let priceStr = '';

            // Check for rich snippet price
            if (item.rich_snippet?.top?.detected_extensions?.price) {
                priceVal = item.rich_snippet.top.detected_extensions.price;
                priceStr = `R$ ${priceVal}`;
            }
            // Regex on snippet
            else if (item.snippet) {
                const match = item.snippet.match(/R\$\s*([\d.,]+)/);
                if (match) {
                    priceStr = match[0];
                    priceVal = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
                }
            }

            if (priceVal) {
                results.push({
                    titulo: item.title,
                    preco: priceVal,
                    preco_formatado: priceStr,
                    loja: new URL(item.link).hostname.replace('www.', ''),
                    link: item.link,
                    fonte: 'serpapi_google'
                });
            }
        }

        return results;

    } catch (error) {
        console.error('[SERPAPI] Google Search Error:', error.message);
        return [];
    }
}
