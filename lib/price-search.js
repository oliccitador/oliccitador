/**
 * Price Search Module - Isolated
 * Scrapes Bing Shopping for Brazilian prices
 * ZERO-COST implementation (no paid APIs)
 */

/**
 * Clean price string to float
 * @param {string} priceStr - e.g. "R$ 1.234,56"
 * @returns {number} - 1234.56
 */
function parsePrice(priceStr) {
    try {
        // Remove R$, spaces, dots (thousands), replace comma with dot
        const clean = priceStr.replace(/[R$\s.]/g, '').replace(',', '.');
        const val = parseFloat(clean);
        return isNaN(val) ? null : val;
    } catch (e) {
        return null;
    }
}

/**
 * Execute search on Bing Shopping
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { loja, preco, link, titulo }
 */
async function searchBingShopping(query) {
    const logPrefix = `[PRICE-SEARCH][${query.substring(0, 20)}...]`;
    try {
        // Use Bing Shopping instead of regular search
        const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}&cc=BR&setmkt=pt-BR`;

        console.log(`${logPrefix} Fetching Bing Shopping: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            throw new Error(`Bing returned ${response.status}`);
        }

        const html = await response.text();

        // Extract Shopping results
        const results = [];

        // Strategy 1: Look for product cards (common pattern in Bing Shopping)
        // Try multiple selectors as Bing Shopping structure varies
        const productPatterns = [
            // Pattern 1: Standard product card
            /<div[^>]*class="[^"]*shop_card[^"]*"[^>]*>(.*?)<\/div>/gs,
            // Pattern 2: Product item
            /<li[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/li>/gs,
            // Pattern 3: Generic item container
            /<div[^>]*data-id="[^"]*"[^>]*class="[^"]*item[^"]*"[^>]*>(.*?)<\/div>/gs
        ];

        let matches = [];
        for (const pattern of productPatterns) {
            const found = Array.from(html.matchAll(pattern));
            if (found.length > 0) {
                matches = found;
                console.log(`${logPrefix} Using pattern, found ${found.length} products`);
                break;
            }
        }

        // Fallback: try to extract from any structured data
        if (matches.length === 0) {
            console.log(`${logPrefix} No products found with patterns, trying generic extraction`);
            // Look for price patterns anywhere in the HTML
            const priceRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g;
            const priceMatches = Array.from(html.matchAll(priceRegex));

            console.log(`${logPrefix} Found ${priceMatches.length} price mentions in HTML`);

            // Extract context around each price (crude but effective)
            for (let i = 0; i < Math.min(priceMatches.length, 10); i++) {
                const match = priceMatches[i];
                const index = match.index;
                const contextBefore = html.substring(Math.max(0, index - 200), index);
                const contextAfter = html.substring(index, Math.min(html.length, index + 200));

                // Try to extract title from context
                const titleMatch = contextBefore.match(/title="([^"]+)"/i) ||
                    contextAfter.match(/title="([^"]+)"/i) ||
                    contextBefore.match(/>([^<]{10,80})</i);

                const title = titleMatch ? titleMatch[1].trim() : 'Produto encontrado';

                // Try to extract link from context
                const linkMatch = contextBefore.match(/href="(https?:\/\/[^"]+)"/i) ||
                    contextAfter.match(/href="(https?:\/\/[^"]+)"/i);
                const link = linkMatch ? linkMatch[1] : '#';

                // Extract store from link
                let store = 'Loja online';
                if (link !== '#') {
                    try {
                        const urlObj = new URL(link);
                        store = urlObj.hostname.replace('www.', '');
                    } catch (e) { }
                }

                const priceVal = parsePrice(match[0]);

                if (priceVal !== null && link !== '#') {
                    results.push({
                        titulo: title,
                        preco: priceVal,
                        preco_formatado: match[0],
                        loja: store,
                        link: link
                    });
                }
            }
        } else {
            // Process structured matches
            for (const match of matches.slice(0, 20)) {
                const productHtml = match[0];

                // Extract Title
                const titleMatch = productHtml.match(/title="([^"]+)"/i) ||
                    productHtml.match(/<h[0-9][^>]*>([^<]+)<\/h[0-9]>/i) ||
                    productHtml.match(/alt="([^"]+)"/i);
                const title = titleMatch ? titleMatch[1].trim() : 'Produto';

                // Extract Link
                const linkMatch = productHtml.match(/href="(https?:\/\/[^"]+)"/i);
                const link = linkMatch ? linkMatch[1] : '#';

                // Extract Price
                const priceMatch = productHtml.match(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/);

                if (priceMatch && link !== '#') {
                    const priceVal = parsePrice(priceMatch[0]);

                    // Extract Store Name
                    let store = 'Loja online';
                    try {
                        const urlObj = new URL(link);
                        store = urlObj.hostname.replace('www.', '');
                    } catch (e) { }

                    if (priceVal !== null) {
                        results.push({
                            titulo: title,
                            preco: priceVal,
                            preco_formatado: priceMatch[0],
                            loja: store,
                            link: link
                        });
                    }
                }
            }
        }

        console.log(`${logPrefix} Valid shopping results found: ${results.length}`);
        return results;

    } catch (error) {
        console.error(`${logPrefix} Error:`, error.message);
        return [];
    }
}

