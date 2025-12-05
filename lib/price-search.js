/**
 * Price Search Module - Final Version
 * SerpApi Google Shopping + Tiered Relevance Filtering
 * Priority: Exact Model > Similar Model > Category Fallback
 */

import { intelligentProductSearch } from './intelligent-search.js';
import { searchGoogleShoppingAPI } from './serpapi.js';

/**
 * Main price search function
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - Price results with top 3 VALID prices only
 */
export async function buscarMelhoresPrecos({ query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica }) {
    let finalQuery = '';
    let origin = '';
    let relevanceKeywords = [];

    console.log('[PRICE-SEARCH] Starting search with params:', {
        has_query: !!query,
        has_ca,
        has_description: !!ca_descricao_tecnica,
        description_length: ca_descricao_tecnica?.length || 0
    });

    // 1. Determine Query Strategy - INTELLIGENT SEARCH PRIORITY
    if (ca_descricao_tecnica && ca_descricao_tecnica.length > 50) {
        try {
            console.log('[PRICE-SEARCH] Using Intelligent Search Strategy...');
            const intelligentResult = await intelligentProductSearch(ca_descricao_tecnica, ca_nome_comercial);

            if (intelligentResult && intelligentResult.query) {
                finalQuery = intelligentResult.query;
                origin = 'intelligent_search';

                // Extract relevance keywords for tiered filtering
                if (intelligentResult.specs.model) {
                    relevanceKeywords.push(intelligentResult.specs.model.toLowerCase());
                }
                if (intelligentResult.specs.category) {
                    const categoryWords = intelligentResult.specs.category.toLowerCase().split(' ');
                    relevanceKeywords.push(...categoryWords);
                }

                console.log(`[PRICE-SEARCH] Query: "${finalQuery}"`);
                console.log(`[PRICE-SEARCH] Keywords: ${relevanceKeywords.join(', ')}`);
            } else {
                finalQuery = query || query_semantica || ca_nome_comercial;
                origin = 'intelligent_fallback';
            }
        } catch (error) {
            console.error('[PRICE-SEARCH] Intelligent Search failed, falling back:', error.message);
            finalQuery = query || query_semantica || ca_nome_comercial;
            origin = 'intelligent_error_fallback';
        }
    }
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
    }
    else {
        if (!query_semantica) {
            console.error('[PRICE-SEARCH] No query available');
            return {
                produto: "Erro: sem query",
                imagem: "",
                melhores_precos: [],
                fonte: "Erro: sem query"
            };
        }
        finalQuery = query_semantica;
        origin = 'sem_ca_query_semantica';
        console.log(`[PRICE-SEARCH] Semantic Strategy: "${finalQuery}"`);
    }

    // 2. Search via Google Shopping
    console.log('[PRICE-SEARCH] Searching via SerpApi Google Shopping...');
    let rawResults = [];

    try {
        const googleShoppingResults = await searchGoogleShoppingAPI(finalQuery);
        console.log(`[PRICE-SEARCH] SerpApi returned ${googleShoppingResults.length} raw results`);

        // TIERED RELEVANCE FILTER
        if (relevanceKeywords.length > 0) {
            const model = relevanceKeywords[0]; // Most specific (T7, etc.)

            // Tier 1: Exact model match (T7)
            const exactModelMatch = googleShoppingResults.filter(item => {
                const titleLower = item.titulo.toLowerCase();
                return titleLower.includes(model);
            });

            // Tier 2: Similar model match (T5, T6 for T7 query - same product family)
            const similarModelMatch = googleShoppingResults.filter(item => {
                const titleLower = item.titulo.toLowerCase();
                // For T-series products: accept T{any digit}
                if (model.startsWith('t') && model.length === 2) {
                    return /\bt\d+\b/.test(titleLower);
                }
                return false;
            });

            // Tier 3: Category match only (ventilador pulmonar, etc.)
            const categoryMatch = googleShoppingResults.filter(item => {
                const titleLower = item.titulo.toLowerCase();
                const categoryWords = relevanceKeywords.slice(1); // Skip model
                const matchCount = categoryWords.filter(word => titleLower.includes(word)).length;
                return matchCount >= categoryWords.length * 0.5;
            });

            // Decision logic
            if (exactModelMatch.length >= 3) {
                console.log(`[PRICE-SEARCH] ✅ Using ${exactModelMatch.length} EXACT model matches`);
                rawResults = exactModelMatch;
            } else if (similarModelMatch.length >= 3) {
                console.log(`[PRICE-SEARCH] ⚠️ Exact insufficient, using ${similarModelMatch.length} SIMILAR model matches (${model} → T-series)`);
                rawResults = similarModelMatch;
            } else {
                console.log(`[PRICE-SEARCH] ⚠️ Models insufficient, using ${categoryMatch.length} CATEGORY matches as fallback`);
                rawResults = categoryMatch;
            }

            const rejected = googleShoppingResults.length - rawResults.length;
            console.log(`[PRICE-SEARCH] Rejected ${rejected} irrelevant results`);
        } else {
            rawResults = googleShoppingResults;
        }

    } catch (error) {
        console.error('[PRICE-SEARCH] SerpApi error:', error.message);
        return {
            produto: finalQuery,
            imagem: "",
            melhores_precos: [],
            fonte: "SerpApi Google Shopping",
            origem_descricao: origin,
            erro: error.message
        };
    }

    console.log(`[PRICE-SEARCH] Total VALID results: ${rawResults.length}`);

    // 3. Filter valid prices and sort
    const validResults = rawResults.filter(item => item.preco && item.preco > 0);
    console.log(`[PRICE-SEARCH] Results with prices: ${validResults.length}`);

    // Sort by price (ascending) and take top 3
    const sortedResults = validResults.sort((a, b) => a.preco - b.preco);
    const top3 = sortedResults.slice(0, 3);

    console.log(`[PRICE-SEARCH] Returning top ${top3.length} VALID results`);
    top3.forEach((item, idx) => {
        console.log(`[PRICE-SEARCH]   ${idx + 1}. ${item.titulo} - R$ ${item.preco.toFixed(2)} - ${item.loja}`);
    });

    return {
        produto: finalQuery,
        imagem: top3[0]?.imagem || "",
        melhores_precos: top3,
        fonte: "SerpApi Google Shopping (Validated)",
        origem_descricao: origin
    };
}
