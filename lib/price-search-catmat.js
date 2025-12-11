/**
 * M4-CATMAT - Módulo de Cotação Dedicado para CATMAT
 * 
 * Diferenças do M4 (CA/EPI):
 * - Query baseada em specs completas (não código)
 * - Filtro por relevância de especificações
 * - Fallback inteligente (simplifica query se necessário)
 * - Foco em conformidade técnica para licitações
 */

import { searchGoogleShoppingAPI } from './serpapi.js';
import { pncpClient } from './pncp-client.js';

/**
 * Busca preços para produto CATMAT
 * @param {Object} params
 * @param {string} params.query_completa - Query com TODAS specs técnicas (do M3)
 * @param {string} params.nome_comercial - Nome comercial do produto
 * @param {Object} params.specs_criticas - Especificações críticas extraídas
 * @param {string} params.codigo_catmat - Código CATMAT (para PNCP)
 */
export async function buscarPrecosCATMAT({
    query_completa,
    nome_comercial,
    specs_criticas = {},
    codigo_catmat
}) {
    console.log('[CATMAT-PRICES] Iniciando busca de preços...');
    console.log(`[CATMAT-PRICES] Query completa: "${query_completa}"`);

    let finalQuery = '';
    let strategyUsed = '';
    let rawResults = [];
    let serpApiError = null;

    // PNCP executa em paralelo
    const pncpPromise = pncpClient.buscarPrecos(query_completa)
        .catch(err => {
            console.error('[CATMAT-PRICES] PNCP Error:', err.message);
            return [];
        });

    try {
        // TENTATIVA 1: Query completa com TODAS specs
        console.log('[CATMAT-PRICES] Tentativa 1: Query completa com specs...');
        rawResults = await searchGoogleShoppingAPI(query_completa);

        if (rawResults && rawResults.length >= 3) {
            console.log(`[CATMAT-PRICES] ✅ Query completa retornou ${rawResults.length} resultados`);
            finalQuery = query_completa;
            strategyUsed = 'full_specs_query';
        } else {
            // TENTATIVA 2: Query simplificada (apenas specs principais)
            console.log('[CATMAT-PRICES] ⚠️ Poucos resultados. Tentando query simplificada...');
            const querySimplificada = buildSimplifiedQuery(nome_comercial, specs_criticas);
            console.log(`[CATMAT-PRICES] Query simplificada: "${querySimplificada}"`);

            rawResults = await searchGoogleShoppingAPI(querySimplificada);

            if (rawResults && rawResults.length >= 3) {
                console.log(`[CATMAT-PRICES] ✅ Query simplificada retornou ${rawResults.length} resultados`);
                finalQuery = querySimplificada;
                strategyUsed = 'simplified_query';
            } else {
                // TENTATIVA 3: Nome comercial apenas (última chance)
                console.log('[CATMAT-PRICES] ⚠️ Ainda poucos resultados. Tentando apenas nome...');
                rawResults = await searchGoogleShoppingAPI(nome_comercial);
                finalQuery = nome_comercial;
                strategyUsed = 'name_only_fallback';
                console.log(`[CATMAT-PRICES] Retornou ${rawResults.length} resultados com nome apenas`);
            }
        }

    } catch (err) {
        console.error('[CATMAT-PRICES] SerpApi Error:', err.message);
        serpApiError = err.message;
    }

    // Aguardar PNCP
    let pncpResults = [];
    try {
        pncpResults = await pncpPromise;
        console.log(`[CATMAT-PRICES] PNCP retornou ${pncpResults.length} resultados`);
    } catch (e) {
        console.error('[CATMAT-PRICES] PNCP falhou:', e.message);
    }

    // FILTRO DE RELEVÂNCIA
    // Para CATMAT, não filtramos por código (como CA)
    // Mas podemos filtrar por palavras-chave das specs
    const filteredResults = filterByRelevance(rawResults, specs_criticas, nome_comercial);

    // Ordenar por preço e pegar top 3
    const validResults = filteredResults.filter(item => item.preco && item.preco > 0);
    const sortedResults = validResults.sort((a, b) => a.preco - b.preco);
    const top3 = sortedResults.slice(0, 3);

    const formattedPncp = pncpResults ? pncpResults.slice(0, 5) : [];

    console.log(`[CATMAT-PRICES] ✅ Retornando ${top3.length} preços + ${formattedPncp.length} refs PNCP`);

    return {
        produto: finalQuery,
        codigo_catmat: codigo_catmat || null,
        nome_comercial: nome_comercial,
        imagem: top3[0]?.imagem || "",
        melhores_precos: top3,
        referencias_governamentais: formattedPncp,
        fonte: "Google Shopping (CATMAT)",
        estrategia_usada: strategyUsed,
        specs_buscadas: specs_criticas,
        erro: serpApiError,
        total_encontrados: sortedResults.length
    };
}

