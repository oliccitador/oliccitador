/**
 * Price Search Module - Isolated
 * Uses SerpApi.com for reliable Google Shopping results
 * + Mercado Livre scraping as backup
 */

import { intelligentProductSearch } from './intelligent-search.js';
import { searchGoogleShoppingAPI, searchGoogleAPI } from './serpapi.js';

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
        // Try LI first (List view), then DIV (Grid/Stack view)
        let itemRegex = /<li[^>]*class="[^"]*ui-search-layout__item[^"]*"[^>]*>(.*?)<\/li>/gs;
        let items = Array.from(html.matchAll(itemRegex));

        // If no LI items, try DIV (Grid/Stack layout)
        if (items.length === 0) {
            itemRegex = /<div[^>]*class="[^"]*ui-search-result__wrapper[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*ui-search-result__wrapper|$)/gs;
            items = Array.from(html.matchAll(itemRegex));
        }

        console.log(`${logPrefix} Found ${items.length} product items`);

        for (let i = 0; i < Math.min(items.length, 30); i++) {
            const itemHtml = items[i][1];

            // Extract Title - Try Poly (Grid) first, then UI (List)
            let titleMatch = itemHtml.match(/<a[^>]*class="[^"]*poly-component__title[^"]*"[^>]*>([^<]+)<\/a>/i);
            if (!titleMatch) {
                titleMatch = itemHtml.match(/<h2[^>]*class="[^"]*ui-search-item__title[^"]*"[^>]*>([^<]+)<\/h2>/i);
            }
            const title = titleMatch ? titleMatch[1].trim() : null;

            // Extract Price
            let priceStr = null;
            let cents = '00';

            // Pattern 1: Poly Price (Grid view)
            const currentPriceBlock = itemHtml.match(/<div[^>]*class="[^"]*poly-price__current[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            if (currentPriceBlock) {
                const priceMatch = currentPriceBlock[1].match(/<span[^>]*class="[^"]*andes-money-amount__fraction[^"]*"[^>]*>([^<]+)<\/span>/i);
                priceStr = priceMatch ? priceMatch[1].trim() : null;
                const centsMatch = currentPriceBlock[1].match(/<span[^>]*class="[^"]*andes-money-amount__cents[^"]*"[^>]*>([^<]+)<\/span>/i);
                cents = centsMatch ? centsMatch[1].trim() : '00';
            }

            // Fallback: Try any price fraction in item
            if (!priceStr) {
                const genericPrice = itemHtml.match(/<span[^>]*class="[^"]*andes-money-amount__fraction[^"]*"[^>]*>([^<]+)<\/span>/i);
                if (genericPrice) priceStr = genericPrice[1].trim();
            }

            // Extract Link - Try Poly first, then UI
            let linkMatch = itemHtml.match(/<a[^>]*class="[^"]*poly-component__title[^"]*"[^>]*href="([^"]+)"/i);
            if (!linkMatch) {
                linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*poly-component__title[^"]*"/i);
            }
            if (!linkMatch) {
                linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*ui-search-link[^"]*"/i);
            }
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

                    console.log(`${logPrefix} Found: ${title.substring(0, 40)}... - R$ ${priceStr},${cents}`);
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

        for (let i = 0; i < Math.min(items.length, 20); i++) {
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

    // STRATEGY: Intelligent Search (PRIORITY if description available & rich)
    if (ca_descricao_tecnica && ca_descricao_tecnica.length > 50) {
        try {
            console.log('[PRICE-SEARCH] Using Intelligent Search Strategy...');
            // Pass ca_nome_comercial as fallback category for global support
            const intelligentResult = await intelligentProductSearch(ca_descricao_tecnica, ca_nome_comercial);

            if (intelligentResult && intelligentResult.query) {
                finalQuery = intelligentResult.query;
                origin = 'intelligent_search';
                console.log(`[PRICE-SEARCH] Intelligent Query Generated: "${finalQuery}"`);
            } else {
                // Fallback if intelligent search returns empty
                finalQuery = query || query_semantica || ca_nome_comercial;
                origin = 'intelligent_fallback';
            }
        } catch (error) {
            console.error('[PRICE-SEARCH] Intelligent Search failed, falling back:', error.message);
            finalQuery = query || query_semantica || ca_nome_comercial;
            origin = 'intelligent_error_fallback';
        }
    }
    // STRATEGY: Frontend Query (Fallback)
    else if (query) {
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

    // 2. Hybrid Search Strategy - Always try both sources for maximum coverage
    let rawResults = [];

    // Try Mercado Livre first (most reliable)
    console.log('[PRICE-SEARCH] Searching Mercado Livre...');
    rawResults = await searchMercadoLivre(finalQuery);
    console.log(`[PRICE-SEARCH] Mercado Livre returned ${rawResults.length} results`);

    // If ML has few results (< 3), try Bright Data SERP API (Google Shopping)
    if (rawResults.length < 3) {
        console.log('[PRICE-SEARCH] Few results on ML, searching via Bright Data SERP API...');
        try {
            const googleResults = await searchGoogleShoppingAPI(finalQuery);
            if (googleResults.length > 0) {
                console.log(`[PRICE-SEARCH] Bright Data returned ${googleResults.length} results`);
                rawResults = [...rawResults, ...googleResults];
            } else {
                // Fallback to regular Google search if shopping returns empty
                console.log('[PRICE-SEARCH] Shopping empty, trying Google Search...');
                const googleSearchResults = await searchGoogleAPI(finalQuery);
                if (googleSearchResults.length > 0) {
                    console.log(`[PRICE-SEARCH] Google Search returned ${googleSearchResults.length} results`);
                    rawResults = [...rawResults, ...googleSearchResults];
                }
            }
        } catch (err) {
            console.error('[PRICE-SEARCH] Bright Data API error:', err.message);
        }
    }

    // Always try Magazine Luiza as well to maximize results
    console.log('[PRICE-SEARCH] Searching Magazine Luiza...');
    const magaluResults = await searchMagazineLuiza(finalQuery);
    console.log(`[PRICE-SEARCH] Magazine Luiza returned ${magaluResults.length} results`);

    // Combine results from both sources
    rawResults = [...rawResults, ...magaluResults];
    console.log(`[PRICE-SEARCH] Total combined results: ${rawResults.length}`);

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
        fonte: top3.length > 0 ? "Mercado Livre + Magazine Luiza + Google Shopping" : "Nenhuma fonte retornou resultados"
    };
}
