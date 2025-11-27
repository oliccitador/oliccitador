/**
 * PNCP Integration Module - Flow 2 Implementation
 * 
 * Implements literal and semantic search with anti-hallucination rules:
 * - Priority: Literal search first
 * - Fallback: Semantic search with similarity threshold
 * - Never modify TR text for literal search
 * - Mark as SEM_CORRESPONDENCIA if no safe match
 */

const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1/atas';
const SIMILARITY_THRESHOLD = 0.7; // Minimum similarity for semantic matches

/**
 * Flow 2 - Step 1: Literal search in PNCP
 * Search using exact TR text without modification
 * @param {string} descricaoTR - Original TR description
 * @returns {Promise<Array>} Literal matches
 */
export async function buscaLiteral(descricaoTR) {
    if (!descricaoTR || descricaoTR.trim().length === 0) {
        return [];
    }

    try {
        // CRITICAL: Use exact string, no tokenization
        const url = `${PNCP_BASE_URL}?termo=${encodeURIComponent(descricaoTR)}&pagina=1&tamanhoPagina=10`;
        console.log(`[PNCP-LITERAL] Searching with exact TR text: "${descricaoTR}"`);

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[PNCP-LITERAL] Error ${response.status}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const results = data.data || data || [];

        console.log(`[PNCP-LITERAL] Found ${results.length} literal matches`);

        // Normalize results
        return normalizePncpResults(results);

    } catch (error) {
        console.error('[PNCP-LITERAL] Request failed:', error);
        return [];
    }
}

/**
 * Flow 2 - Step 2: Extract semantic tokens
 * Only called if literal search fails
 * @param {string} descricaoTR - Original TR description
 * @returns {Object} Semantic tokens
 */
export function extrairTokensSemanticos(descricaoTR) {
    // Simple tokenization (can be enhanced with Gemini later)
    const tokens = {
        substantivo_principal: '',
        qualificadores: [],
        materiais: [],
        medidas: [],
        funcao: ''
    };

    // Basic extraction (placeholder - can be improved with NLP)
    const words = descricaoTR.toLowerCase().split(/\s+/);

    // Extract first noun as main substantive (simplified)
    tokens.substantivo_principal = words[0] || '';

    // Extract qualifiers (words that describe the item)
    tokens.qualificadores = words.slice(1, 5);

    return tokens;
}

/**
 * Flow 2 - Step 3: Semantic search in PNCP
 * Only called if literal search returns no results
 * @param {string} descricaoTR - Original TR description
 * @returns {Promise<Array>} Semantic matches above threshold
 */
export async function buscaSemantica(descricaoTR) {
    if (!descricaoTR || descricaoTR.trim().length === 0) {
        return [];
    }

    try {
        // Extract semantic tokens
        const tokens = extrairTokensSemanticos(descricaoTR);

        // Build semantic query
        const querySemantica = [
            tokens.substantivo_principal,
            ...tokens.qualificadores
        ].filter(Boolean).join(' ');

        console.log(`[PNCP-SEMANTIC] Searching with semantic query: "${querySemantica}"`);

        const url = `${PNCP_BASE_URL}?termo=${encodeURIComponent(querySemantica)}&pagina=1&tamanhoPagina=20`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[PNCP-SEMANTIC] Error ${response.status}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        const results = data.data || data || [];

        // Normalize results
        const normalized = normalizePncpResults(results);

        // Calculate similarity and filter by threshold
        const withSimilarity = normalized.map(item => ({
            ...item,
            similarity: calculateSimilarity(descricaoTR, item.descricao_oficial)
        }));

        // Filter by threshold
        const filtered = withSimilarity.filter(item => item.similarity >= SIMILARITY_THRESHOLD);

        // Sort by similarity (highest first)
        filtered.sort((a, b) => b.similarity - a.similarity);

        console.log(`[PNCP-SEMANTIC] Found ${filtered.length} matches above threshold (${SIMILARITY_THRESHOLD})`);

        return filtered;

    } catch (error) {
        console.error('[PNCP-SEMANTIC] Request failed:', error);
        return [];
    }
}

/**
 * Calculate similarity between two strings
 * Simple Jaccard similarity (can be improved with better algorithms)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

/**
 * Flow 2 - Step 4: Consolidate best description
 * Priority: Literal > Semantic > None
 * @param {Array} literalResults - Results from literal search
 * @param {Array} semanticResults - Results from semantic search
 * @returns {Object|null} Best match or null
 */
export function consolidarMelhorDescricao(literalResults, semanticResults) {
    // Priority 1: Literal match
    if (literalResults && literalResults.length > 0) {
        console.log('[PNCP-CONSOLIDATE] Using literal match');
        return {
            ...literalResults[0],
            match_type: 'LITERAL'
        };
    }

    // Priority 2: Semantic match (already filtered by threshold)
    if (semanticResults && semanticResults.length > 0) {
        console.log('[PNCP-CONSOLIDATE] Using semantic match');
        return {
            ...semanticResults[0],
            match_type: 'SEMANTICA'
        };
    }

    // No safe match found
    console.log('[PNCP-CONSOLIDATE] No safe match found');
    return null;
}

/**
 * Search PNCP (generic function for backward compatibility)
 * @param {string} query - Search term
 * @returns {Promise<Array>} Search results
 */
export async function searchPncp(query) {
    try {
        const url = `${PNCP_BASE_URL}?termo=${encodeURIComponent(query)}&pagina=1&tamanhoPagina=10`;
        console.log(`[PNCP] Searching: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[PNCP] Error ${response.status}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data.data || data || [];
    } catch (error) {
        console.error('[PNCP] Request failed:', error);
        return [];
    }
}

/**
 * Normalize PNCP results
 * @param {Array} rawResults - Raw API results
 * @returns {Array} Normalized results
 */
export function normalizePncpResults(rawResults) {
    if (!Array.isArray(rawResults)) return [];

    return rawResults.map(item => {
        return {
            id: item.id || item.itemUrl,
            descricao_oficial: item.descricao || item.objetoCompra,
            descricao: item.descricao || item.objetoCompra, // Alias for compatibility
            unidade: item.unidadeMedida || 'UN',
            preco_unitario: item.valorUnitario || item.valorTotal,
            quantidade: item.quantidade || 1,
            link_ata: item.link || item.uri,
            data_publicacao: item.dataPublicacao,
            orgao: item.orgaoEntidade?.razaoSocial || 'Desconhecido',
            dados_tecnicos: {
                descricao_completa: item.descricao || item.objetoCompra || '',
            }
        };
    }).filter(item => item.descricao_oficial); // Remove items without description
}

/**
 * Validate commercial fields
 * @param {Object} item - Normalized item
 * @param {Array} requiredFields - Required fields
 * @returns {boolean} Valid or not
 */
export function validateCommercialFields(item, requiredFields = []) {
    if (!item.descricao_oficial || !item.preco_unitario) return false;
    return true;
}