/**
 * Constrói query simplificada com apenas specs principais
 * Remove specs muito específicas que podem limitar demais
 */
function buildSimplifiedQuery(nome_comercial, specs_criticas) {
    const parts = [nome_comercial];

    // Specs PRINCIPAIS (variam por categoria)
    // Notebook: tela, RAM, armazenamento (sem processador específico)
    // Impressora: tipo, funções, velocidade (sem resolução exata)

    if (specs_criticas.tela) {
        parts.push(specs_criticas.tela);
    }
    if (specs_criticas.ram) {
        parts.push(specs_criticas.ram);
    }
    if (specs_criticas.armazenamento) {
        // Simplifica: "SSD 256GB" vira "SSD"
        const storageType = specs_criticas.armazenamento.split(' ')[0];
        parts.push(storageType);
    }
    if (specs_criticas.tipo_impressao || specs_criticas.tipo) {
        parts.push(specs_criticas.tipo_impressao || specs_criticas.tipo);
    }
    if (specs_criticas.funcoes) {
        parts.push(specs_criticas.funcoes);
    }

    return parts.join(' ');
}

/**
 * Filtra resultados por relevância baseado em specs críticas
 * Não é filtro binário (como CA), mas pontuação de relevância
 */
function filterByRelevance(results, specs_criticas, nome_comercial) {
    if (!results || results.length === 0) return [];

    // Se não há specs, retorna tudo (sem filtro)
    if (!specs_criticas || Object.keys(specs_criticas).length === 0) {
        return results;
    }

    // Pontua cada resultado baseado em quantas specs aparecem no título
    const scored = results.map(item => {
        let score = 0;
        const tituloLower = item.titulo?.toLowerCase() || '';

        // Verifica cada spec crítica
        Object.values(specs_criticas).forEach(spec => {
            if (spec && tituloLower.includes(String(spec).toLowerCase())) {
                score += 1;
            }
        });

        // Bônus se nome comercial aparece
        if (nome_comercial && tituloLower.includes(nome_comercial.toLowerCase())) {
            score += 2;
        }

        return { ...item, relevance_score: score };
    });

    // Ordena por relevância (mantém todos, mas priorizados)
    scored.sort((a, b) => b.relevance_score - a.relevance_score);

    // Retorna todos (não descarta, apenas reordena)
    console.log(`[CATMAT-PRICES] Relevância calculada. Top result score: ${scored[0]?.relevance_score || 0}`);
    return scored;
}

/**
 * Valida se specs do produto atendem requisitos mínimos
 * Usado para alertar se resultado pode não atender licitação
 */
export function validarConformidade(produtoTitulo, specs_obrigatorias) {
    const tituloLower = produtoTitulo.toLowerCase();
    const conformidade = {
        atende: true,
        specs_faltantes: [],
        confianca: 100
    };

    Object.entries(specs_obrigatorias).forEach(([key, value]) => {
        if (!tituloLower.includes(String(value).toLowerCase())) {
            conformidade.atend = false;
            conformidade.specs_faltantes.push(key);
            conformidade.confianca -= 20;
        }
    });

    return conformidade;
}