/**
 * Main entry point for Price Search
 * @param {Object} params
 * @param {boolean} params.has_ca
 * @param {string} params.ca_numero
 * @param {string} params.ca_descricao_tecnica
 * @param {string} params.ca_nome_comercial
 * @param {string} params.query_semantica
 * @returns {Promise<Object>}
 */
export async function buscarMelhoresPrecos({ query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica }) {
    let finalQuery = '';
    let origin = '';

    // 1. Determine Query Strategy
    // PRIORITY: Use the explicit 'query' passed from frontend if available
    if (query) {
        finalQuery = query;
        origin = has_ca ? 'frontend_constructed_ca' : 'frontend_constructed_semantic';
        console.log(`[PRICE-SEARCH] Using Frontend Query: "${finalQuery}"`);
    }
    // FALLBACK: Internal construction (legacy/safety)
    else if (has_ca && ca_numero) {
        // FLOW 2: WITH CA - Use ONLY commercial name (CA number doesn't help in e-commerce)
        origin = 'com_ca_nome_comercial';
        const nome = ca_nome_comercial || '';
        finalQuery = nome;
        console.log(`[PRICE-SEARCH] CA Strategy Selected (Fallback): "${finalQuery}"`);
    } else {
        // FLOW 1: NO CA
        if (!query_semantica) {
            console.warn('[PRICE-SEARCH] No semantic query available');
            return {
                produto: "N/A",
                origem_descricao: "sem_ca_query_semantica",
                imagem: "",
                melhores_precos: [],
                fonte: "Bing Shopping - Brasil"
            };
        }
        finalQuery = query_semantica;
        origin = 'sem_ca_query_semantica';
        console.log(`[PRICE-SEARCH] Semantic Strategy Selected (Fallback): "${finalQuery}"`);
    }

    // 2. Perform Search on Bing Shopping
    const rawResults = await searchBingShopping(finalQuery);

    // 3. Filter and Sort
    // Sort by price ascending
    const sortedResults = rawResults.sort((a, b) => a.preco - b.preco);

    // Take top 3
    const top3 = sortedResults.slice(0, 3);

    // LOGGING FOR QA
    console.log('[PRICE-SEARCH] --- QA LOG ---');
    console.log(`Query: ${finalQuery}`);
    console.log(`Total Raw: ${rawResults.length}`);
    console.log(`Top 3 Prices: ${top3.map(i => i.preco).join(', ')}`);
    console.log('---------------------------');

    return {
        produto: finalQuery,
        origem_descricao: origin,
        imagem: "", // Placeholder for future DALL-E integration
        melhores_precos: top3,
        fonte: "Bing Shopping - Brasil"
    };
}
