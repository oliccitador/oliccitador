/**
 * Price Search Module - Integrated Version
 * SerpApi Google Shopping + PNCP Integration (Fault Tolerant)
 * Priority: CA Exclusive Search > Semantic Query (Gemini) > Fallback
 */

import { intelligentProductSearch } from './intelligent-search.js';
import { searchGoogleShoppingAPI } from './serpapi.js';
import { pncpClient } from './pncp-client.js';

/**
 * Main price search function with CA Priority Strategy
 * Strategy (Updated):
 * 1. If CA exists: Search ONLY by "CA {number} EPI" (specialized sites focus)
 * 2. If NO CA: Fallback to SEMANTIC/MODEL match
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

    // 1. CA Exclusive Strategy (Highest Priority if CA exists)
    // USER REQUIREMENT: Search ONLY by CA number + "EPI" to focus on specialized sites
    let caQuery = null;
    if (has_ca && ca_numero) {
        const cleanCA = ca_numero.replace(/\D/g, '');
        caQuery = `CA ${cleanCA} EPI`;
        console.log(`[PRICE-SEARCH] Prepared CA-Exclusive Query: "${caQuery}"`);
    }

    // 2. Semantic/Model Strategy (Fallback - ONLY if NO CA)
    let fallbackQuery = '';
    if (!has_ca) {
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
    }

    // --- EXECUTION PHASE ---

    // PNCP Search runs independently in parallel
    const pncpQuery = caQuery || fallbackQuery;
    const pncpPromise = pncpClient.buscarPrecos(pncpQuery)
        .catch(err => {
            console.error('[PRICE-SEARCH] PNCP Error:', err.message);
            return [];
        });

    // Google Shopping Logic with CA Priority
    let rawResults = [];
    let serpApiError = null;
    let strategyUsed = '';

    try {
        // Attempt 1: CA-Exclusive Search (if CA exists)
        if (caQuery) {
            console.log(`[PRICE-SEARCH] Attempt 1: Searching for CA-EXCLUSIVE "${caQuery}"...`);
            const googleResults = await searchGoogleShoppingAPI(caQuery);

            // SECURITY CHECK: Strict filter - must contain CA number in title
            const cleanCA = ca_numero.replace(/\D/g, '');
            rawResults = googleResults.filter(item => {
                return item.titulo && item.titulo.includes(cleanCA);
            });

            if (rawResults && rawResults.length > 0) {
                console.log(`[PRICE-SEARCH] ✅ CA-Exclusive Success! Found ${rawResults.length} verified items with CA ${cleanCA}.`);
                strategyUsed = 'ca_exclusive_match';
                finalQuery = caQuery;
                isExactCaStrategy = true;
                origin = 'ca_exclusive_match';
            } else {
                console.log(`[PRICE-SEARCH] ❌ No items found with CA ${cleanCA} in specialized sites. No fallback (CA-only rule).`);
                rawResults = [];
            }
        }

        // Attempt 2: Fallback (ONLY if NO CA was provided from the start)
        // CRITICAL: If user searched by CA, we DON'T fallback to generic search
        // This prevents returning wrong products
        if (rawResults.length === 0 && !caQuery && fallbackQuery) {
            // Build smart query from technical description if available
            let smartQuery = fallbackQuery;

            if (ca_descricao_tecnica && ca_descricao_tecnica.length > 20) {
                smartQuery = buildSmartQuery(ca_nome_comercial, ca_numero, ca_descricao_tecnica);
                console.log(`[PRICE-SEARCH] Generated Smart Query: "${smartQuery}"`);
            }

            console.log(`[PRICE-SEARCH] Attempt 2: Searching for SMART FALLBACK "${smartQuery}"...`);
            rawResults = await searchGoogleShoppingAPI(smartQuery);
            strategyUsed = 'smart_fallback';
            finalQuery = smartQuery;

            // If Smart Query fails, try simple name
            if (rawResults.length === 0 && smartQuery !== ca_nome_comercial && ca_nome_comercial) {
                console.log(`[PRICE-SEARCH] Attempt 3: Smart Query too strict. Trying Simple Name "${ca_nome_comercial}"...`);
                rawResults = await searchGoogleShoppingAPI(ca_nome_comercial);
                strategyUsed = 'simple_name_fallback';
                finalQuery = ca_nome_comercial;
            }

            if (rawResults && rawResults.length > 0) {
                console.log(`[PRICE-SEARCH] ✅ Fallback Success. Found ${rawResults.length} items.`);
            } else {
                console.log(`[PRICE-SEARCH] ❌ All Attempts Failed. No results found.`);
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
    // If we used CA-Exclusive, we trust the query and skip aggressive filtering
    if (!isExactCaStrategy && rawResults.length > 0 && relevanceKeywords.length > 0) {
        try {
            // TIERED RELEVANCE FILTER
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

/**
 * Helper: Build Optimized Smart Query from Technical Description
 * Extracts high-value keywords (Sole, Toe, Material) to ensure price accuracy
 */
function buildSmartQuery(nome, ca_numero, descricao) {
    if (!descricao) return nome;

    let queryParts = [];

    // 1. Base: Clean Name
    const cleanName = nome
        .replace(/\bDE\b/gi, '')
        .replace(/\bSEGURANÇA\b/gi, '')
        .replace(/\bPARA\b/gi, '')
        .replace(/\bUSO\b/gi, '')
        .replace(/[.,-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    queryParts.push(cleanName);

    // 2. Extract Value Keywords
    const descUpper = descricao.toUpperCase();

    // Materiais
    if (descUpper.includes("NOBUCK")) queryParts.push("Nobuck");
    else if (descUpper.includes("VAQUETA")) queryParts.push("Vaqueta");
    else if (descUpper.includes("RASPA")) queryParts.push("Raspa");

    if (descUpper.includes("COMPOSITE")) queryParts.push("Composite");

    // Fechamento
    if (descUpper.includes("ELASTICO") || descUpper.includes("ELÁSTICO")) queryParts.push("Elástico");
    if (descUpper.includes("CADARCO") || descUpper.includes("CADARÇO")) queryParts.push("Cadarço");
    if (descUpper.includes("VELCRO")) queryParts.push("Velcro");

    // Construção / Solado
    if (descUpper.includes("BIDENSIDADE")) queryParts.push("Bidensidade");
    else if (descUpper.includes("MONODENSIDADE")) queryParts.push("Monodensidade");

    // Biqueira (Critico)
    if (descUpper.includes("BIQUEIRA DE AÇO") || descUpper.includes("BIQUEIRA DE ACO")) queryParts.push("Bico Aço");
    else if (descUpper.includes("Plastica") || descUpper.includes("PLÁSTICA") || descUpper.includes("CONFORMACAO") || descUpper.includes("CONFORMAÇÃO") || descUpper.includes("POLIPROPILENO")) queryParts.push("Bico Plástico");
    else if (descUpper.includes("COMPOSITE")) queryParts.push("Bico Composite");

    return queryParts.join(' ');
}
