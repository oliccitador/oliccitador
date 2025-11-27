/**
 * CAEPI Integration Module - Flow 1 Implementation
 * 
 * Implements CA consultation with anti-hallucination rules:
 * - Only use official CAEPI data
 * - Return CA_NAO_ENCONTRADO if CA doesn't exist
 * - No inference or approximation
 */

/**
 * Consult CAEPI for CA data
 * @param {string} numeroCA - CA number
 * @returns {Promise<Object|null>} CA data or null if not found
 */
export async function consultarCA(numeroCA) {
    if (!numeroCA || numeroCA.trim().length === 0) {
        return { status: 'CA_NAO_ENCONTRADO', error: 'CA number is required' };
    }

    try {
        // CAEPI doesn't have a public API
        // This is a placeholder for future third-party API integration
        // For now, we return a structured error

        console.log(`[CAEPI] Attempting to query CA: ${numeroCA}`);

        // TODO: Integrate with third-party API (e.g., Infosimples)
        // For MVP, we'll return a not-found status

        return {
            status: 'CA_NAO_ENCONTRADO',
            error: 'CAEPI API integration not available. Please provide CA data manually.',
            ca_number: numeroCA
        };

    } catch (error) {
        console.error('[CAEPI] Error querying CA:', error);
        return {
            status: 'CA_NAO_ENCONTRADO',
            error: error.message,
            ca_number: numeroCA
        };
    }
}

/**
 * Extract official data from CA record
 * Anti-hallucination: Only use fields present in official record
 * @param {Object} fichaCA - Official CA record
 * @returns {Object} Extracted data
 */
export function extrairDadosCA(fichaCA) {
    if (!fichaCA) return null;

    return {
        nome_oficial_produto: fichaCA.nome_produto || null,
        fabricante: fichaCA.fabricante || null,
        descricao_tecnica: fichaCA.descricao || null,
        modelo_ou_referencia: fichaCA.modelo || null,
        normas_aplicaveis: fichaCA.normas || [],
        validade_CA: fichaCA.validade || null
    };
}

/**
 * Generate clean specification from CA data
 * Removes legal text, keeps only technical content
 * @param {Object} dadosCA - CA data
 * @returns {string} Clean specification
 */
export function gerarEspecificacaoLimpa(dadosCA) {
    if (!dadosCA || !dadosCA.descricao_tecnica) {
        return null;
    }

    // Remove common legal/administrative phrases
    let especificacao = dadosCA.descricao_tecnica;

    // Remove legal boilerplate
    especificacao = especificacao
        .replace(/de acordo com.{0,50}lei.{0,50}/gi, '')
        .replace(/conforme.{0,50}portaria.{0,50}/gi, '')
        .replace(/nos termos.{0,50}/gi, '')
        .trim();

    return especificacao;
}

/**
 * Generate technical justification for CA-based specification
 * @param {string} trLiteral - Original TR text
 * @param {string} numeroCA - CA number
 * @param {Object} dadosCA - CA data
 * @returns {string} Justification text
 */
export function gerarJustificativaCA(trLiteral, numeroCA, dadosCA) {
    const partes = [];

    // 1. Original TR excerpt
    partes.push(`**Trecho literal do Termo de Referência:**`);
    partes.push(`"${trLiteral}"`);
    partes.push('');

    // 2. CA information
    partes.push(`**Certificado de Aprovação utilizado:**`);
    partes.push(`CA ${numeroCA}`);
    partes.push('');

    // 3. Technical description from CA
    if (dadosCA.descricao_tecnica) {
        partes.push(`**Descrição técnica oficial do CA:**`);
        partes.push(dadosCA.descricao_tecnica);
        partes.push('');
    }

    // 4. Validity
    if (dadosCA.validade_CA) {
        partes.push(`**Validade do CA:** ${dadosCA.validade_CA}`);
        partes.push('');
    }

    // 5. Source declaration
    partes.push(`**Fonte dos dados:**`);
    partes.push(`A especificação técnica foi extraída exclusivamente da base oficial CAEPI (Cadastro de Aprovação de Equipamentos de Proteção Individual) do Ministério do Trabalho e Emprego.`);
    partes.push('');

    // 6. Legal compliance
    partes.push(`**Fundamentação legal:**`);
    partes.push(`A utilização do CA está em conformidade com a NR-6 (Norma Regulamentadora nº 6) que estabelece a obrigatoriedade de Certificado de Aprovação para Equipamentos de Proteção Individual.`);

    return partes.join('\n');
}

/**
 * Parse CA data from user input (manual entry)
 * This is a fallback when API is not available
 * @param {string} caNumber - CA number
 * @param {string} userProvidedDescription - User-provided description
 * @returns {Object} Parsed CA data
 */
export function parseCAData(caNumber, userProvidedDescription) {
    if (!caNumber) return null;

    return {
        ca_number: caNumber,
        descricao_tecnica: userProvidedDescription || null,
        source: 'manual',
        note: 'Dados fornecidos manualmente pelo usuário a partir do portal CAEPI',
        status: 'OK'
    };
}

/**
 * Enhance description with CA context
 * @param {string} baseDescription - Base description
 * @param {Object} caData - CA data
 * @returns {string} Enhanced description
 */
export function enhanceDescriptionWithCA(baseDescription, caData) {
    if (!caData) return baseDescription;

    return `${baseDescription}\n\n[Certificado de Aprovação: CA ${caData.ca_number}]`;
}
