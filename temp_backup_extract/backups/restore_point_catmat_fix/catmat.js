import fs from 'fs';
import path from 'path';

// Memory cache for the database to avoid reading 46MB on every request
let catmatDB = null;

/**
 * Flow 3 - Step 1: Query CATMAT (Local JSON)
 * @param {string} codigo - CATMAT code
 * @returns {Promise<Object|null>} CATMAT data or null if not found
 */
export async function consultarCATMAT(codigo) {
    if (!codigo || codigo.trim().length === 0) {
        return { status: 'CATMAT_NAO_ENCONTRADO', error: 'CATMAT code is required' };
    }

    try {
        console.log(`[CATMAT] Querying Local JSON for code: ${codigo}`);

        // Load DB if not loaded
        if (!catmatDB) {
            console.log('[CATMAT] Loading database into memory...');
            try {
                const filePath = path.join(process.cwd(), 'lib', 'catmat-db.json');
                const fileContent = fs.readFileSync(filePath, 'utf8');
                catmatDB = JSON.parse(fileContent);
            } catch (err) {
                // Fallback for different CWD (e.g. when running scripts)
                const filePath = path.join(process.cwd(), 'playground/olicitador/lib', 'catmat-db.json');
                if (fs.existsSync(filePath)) {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    catmatDB = JSON.parse(fileContent);
                } else {
                    console.error('[CATMAT] Failed to load DB:', err.message);
                    throw new Error("Could not load CATMAT database");
                }
            }
        }

        const item = catmatDB[codigo];

        if (!item) {
            console.warn(`[CATMAT] Code ${codigo} not found in local database.`);

            // FALLBACK: Soft Validation
            console.log(`[CATMAT] Applying Soft Validation for ${codigo}`);
            return {
                status: 'OK',
                codigo,
                nome: 'Item não catalogado (Soft Validation)',
                descricao: 'Descrição não disponível na base local',
                classe: 'Classe não identificada',
                unidade_padrao: 'UN',
                grupo: null,
                dados_completos: { source: 'soft_validation' }
            };
        }

        console.log(`[CATMAT] Found in local database: ${item.n || item.d}`);

        return {
            status: 'OK',
            codigo: codigo,
            nome: item.n || 'Nome não disponível',
            descricao: item.d || 'Descrição não disponível',
            classe: item.c || 'Classe não disponível',
            unidade_padrao: item.u || 'UN',
            grupo: null,
            dados_completos: item
        };

    } catch (error) {
        console.error('[CATMAT] Local JSON query failed:', error);
        return {
            status: 'OK', // Fail open
            codigo,
            nome: 'Erro na validação (Fallback)',
            descricao: 'Não foi possível validar o código',
            classe: 'Desconhecida',
            unidade_padrao: 'UN',
            grupo: null,
            dados_completos: { error: error.message }
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
