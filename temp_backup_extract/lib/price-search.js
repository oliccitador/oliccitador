/**
 * Price Search Module - Integrated Version
 * SerpApi Google Shopping + PNCP Integration (Fault Tolerant)
 * Priority: Semantic Query (Gemini) > Exact Model > Similar Model > Category Fallback
 */

import { intelligentProductSearch } from './intelligent-search.js';
import { searchGoogleShoppingAPI } from './serpapi.js';
import { pncpClient } from './pncp-client.js';

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
        description_length: ca_descricao_tecnica?.length || 0,
        has_semantic: !!query_semantica
    });

    // 1. Determine Query Strategy - PRIORITY: SEMANTIC QUERY (GEMINI) > INTELLIGENT SEARCH (REGEX/LLM)
    // Se já temos uma query semântica boa do Módulo 1 (gerada pelo Gemini Flash 2.0), usamos ela direto.
    // Isso evita o problema de extração ruim do regex "DE 180 CE..."
    if (query_semantica && query_semantica.length > 3) {
        console.log('[PRICE-SEARCH] Using Semantic Query (Best Quality):', query_semantica);
        finalQuery = query_semantica;
        origin = 'semantic_query_gemini';

        // Extract keywords for filtering
        relevanceKeywords.push(...query_semantica.split(' ').slice(0, 4).map(w => w.toLowerCase()));
    }
    // FALLBACK: Só tenta intelligent search se a semântica falhou ou não existe e temos descrição longa
    else if (ca_descricao_tecnica && ca_descricao_tecnica.length > 50) {
        try {
            console.log('[PRICE-SEARCH] Semantic Query missing/short. Falling back to Intelligent Search...');
            const intelligentResult = await intelligentProductSearch(ca_descricao_tecnica, ca_nome_comercial);

            if (intelligentResult && intelligentResult.query) {
                finalQuery = intelligentResult.query;
                origin = 'intelligent_search_fallback';

                if (intelligentResult.specs.model) relevanceKeywords.push(intelligentResult.specs.model.toLowerCase());
                if (intelligentResult.specs.category) relevanceKeywords.push(...intelligentResult.specs.category.toLowerCase().split(' '));

                console.log(`[PRICE-SEARCH] Intelligent Fallback Query: "${finalQuery}"`);
            } else {
                finalQuery = query || ca_nome_comercial;
                origin = 'legacy_fallback';
            }
        } catch (error) {
            console.error('[PRICE-SEARCH] Intelligent Search Error:', error.message);
            finalQuery = query || ca_nome_comercial;
            origin = 'error_fallback';
        }
    }
    else if (query) {
        finalQuery = query;
        origin = 'simple_query';
    }
    else {
        finalQuery = ca_nome_comercial || "Produto Desconhecido";
        origin = 'last_resort';
    }

    if (!finalQuery || finalQuery === "Produto Desconhecido") {
        console.error('[PRICE-SEARCH] No query available');
        return {
            produto: "Erro: sem query",
            imagem: "",
            melhores_precos: [],
            referencias_governamentais: [],
            fonte: "Erro: sem query"
        };
    }

    // 2. Search Sources in Parallel with FAILOVER PROTECTION
    console.log('[PRICE-SEARCH] Searching via SerpApi Google Shopping AND PNCP...');
    let rawResults = [];
    let pncpResults = [];
    let serpApiError = null;

    // Execute both searches in parallel but ISOLATE errors
    await Promise.all([
        // Google Search Task
        searchGoogleShoppingAPI(finalQuery)
            .then(res => { rawResults = res; })
            .catch(err => {
                console.error('[PRICE-SEARCH] SerpApi Critical Error:', err.message);
                serpApiError = err.message;
                // Don't throw, just log and keep rawResults empty
            }),

        // PNCP Search Task
        pncpClient.buscarPrecos(finalQuery)
            .then(res => { pncpResults = res; })
            .catch(err => {
                console.error('[PRICE-SEARCH] PNCP Error (non-critical):', err.message);
                // PNCP failure shouldn't affect anything
            })
    ]);

    console.log(`[PRICE-SEARCH] SerpApi returned ${rawResults.length} raw results`);
    console.log(`[PRICE-SEARCH] PNCP returned ${pncpResults.length} results`);

    try {
        // TIERED RELEVANCE FILTER (Only for Google Shopping)
        if (rawResults.length > 0 && relevanceKeywords.length > 0) {
            const model = relevanceKeywords[0]; // Most specific (T7, etc.)

            // Tier 1: Exact model match (T7)
            const exactModelMatch = rawResults.filter(item => {
                const titleLower = item.titulo.toLowerCase();
                return titleLower.includes(model);
            });

            // Tier 2: Similar model match (T5, T6 for T7 query - same product family)
            const similarModelMatch = rawResults.filter(item => {
                const titleLower = item.titulo.toLowerCase();
                if (model.startsWith('t') && model.length === 2) {
                    return /\bt\d+\b/.test(titleLower);
                }
                return false;
            });

            // Tier 3: Category match only (ventilador pulmonar, etc.)
            const categoryMatch = rawResults.filter(item => {
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
        }
    } catch (filterError) {
        console.error('[PRICE-SEARCH] Filter Logic Error:', filterError.message);
    }

    // 3. Filter valid prices and sort
    const validResults = rawResults.filter(item => item.preco && item.preco > 0);
    console.log(`[PRICE-SEARCH] Results with prices: ${validResults.length}`);

    // Sort by price (ascending) and take top 3
    const sortedResults = validResults.sort((a, b) => a.preco - b.preco);
    const top3 = sortedResults.slice(0, 3);

    console.log(`[PRICE-SEARCH] Returning top ${top3.length} VALID results`);
    const formattedPncp = pncpResults ? pncpResults.slice(0, 5) : [];

    return {
        produto: finalQuery,
        imagem: top3[0]?.imagem || "",
        melhores_precos: top3,
        referencias_governamentais: formattedPncp,
        fonte: "SerpApi + PNCP (Hybrid)",
        origem_descricao: origin,
        erro: serpApiError // Return error for debug, but don't break UI if data exists
    };
}
