/**
 * Price Search Module - Isolated
 * Scrapes Bing Search results for Brazilian prices
 * ZERO-COST implementation (no paid APIs)
 */

/**
 * Clean price string to float
 * @param {string} priceStr - e.g. "R$ 1.234,56"
/**
 * Price Search Module - Isolated
 * Scrapes Bing Search results for Brazilian prices
 * ZERO-COST implementation (no paid APIs)
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
 * Execute search on Bing
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { loja, preco, link, titulo }
 */
async function searchBing(query) {
    const logPrefix = `[PRICE-SEARCH][${query.substring(0, 20)}...]`;
    try {
        // Add "preço" and "comprar" to enforce shopping intent
        const searchQuery = `${query} preço comprar`;
        const url = `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}&cc=BR`;

        console.log(`${logPrefix} Fetching: ${url}`);

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
        const results = [];
        const resultBlocks = html.split('class="b_algo"');

        console.log(`${logPrefix} Raw blocks found: ${resultBlocks.length - 1}`);

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

                // STRICT FILTER: Only Brazilian domains or known marketplaces
                // (Bing &cc=BR helps, but we enforce here too)
                // Accepting .br, .com.br, or known globals (amazon.com, mercadolivre.com)
                // For now, we trust Bing's &cc=BR but log the domain

                if (priceVal !== null) {
                    results.push({
                        titulo: title,
                        preco: priceVal,
                        preco_formatado: priceMatch[0],
                        loja: store,
                        link: link
                    });
                } else {
                    console.log(`${logPrefix} Discarded (invalid price): ${priceMatch[0]}`);
                }
            }
        }

        console.log(`${logPrefix} Valid results found: ${results.length}`);
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
export async function buscarMelhoresPrecos({ has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica }) {
    let finalQuery = '';
    let origin = '';
    let allResults = [];

    // 1. Determine Query Strategy
    if (has_ca && ca_numero) {
        // FLOW 2: WITH CA - MULTIPLE STRATEGIES
        origin = 'com_ca_numero+descricao_tecnica';
        const desc = ca_descricao_tecnica || '';
        const nome = ca_nome_comercial || '';

        // Strategy A: CA + Desc
        const queryA = `CA ${ca_numero} ${desc}`;

        // Strategy B: EPI + CA + Desc (if A fails, or parallel)
        // For simplicity and speed, we pick the most robust one:
        // "CA {numero} {descricao}" is usually best.
        // If we want to be exhaustive, we could run multiple searches, but that might be slow/blocked.
        // Let's stick to the primary robust query as requested in "Query final"
        finalQuery = queryA;

        console.log(`[PRICE-SEARCH] CA Strategy Selected: "${finalQuery}"`);

    } else {
        // FLOW 1: NO CA
        if (!query_semantica) {
            console.warn('[PRICE-SEARCH] No semantic query available');
            return {
                produto: "N/A",
                origem_descricao: "sem_ca_query_semantica",
                imagem: "",
                melhores_precos: [],
                fonte: "WebSearch Bing - Brasil"
            };
        }
        finalQuery = query_semantica;
        origin = 'sem_ca_query_semantica';
        console.log(`[PRICE-SEARCH] Semantic Strategy Selected: "${finalQuery}"`);
    }

    // 2. Perform Search
    const rawResults = await searchBing(finalQuery);

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
        fonte: "WebSearch Bing - Brasil"
    };
}
