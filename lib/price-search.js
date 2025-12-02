/**
 * Price Search Module - Isolated
 * Scrapes Bing Search results for Brazilian prices
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
        return parseFloat(clean);
    } catch (e) {
        return null;
    }
}

/**
 * Execute search on Bing
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { loja, preco, link, titulo }
 */
async function searchBing(query) {
    try {
        // Add "preço" and "comprar" to enforce shopping intent
        const searchQuery = `${query} preço comprar`;
        const url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&cc=BR`;

        console.log(`[PRICE-SEARCH] Fetching: ${url}`);

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

        // Extract results using Regex (since we don't have cheerio)
        // Targeting rich snippets and standard results with prices
        const results = [];

        // Regex strategies for different Bing layouts

        // Strategy 1: Standard results with price text
        // Look for "R$ XX,XX" pattern
        const priceRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g;
        let match;

        // We need to associate prices with titles/links. 
        // This is hard with regex on raw HTML.
        // Simplified approach: Extract "b_algo" blocks (standard results)

        const resultBlocks = html.split('class="b_algo"');

        // Skip first split (header)
        for (let i = 1; i < resultBlocks.length; i++) {
            const block = resultBlocks[i];

            // Extract Title
            const titleMatch = block.match(/<h2[^>]*>.*?<a[^>]*>(.*?)<\/a>/s);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Produto sem título';

            // Extract Link
            const linkMatch = block.match(/href="([^"]*)"/);
            const link = linkMatch ? linkMatch[1] : '#';

            // Extract Price
            const priceMatch = block.match(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/);

            if (priceMatch && link !== '#') {
                const priceVal = parsePrice(priceMatch[0]);

                // Extract Store Name (heuristic: domain from link)
                let store = 'Loja desconhecida';
                try {
                    const urlObj = new URL(link);
                    store = urlObj.hostname.replace('www.', '');
                } catch (e) { }

                results.push({
                    titulo: title,
                    preco: priceVal,
                    preco_formatado: priceMatch[0],
                    loja: store,
                    link: link
                });
            }
        }

        return results;

    } catch (error) {
        console.error('[PRICE-SEARCH] Error:', error.message);
        return [];
    }
}

/**
 * Main entry point for Price Search
 * @param {Object} params
 * @param {boolean} params.has_ca
 * @param {string} params.ca_numero
 * @param {string} params.ca_descricao_tecnica
 * @param {string} params.query_semantica
 * @returns {Promise<Object>}
 */
export async function buscarMelhoresPrecos({ has_ca, ca_numero, ca_descricao_tecnica, query_semantica }) {
    let finalQuery = '';
    let origin = '';

    // 1. Determine Query based on CA existence
    if (has_ca && ca_numero) {
        // FLOW 2: WITH CA
        // Use CA + Technical Description
        // We use the full description to ensure accuracy (Bing handles long queries)
        const desc = ca_descricao_tecnica || '';
        finalQuery = `CA ${ca_numero} ${desc}`;
        origin = 'com_ca_numero+descricao_tecnica';
        console.log(`[PRICE-SEARCH] Using CA Strategy: "${finalQuery}"`);
    } else {
        // FLOW 1: NO CA
        // Use Semantic Query
        if (!query_semantica) {
            console.warn('[PRICE-SEARCH] No semantic query available');
            return { error: 'Sem termos de busca definidos' };
        }
        finalQuery = query_semantica;
        origin = 'sem_ca_query_semantica';
        console.log(`[PRICE-SEARCH] Using Semantic Strategy: "${finalQuery}"`);
    }

    // 2. Perform Search
    const rawResults = await searchBing(finalQuery);

    // 3. Filter and Sort
    // Sort by price ascending
    const sortedResults = rawResults.sort((a, b) => a.preco - b.preco);

    // Take top 3
    const top3 = sortedResults.slice(0, 3);

    return {
        produto: finalQuery,
        origem_descricao: origin,
        melhores_precos: top3,
        fonte: "WebSearch Bing - Brasil"
    };
}
