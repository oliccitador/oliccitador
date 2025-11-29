/**
 * Flow Orchestrator - Determines which analysis flow to execute
 * Based on the 3-Flow Intention System with anti-hallucination rules
 */

/**
 * Determine which flow to execute based on inputs
 * @param {Object} input - Input parameters
 * @param {string} input.description - TR description (required)
 * @param {string} [input.ca] - CA number (optional)
 * @param {string} [input.catmat] - CATMAT code (optional)
 * @returns {string} Flow identifier
 * @version 2.0 - Flow Promotion with Regex Scanner
 */
export function determineFlow({ description, ca, catmat }) {
    // 1. REGEX SCANNER: Auto-detect CATMAT in text if not provided explicitly
    // This promotes the request to Flow 3 (CATMAT) which uses the local DB
    if (!catmat && description) {
        const catmatRegex = /(?:CATMAT|BR|CÓDIGO|CODIGO)[\s:.-]*(\d{6,})/i;
        const match = description.match(catmatRegex);

        if (match && match[1]) {
            console.log(`[ORCHESTRATOR] Auto-detected CATMAT in text: ${match[1]}`);
            catmat = match[1]; // "Pretend" user typed it
        } else {
            console.log('[ORCHESTRATOR] No CATMAT code found in description via Regex');
        }
    }

    const hasCA = !!ca && ca.trim().length > 0;
    const hasCATMAT = !!catmat && catmat.trim().length > 0;

    // Flow 1: TR + CA (EPI → CAEPI Direct)
    if (hasCA && !hasCATMAT) {
        return 'FLOW_1_CA';
    }

    // Flow 3: TR + CATMAT (CATMAT isolated + PNCP isolated)
    // Now also catches auto-detected codes from step 1
    if (hasCATMAT && !hasCA) {
        return 'FLOW_3_CATMAT';
    }

    // Flow 2: TR without CA or CATMAT (PNCP literal → semantic)
    if (!hasCA && !hasCATMAT) {
        return 'FLOW_2_PNCP';
    }

    // Edge case: Both CA and CATMAT provided
    // Priority: CA (more specific for EPI)
    if (hasCA && hasCATMAT) {
        console.warn('[FLOW-ORCHESTRATOR] Both CA and CATMAT provided. Prioritizing CA (Flow 1).');
        return 'FLOW_1_CA';
    }

    // Fallback (should never reach here)
    return 'FLOW_2_PNCP';
}

/**
 * Execute the appropriate flow
 * @param {string} flow - Flow identifier
 * @param {Object} input - Input parameters
 * @returns {Promise<Object>} Flow result
 */
export async function executeFlow(flow, input) {
    const { description, ca, catmat } = input;

    switch (flow) {
        case 'FLOW_1_CA':
            return await executeFlow1(description, ca);

        case 'FLOW_2_PNCP':
            return await executeFlow2(description);

        case 'FLOW_3_CATMAT':
            return await executeFlow3(description, catmat);

        default:
            throw new Error(`Unknown flow: ${flow}`);
    }
}

/**
 * Flow 1: TR + CA → CAEPI
 */
async function executeFlow1(description, ca) {
    const { consultarCA, gerarJustificativaCA } = await import('./caepi.js');

    console.log(`[FLOW-1] Executing CA flow for: ${ca}`);

    // Step 1: Query CAEPI
    const caData = await consultarCA(ca);

    // Step 2: Check if CA was found
    if (!caData || caData.status === 'CA_NAO_ENCONTRADO') {
        return {
            flow_used: 'FLOW_1_CA',
            status: 'CA_NAO_ENCONTRADO',
            error: `CA ${ca} não encontrado na base CAEPI`,
            especificacao_limpa: null,
            codigo_utilizado: ca,
            bloco_justificativa: null
        };
    }

    // Step 3: Generate clean specification
    const especificacaoLimpa = caData.descricao_tecnica;

    // Step 4: Generate justification
    const blocoJustificativa = gerarJustificativaCA(description, ca, caData);

    return {
        flow_used: 'FLOW_1_CA',
        status: 'OK',
        especificacao_limpa: especificacaoLimpa,
        codigo_utilizado: ca,
        bloco_justificativa: blocoJustificativa,
        ca_data: caData
    };
}

