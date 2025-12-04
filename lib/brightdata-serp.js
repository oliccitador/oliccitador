/**
 * Bright Data SERP API Integration
 * Uses Bright Data's SERP API for reliable Google Shopping results
 * Replaces unreliable HTML scraping with real API calls
 */

const BRIGHTDATA_API_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const SERP_API_URL = 'https://api.brightdata.com/serp/req';

/**
 * Search Google Shopping via Bright Data SERP API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { titulo, preco, loja, link }
 */
export async function searchGoogleShoppingAPI(query) {
    if (!BRIGHTDATA_API_TOKEN) {
        console.error('[BRIGHTDATA] API Token not configured');
        return [];
    }

    try {
        console.log(`[BRIGHTDATA] Searching: "${query}"`);

        // Build request for Google Shopping search
        const requestBody = {
            zone: "serp",
            url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR`,
            format: "json"
        };

        const response = await fetch(SERP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRIGHTDATA_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[BRIGHTDATA] API Error ${response.status}: ${errorText}`);
            return [];
        }

        const data = await response.json();
        console.log(`[BRIGHTDATA] Response received`);

        // Parse the SERP response
        const results = [];

        // Bright Data returns parsed shopping results
        const shoppingResults = data.shopping_results || data.organic || [];

        for (const item of shoppingResults.slice(0, 10)) {
            // Extract price (various formats)
            let priceStr = item.price || item.extracted_price || '';
            let priceVal = null;

            if (typeof priceStr === 'string') {
                // Clean price string: "R$ 1.234,56" -> 1234.56
                const cleanPrice = priceStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
                priceVal = parseFloat(cleanPrice);
            } else if (typeof priceStr === 'number') {
                priceVal = priceStr;
            }

            if (priceVal && !isNaN(priceVal) && priceVal > 0) {
                results.push({
                    titulo: item.title || item.name || 'Produto',
                    preco: priceVal,
                    preco_formatado: typeof priceStr === 'string' ? priceStr : `R$ ${priceVal.toFixed(2)}`,
                    loja: item.source || item.merchant || item.shop_name || 'Loja Online',
                    link: item.link || item.url || '#',
                    fonte: 'brightdata_serp'
                });
            }
        }

        console.log(`[BRIGHTDATA] Found ${results.length} valid results`);
        return results;

    } catch (error) {
        console.error('[BRIGHTDATA] Error:', error.message);
        return [];
    }
}

/**
 * Alternative: Direct Google Search (not shopping-specific)
 * Useful as fallback when shopping results are empty
 */
export async function searchGoogleAPI(query) {
    if (!BRIGHTDATA_API_TOKEN) {
        console.error('[BRIGHTDATA] API Token not configured');
        return [];
    }

    try {
        console.log(`[BRIGHTDATA] Google Search: "${query}"`);

        const requestBody = {
            zone: "serp",
            url: `https://www.google.com.br/search?q=${encodeURIComponent(query + ' preço comprar')}&hl=pt-BR&gl=BR`,
            format: "json"
        };

        const response = await fetch(SERP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRIGHTDATA_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error(`[BRIGHTDATA] API Error ${response.status}`);
            return [];
        }

        const data = await response.json();
        const results = [];

        // Parse organic results looking for prices
        const organicResults = data.organic || [];

        for (const item of organicResults.slice(0, 5)) {
            // Try to extract price from snippet
            const snippet = item.snippet || item.description || '';
            const priceMatch = snippet.match(/R\$\s*([\d.,]+)/);

            if (priceMatch) {
                const cleanPrice = priceMatch[1].replace(/\./g, '').replace(',', '.');
                const priceVal = parseFloat(cleanPrice);

                if (priceVal && !isNaN(priceVal) && priceVal > 0) {
                    results.push({
                        titulo: item.title || 'Produto',
                        preco: priceVal,
                        preco_formatado: `R$ ${priceMatch[1]}`,
                        loja: new URL(item.link).hostname.replace('www.', ''),
                        link: item.link,
                        fonte: 'brightdata_google'
                    });
                }
            }
        }

        console.log(`[BRIGHTDATA] Google Search found ${results.length} results with prices`);
        return results;

    } catch (error) {
        console.error('[BRIGHTDATA] Google Search Error:', error.message);
        return [];
    }
}
