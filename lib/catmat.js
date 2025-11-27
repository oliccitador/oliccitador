/**
 * CATMAT Integration Module - Flow 3 Implementation
 * 
 * Implements CATMAT consultation with controlled consolidation:
 * - CATMAT defines item type (nucleus)
 * - PNCP only complements usage details
 * - Detect and reject category conflicts
 */

const CATMAT_BASE_URL = 'https://www.comprasnet.gov.br/catmat/api';

/**
 * Flow 3 - Step 1: Query CATMAT
 * @param {string} codigo - CATMAT code
 * @returns {Promise<Object|null>} CATMAT data or null if not found
 */
export async function consultarCATMAT(codigo) {
    if (!codigo || codigo.trim().length === 0) {
        return { status: 'CATMAT_NAO_ENCONTRADO', error: 'CATMAT code is required' };
    }

    try {
        console.log(`[CATMAT] Querying code: ${codigo}`);

        // Note: CATMAT API endpoint may vary
        // This is a placeholder - adjust based on actual API
        const url = `${CATMAT_BASE_URL}/material/${codigo}`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    status: 'CATMAT_NAO_ENCONTRADO',
                    error: `CATMAT ${codigo} não encontrado`,
                    codigo
                };
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract official fields
        return {
            status: 'OK',
            codigo,
            nome: data.nome || data.descricao || 'Nome não disponível',
            descricao: data.descricaoDetalhada || data.descricao || '',
            classe: data.classe || data.categoria || 'Classe não especificada',
            unidade_padrao: data.unidadeFornecimento || 'UN',
            grupo: data.grupo || null,
            dados_completos: data
        };

    } catch (error) {
        console.error('[CATMAT] Query failed:', error);
        return {
            status: 'CATMAT_NAO_ENCONTRADO',
            error: error.message,
            codigo
        };
    }
}

/**
 * Flow 3 - Step 2: Prepare PNCP query
 * Combines TR + CATMAT name + tokens
 * @param {string} descricaoTR - Original TR description
 * @param {Object} catmatData - CATMAT data
 * @returns {string} PNCP query
 */
export function prepararQueryPNCP(descricaoTR, catmatData) {
    const parts = [];

    // Add CATMAT name (core)
    if (catmatData.nome) {
        parts.push(catmatData.nome);
    }

    // Add main tokens from TR
    const tokens = descricaoTR.split(/\s+/).slice(0, 5);
    parts.push(...tokens);

    // Build query
    const query = parts.join(' ').trim();

    console.log(`[CATMAT] Prepared PNCP query: "${query}"`);

    return query;
}

/**
 * Flow 3 - Step 3: Detect category conflicts
 * Check if PNCP results are from a different category than CATMAT
 * @param {Object} catmatData - CATMAT data
 * @param {Array} pncpResults - PNCP results
 * @returns {Object|null} Conflict details or null if no conflict
 */
export function detectarConflito(catmatData, pncpResults) {
    if (!pncpResults || pncpResults.length === 0) {
        return null; // No conflict if no PNCP results
    }

    const catmatClasse = catmatData.classe.toLowerCase();
    const catmatNome = catmatData.nome.toLowerCase();

    // Check if top PNCP result is from a clearly different category
    const topResult = pncpResults[0];
    const pncpDescricao = topResult.descricao_oficial.toLowerCase();

    // Simple conflict detection: check if CATMAT class/name appears in PNCP description
    const hasClassMatch = pncpDescricao.includes(catmatClasse);
    const hasNameMatch = pncpDescricao.includes(catmatNome);

    // If neither class nor name match, it's likely a conflict
    if (!hasClassMatch && !hasNameMatch) {
        console.warn(`[CATMAT] Category conflict detected: CATMAT="${catmatNome}" vs PNCP="${pncpDescricao}"`);
        return {
            catmat_classe: catmatData.classe,
            catmat_nome: catmatData.nome,
            pncp_descricao: topResult.descricao_oficial,
            motivo: 'Categoria do PNCP não corresponde à classe do CATMAT'
        };
    }

    return null; // No conflict
}

/**
 * Flow 3 - Step 4: Controlled consolidation
 * CATMAT defines nucleus, PNCP only adds usage details
 * @param {Object} catmatData - CATMAT data
 * @param {Array} pncpResults - PNCP results
 * @returns {string} Consolidated description
 */
export function consolidarDescricao(catmatData, pncpResults) {
    const parts = [];

    // 1. CATMAT name (nucleus - mandatory)
    parts.push(catmatData.nome);

    // 2. CATMAT description (standardized parameters - mandatory)
    if (catmatData.descricao && catmatData.descricao !== catmatData.nome) {
        parts.push(catmatData.descricao);
    }

    // 3. PNCP details (usage/presentation - optional, controlled)
    if (pncpResults && pncpResults.length > 0) {
        const topPncp = pncpResults[0];

        // Extract only usage details, not core item type
        // Look for patterns like "unidade: X", "apresentação: Y", etc.
        const usageDetails = extractUsageDetails(topPncp.descricao_oficial);

        if (usageDetails) {
            parts.push(usageDetails);
        }
    }

    const consolidated = parts.join('. ').trim();

    console.log(`[CATMAT] Consolidated description: "${consolidated}"`);

    return consolidated;
}

/**
 * Extract usage details from PNCP description
 * Only extracts presentation/usage info, not core item type
 * @param {string} pncpDescricao - PNCP description
 * @returns {string|null} Usage details or null
 */
function extractUsageDetails(pncpDescricao) {
    // Look for common usage patterns
    const patterns = [
        /unidade[:\s]+([^,\.]+)/i,
        /apresenta[çc][ãa]o[:\s]+([^,\.]+)/i,
        /embalagem[:\s]+([^,\.]+)/i,
        /forma de fornecimento[:\s]+([^,\.]+)/i
    ];

    const details = [];

    for (const pattern of patterns) {
        const match = pncpDescricao.match(pattern);
        if (match && match[1]) {
            details.push(match[1].trim());
        }
    }

    return details.length > 0 ? details.join(', ') : null;
}
