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

/**
 * Main price search function with CA Priority Strategy
 * Strategy:
 * 1. Try EXACT CA match first ("Boot Name CA 1234")
 * 2. If no results, fallback to SEMANTIC/MODEL match ("Boot Name")
 */
export async function buscarMelhoresPrecos({ query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica }) {
    let finalQuery = '';
    let origin = '';
    let relevanceKeywords = [];
    let isExactCaStrategy = false;

    console.log('[PRICE-SEARCH] Starting search with params:', {
        has_query: !!query,
        has_ca,
        ca_numero,
        has_semantic: !!query_semantica
    });

    // --- STRATEGY DEFINITION ---

    // 1. CA Exact Strategy (Highest Priority if CA exists)
    let caQuery = null;
    if (has_ca && ca_numero && ca_nome_comercial) {
        // Remove "CA" string if already present to avoid "CA CA 1234"
        const cleanName = ca_nome_comercial.replace(/CA\s*\d+/i, '').trim();
        caQuery = `${cleanName} CA ${ca_numero}`;
        console.log(`[PRICE-SEARCH] Prepared Exact CA Query: "${caQuery}"`);
    }

    // 2. Semantic/Model Strategy (Fallback)
    let fallbackQuery = '';
    if (query_semantica && query_semantica.length > 3) {
        fallbackQuery = query_semantica;
        origin = 'semantic_query_gemini';
        relevanceKeywords.push(...query_semantica.split(' ').slice(0, 4).map(w => w.toLowerCase()));
    } else if (query) {
        fallbackQuery = query;
        origin = 'simple_query';
    } else {
        fallbackQuery = ca_nome_comercial || "Produto Desconhecido";
        origin = 'last_resort';
    }

    if (!fallbackQuery || fallbackQuery === "Produto Desconhecido") {
        console.error('[PRICE-SEARCH] No query available');
        return {
            produto: "Erro: sem query",
            imagem: "",
            melhores_precos: [],
            referencias_governamentais: [],
            fonte: "Erro: sem query"
        };
    }

    // --- EXECUTION PHASE ---

    // PNCP Search runs independently in parallel (always uses best query available)
    const pncpQuery = caQuery || fallbackQuery;
    const pncpPromise = pncpClient.buscarPrecos(pncpQuery)
        .catch(err => {
            console.error('[PRICE-SEARCH] PNCP Error:', err.message);
            return [];
        });

    // Google Shopping Logic with Retry
    let rawResults = [];
    let serpApiError = null;
    let strategyUsed = '';

    try {
        // Attempt 1: Exact CA Search
        if (caQuery) {
            console.log(`[PRICE-SEARCH] Attempt 1: Searching for EXACT CA "${caQuery}"...`);
            rawResults = await searchGoogleShoppingAPI(caQuery);

            if (rawResults && rawResults.length > 0) {
                console.log(`[PRICE-SEARCH] ✅ Attempt 1 Success! Found ${rawResults.length} items with Exact CA.`);
                strategyUsed = 'exact_ca_match';
                finalQuery = caQuery;
                isExactCaStrategy = true;
            } else {
                console.log(`[PRICE-SEARCH] ⚠️ Attempt 1 yielded ZERO results. Switching to Fallback...`);
            }
        }

        // Attempt 2: Fallback (if Attempt 1 failed or wasn't applicable)
        if (rawResults.length === 0) {
            console.log(`[PRICE-SEARCH] Attempt 2: Searching for FALLBACK Model "${fallbackQuery}"...`);
            rawResults = await searchGoogleShoppingAPI(fallbackQuery);
            strategyUsed = origin; // 'semantic_query_gemini', etc.
            finalQuery = fallbackQuery;

            if (rawResults && rawResults.length > 0) {
                console.log(`[PRICE-SEARCH] ✅ Attempt 2 Success. Found ${rawResults.length} items.`);
            } else {
                console.log(`[PRICE-SEARCH] ❌ Attempt 2 Failed. No results found.`);
            }
        }

    } catch (err) {
        console.error('[PRICE-SEARCH] SerpApi Critical Error:', err.message);
        serpApiError = err.message;
    }

    // Wait for PNCP
    let pncpResults = [];
    try {
        pncpResults = await pncpPromise;
        console.log(`[PRICE-SEARCH] PNCP returned ${pncpResults.length} results`);
    } catch (e) {
        // Should be caught by previous catch, but double safety
    }


    // --- FILTERING LOGIC (Only applies to Fallback Strategy) ---
    // If we used Exact CA, we trust the query and skip aggressive filtering
    if (!isExactCaStrategy && rawResults.length > 0 && relevanceKeywords.length > 0) {
        try {
            // TIERED RELEVANCE FILTER REUSED FROM BEFORE
            const model = relevanceKeywords[0];
            const exactModelMatch = rawResults.filter(item => item.titulo.toLowerCase().includes(model));

            if (exactModelMatch.length >= 3) {
                rawResults = exactModelMatch;
            }
        } catch (filterError) {
            console.error('[PRICE-SEARCH] Filter Logic Error:', filterError.message);
        }
    }

    // 3. Filter valid prices and sort
    const validResults = rawResults.filter(item => item.preco && item.preco > 0);
    const sortedResults = validResults.sort((a, b) => a.preco - b.preco);
    const top3 = sortedResults.slice(0, 3);

    const formattedPncp = pncpResults ? pncpResults.slice(0, 5) : [];

    return {
        produto: finalQuery,
        imagem: top3[0]?.imagem || "",
        melhores_precos: top3,
        referencias_governamentais: formattedPncp,
        fonte: isExactCaStrategy ? "Google Shopping (CA Exato)" : "Google Shopping (Modelo)",
        origem_descricao: strategyUsed,
        erro: serpApiError
    };
}