/**
 * Flow 2: TR → PNCP (Literal → Semantic)
 */
async function executeFlow2(description) {
    const { buscaLiteral, buscaSemantica, consolidarMelhorDescricao } = await import('./pncp.js');

    console.log('[FLOW-2] Executing PNCP flow (literal → semantic)');

    // Step 1: Literal search (priority)
    const literalResults = await buscaLiteral(description);

    let semanticResults = [];
    let statusCorrespondencia = 'LITERAL';

    // Step 2: If no literal match, try semantic
    if (!literalResults || literalResults.length === 0) {
        console.log('[FLOW-2] No literal match, attempting semantic search');
        semanticResults = await buscaSemantica(description);
        statusCorrespondencia = semanticResults.length > 0 ? 'SEMANTICA' : 'SEM_CORRESPONDENCIA';
    }

    // Step 3: Consolidate best description
    const melhorDescricao = consolidarMelhorDescricao(literalResults, semanticResults);

    if (!melhorDescricao) {
        return {
            flow_used: 'FLOW_2_PNCP',
            status: 'SEM_CORRESPONDENCIA',
            query_semantica_limpa: null,
            bloco_justificativa: `Trecho do TR: "${description}"\n\nNenhuma correspondência segura foi encontrada no PNCP após busca literal e semântica.`
        };
    }

    // Step 4: Generate justification
    const blocoJustificativa = `Trecho do TR: "${description}"\n\nTipo de correspondência: ${statusCorrespondencia}\n\nDescrição PNCP encontrada: ${melhorDescricao.descricao}\n\nFonte: Portal Nacional de Contratações Públicas`;

    return {
        flow_used: 'FLOW_2_PNCP',
        status: statusCorrespondencia,
        query_semantica_limpa: melhorDescricao.descricao,
        bloco_justificativa: blocoJustificativa,
        pncp_data: melhorDescricao
    };
}

/**
 * Flow 3: TR + CATMAT → Controlled Consolidation
 */
async function executeFlow3(description, catmat) {
    const { consultarCATMAT } = await import('./catmat.js');
    const { prepararQueryPNCP, consolidarDescricao, detectarConflito } = await import('./catmat.js');

    console.log(`[FLOW-3] Executing CATMAT flow for: ${catmat}`);

    // Step 1: Query CATMAT (isolated)
    const catmatData = await consultarCATMAT(catmat);

    if (!catmatData || catmatData.status === 'CATMAT_NAO_ENCONTRADO') {
        return {
            flow_used: 'FLOW_3_CATMAT',
            status: 'CATMAT_NAO_ENCONTRADO',
            error: `CATMAT ${catmat} não encontrado`,
            codigo_utilizado: catmat
        };
    }

    // Step 2: Query PNCP (isolated)
    const pncpQuery = prepararQueryPNCP(description, catmatData);
    const { buscaSemantica } = await import('./pncp.js');
    const pncpResults = await buscaSemantica(pncpQuery);

    // Step 3: Detect category conflicts
    const conflito = detectarConflito(catmatData, pncpResults);

    if (conflito) {
        return {
            flow_used: 'FLOW_3_CATMAT',
            status: 'CONFLITO_CATEGORIA',
            error: 'Conflito de categoria detectado entre CATMAT e PNCP',
            codigo_utilizado: catmat,
            catmat_data: catmatData,
            conflito_detalhes: conflito
        };
    }

    // Step 4: Controlled consolidation
    const descricaoConsolidada = consolidarDescricao(catmatData, pncpResults);

    // Step 5: Generate justification
    const blocoJustificativa = `Trecho do TR: "${description}"\n\nCódigo CATMAT: ${catmat}\nNome oficial CATMAT: ${catmatData.nome}\nDescrição CATMAT: ${catmatData.descricao}\n\nConsolidação: A descrição foi consolidada respeitando a classe do CATMAT como núcleo, com complementos do PNCP apenas para detalhes de uso e apresentação.`;

    return {
        flow_used: 'FLOW_3_CATMAT',
        status: 'OK',
        descricao_consolidada: descricaoConsolidada,
        codigo_utilizado: catmat,
        bloco_justificativa: blocoJustificativa,
        catmat_data: catmatData,
        pncp_data: pncpResults
    };
}
