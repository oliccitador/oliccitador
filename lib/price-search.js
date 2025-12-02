/**
 * Price Search Module - Isolated
 * Scrapes Mercado Livre for Brazilian prices
 * ZERO-COST implementation (no paid APIs)
 */

/**
 * Clean price string to float
 * @param {string} priceStr - e.g. "R$ 1.234,56" or "1.234"
 * @returns {number} - 1234.56
 */
function parsePrice(priceStr) {
    try {
        // Remove R$, spaces, dots (thousands), replace comma with dot
        const clean = priceStr.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        const val = parseFloat(clean);
        return isNaN(val) ? null : val;
    } catch (e) {
        return null;
    }
}

/**
 * Execute search on Mercado Livre
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { loja, preco, link, titulo }
 */
async function searchMercadoLivre(query) {
    const logPrefix = `[PRICE-SEARCH][ML][${query.substring(0, 20)}...]`;
    try {
        // Mercado Livre search URL
        const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

        console.log(`${logPrefix} Fetching: ${searchUrl}`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            console.error(`${logPrefix} ML returned ${response.status}`);
            return [];
        }

        const html = await response.text();

        console.log(`${logPrefix} HTML received, length: ${html.length}`);

        const results = [];

        // Mercado Livre uses predictable class names for product listings
        // Look for product items - they use "ui-search-result" class
        const itemRegex = /<li[^>]*class="[^"]*ui-search-layout__item[^"]*"[^>]*>(.*?)<\/li>/gs;
        const items = Array.from(html.matchAll(itemRegex));

        console.log(`${logPrefix} Found ${items.length} product items`);

        for (let i = 0; i < Math.min(items.length, 15); i++) {
            const itemHtml = items[i][1];

            // Extract Title - usually in h2 with "ui-search-item__title"
            const titleMatch = itemHtml.match(/<h2[^>]*class="[^"]*ui-search-item__title[^"]*"[^>]*>([^<]+)<\/h2>/i);
            const title = titleMatch ? titleMatch[1].trim() : null;

            // Extract Price - usually in span with "andes-money-amount__fraction"
            // ML shows price as: <span class="andes-money-amount__fraction">199</span>
            const priceMatch = itemHtml.match(/<span[^>]*class="[^"]*andes-money-amount__fraction[^"]*"[^>]*>([^<]+)<\/span>/i);
            const priceStr = priceMatch ? priceMatch[1].trim() : null;

            // Extract cents if available
            const centsMatch = itemHtml.match(/<span[^>]*class="[^"]*andes-money-amount__cents[^"]*"[^>]*>([^<]+)<\/span>/i);
            const cents = centsMatch ? centsMatch[1].trim() : '00';

            // Extract Link
            const linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*ui-search-link[^"]*"/i) ||
                itemHtml.match(/<a[^>]*class="[^"]*ui-search-link[^"]*"[^>]*href="([^"]+)"/i);
            const link = linkMatch ? linkMatch[1].trim() : null;

            if (title && priceStr && link) {
                // Construct full price
                const fullPriceStr = `${priceStr},${cents}`;
                const priceVal = parsePrice(fullPriceStr);

                if (priceVal !== null) {
                    results.push({
                        titulo: title,
                        preco: priceVal,
                        preco_formatado: `R$ ${priceStr},${cents}`,
                        loja: 'mercadolivre.com.br',
                        link: link
                    });

                    console.log(`${logPrefix} Found: ${title} - R$ ${priceStr},${cents}`);
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
 * Fallback: Search on Magazine Luiza
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products
 */
async function searchMagazineLuiza(query) {
    const logPrefix = `[PRICE-SEARCH][MAGALU][${query.substring(0, 20)}...]`;
    try {
        const searchUrl = `https://www.magazineluiza.com.br/busca/${encodeURIComponent(query)}`;

        console.log(`${logPrefix} Fetching: ${searchUrl}`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });

        if (!response.ok) {
            console.error(`${logPrefix} Magalu returned ${response.status}`);
            return [];
        }

        const html = await response.text();
        const results = [];

        // Magazine Luiza uses data-testid for product cards
        const itemRegex = /<a[^>]*data-testid="product-card-container"[^>]*>(.*?)<\/a>/gs;
        const items = Array.from(html.matchAll(itemRegex));

        console.log(`${logPrefix} Found ${items.length} product items`);

        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const itemHtml = items[i][0];

            // Extract title from data-testid="product-title"
            const titleMatch = itemHtml.match(/data-testid="product-title"[^>]*>([^<]+)</i);
            const title = titleMatch ? titleMatch[1].trim() : null;

            // Extract price - usually in data-testid="price-value"
            const priceMatch = itemHtml.match(/data-testid="price-value"[^>]*>([^<]+)</i);
            const priceStr = priceMatch ? priceMatch[1].trim() : null;

            // Extract link
            const linkMatch = itemHtml.match(/href="([^"]+)"/i);
            const link = linkMatch ? `https://www.magazineluiza.com.br${linkMatch[1]}` : null;

            if (title && priceStr && link) {
                const priceVal = parsePrice(priceStr);

                if (priceVal !== null) {
                    results.push({
                        titulo: title,
                        preco: priceVal,
                        preco_formatado: `R$ ${priceStr}`,
                        loja: 'magazineluiza.com.br',
                        link: link
                    });
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
 * Uses hybrid strategy with fallbacks
 */
export async function buscarMelhoresPrecos({ query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica }) {
    let finalQuery = '';
    let origin = '';

    // 1. Determine Query Strategy
    if (query) {
        finalQuery = query;
        origin = has_ca ? 'frontend_constructed_ca' : 'frontend_constructed_semantic';
        console.log(`[PRICE-SEARCH] Using Frontend Query: "${finalQuery}"`);
    }
    else if (has_ca && ca_numero) {
        origin = 'com_ca_nome_comercial';
        const nome = ca_nome_comercial || '';
        finalQuery = nome;
        console.log(`[PRICE-SEARCH] CA Strategy: "${finalQuery}"`);
    } else {
        if (!query_semantica) {
            console.warn('[PRICE-SEARCH] No query available');
            return {
                produto: "N/A",
                origem_descricao: "sem_query",
                imagem: "",
                melhores_precos: [],
                fonte: "Erro: sem query"
            };
        }
        finalQuery = query_semantica;
        origin = 'sem_ca_query_semantica';
        console.log(`[PRICE-SEARCH] Semantic Strategy: "${finalQuery}"`);
    }

    // 2. Hybrid Search Strategy
    let rawResults = [];

    // Try Mercado Livre first (most reliable)
    console.log('[PRICE-SEARCH] Trying Mercado Livre...');
    rawResults = await searchMercadoLivre(finalQuery);

    // Fallback to Magazine Luiza if needed
    if (rawResults.length < 3) {
        console.log('[PRICE-SEARCH] ML insufficient, trying Magazine Luiza...');
        const magaluResults = await searchMagazineLuiza(finalQuery);
        rawResults = [...rawResults, ...magaluResults];
    }

    // 3. Sort and Select Top 3
    const sortedResults = rawResults.sort((a, b) => a.preco - b.preco);
    const top3 = sortedResults.slice(0, 3);

    // 4. QA Logging
    console.log('[PRICE-SEARCH] --- FINAL RESULTS ---');
    console.log(`Query: ${finalQuery}`);
    console.log(`Total Found: ${rawResults.length}`);
    console.log(`Top 3: ${top3.map(i => `${i.loja} - R$ ${i.preco}`).join(' | ')}`);
    console.log('-----------------------------------');

    return {
        produto: finalQuery,
        origem_descricao: origin,
        imagem: "",
        melhores_precos: top3,
        fonte: top3.length > 0 ? "Mercado Livre + Magazine Luiza" : "Nenhuma fonte retornou resultados"
    };
}
