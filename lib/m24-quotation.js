/**
 * M24 - Módulo de Cotação Inteligente (Clone M4 Híbrido)
 * Exclusivo para Fluxo de Análise (M1)
 *
 * Objetivo: Interpretar descrições mistas (com ou sem códigos) e decidir a melhor estratégia
 * sem as restrições rigorosas "CA-Exclusivo" do M4 original.
 */

import { searchGoogleShoppingAPI } from './serpapi.js';
import { pncpClient } from './pncp-client.js';
import { intelligentProductSearch } from './intelligent-search.js';
import { consultarCA } from './caepi.js'; // Helper para validar CA se acharmos um

/**
 * Função Principal de Cotação M24
 */
export async function buscarMelhoresPrecosM24({ query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica }) {
    console.log('[M24-QUOTATION] Starting Advanced Hybrid Search...', { query: query?.substring(0, 50), has_ca, ca_numero });

    // --- FASE 1: RE-SCANNER INTELIGENTE ---
    // Mesmo se o M1 não mandou CA explícito, vamos caçar no texto da query (descrição)
    let detectedCA = ca_numero;
    let detectedCATMAT = null;

    if (!detectedCA && query) {
        const caMatch = query.match(/(?:CA|C\.A\.|CA:)\s*(\d{4,6})/i);
        if (caMatch) {
            detectedCA = caMatch[1];
            console.log(`[M24] Scanner detected CA in text: ${detectedCA}`);
        }
    }

    // --- FASE 2: DEFINIÇÃO DE ESTRATÉGIA ---
    let finalSearchQuery = '';
    let strategy = 'unknown';

    // A. ESTRATÉGIA CA-HÍBRIDA (Prioridade Máxima)
    if (detectedCA) {
        // Diferença do M4: Aqui buscamos "CA {NUM} EPI" mas se falhar, temos fallback!
        const cleanCA = detectedCA.replace(/\D/g, '');
        finalSearchQuery = `CA ${cleanCA} EPI`;
        strategy = 'ca_hybrid';
        console.log(`[M24] Strategy Selected: CA-HYBRID (${finalSearchQuery})`);
    }
    // B. ESTRATÉGIA SEMÂNTICA LIMPA (Texto Livre)
    else {
        // Se temos query semântica (do Gemini M1), usamos ela.
        if (query_semantica && query_semantica.length > 3) {
            finalSearchQuery = query_semantica;
            strategy = 'semantic_gemini';
        }
        // Fallback: Limpeza NLP manual do texto original
        else {
            finalSearchQuery = cleanTextNLP(query || ca_nome_comercial || '');
            strategy = 'nlp_cleaner';
        }
        console.log(`[M24] Strategy Selected: TEXT-CLEAN (${finalSearchQuery})`);
    }

    if (!finalSearchQuery || finalSearchQuery.length < 2) {
        return { produto: "Erro: Query vazia", melhores_precos: [], fonte: "Erro", erro: "Query inválida" };
    }

    // --- FASE 3: EXECUÇÃO (Google Shopping) ---
    let googleResults = [];
    let serpError = null;

    try {
        console.log(`[M24] Searching Google Shopping for: "${finalSearchQuery}"`);
        googleResults = await searchGoogleShoppingAPI(finalSearchQuery);

        // --- FASE 4: FILTRAGEM INTELIGENTE (Anti-Sucata + Relevância) ---

        // 4.1 Filtro CA (Se for estratégia CA)
        if (strategy === 'ca_hybrid' && detectedCA) {
            const matchCA = googleResults.filter(item => item.titulo.includes(detectedCA));
            if (matchCA.length > 0) {
                console.log(`[M24] CA Match Success: ${matchCA.length} items verified.`);
                googleResults = matchCA;
            } else {
                console.warn(`[M24] CA Search returned valid results but CA number not in title. Using generic results (Fallback allowed in M24).`);
                // M4 v3 retornaria vazio aqui. M24 aceita os resultados se o preço for bom.
            }
        }

    } catch (err) {
        console.error('[M24] SerpApi Error:', err.message);
        serpError = err.message;
    }

    // --- FASE 5: PNCP EM PARALELO ---
    let pncpResults = [];
    try {
        pncpResults = await pncpClient.buscarPrecos(finalSearchQuery);
    } catch (e) { /* ignore */ }


    // --- FASE 6: REFINAMENTO FINAL E ORDENAÇÃO ---
    // Filtra preços zerados e ordena
    const validResults = googleResults.filter(item => item.preco && item.preco > 0);
    const top3 = validResults.sort((a, b) => a.preco - b.preco).slice(0, 3);

    return {
        produto: finalSearchQuery,
        imagem: top3[0]?.imagem || "",
        melhores_precos: top3,
        referencias_governamentais: pncpResults.slice(0, 5),
        fonte: strategy === 'ca_hybrid' ? "Google Shopping (CA)" : "Google Shopping (Semântica)",
        origem_descricao: strategy,
        erro: serpError
    };
}

/**
 * Limpeza NLP Leve para descrições caóticas
 * Remove "Aquisição de", "Contratação de", etc.
 */
function cleanTextNLP(text) {
    if (!text) return "";
    return text
        // REMOVE APENAS TERMOS BUROCRÁTICOS DE EDITAL (Lista Conservadora)
        .replace(/\b(AQUISI[ÇC][ÃA]O|CONTRATA[ÇC][ÃA]O|REGISTRO|PRE[ÇC]OS|OBJETO|EDITAL|PREG[ÃA]O|FUTURA|LICITA[ÇC][ÃA]O|TERMO|REFER[ÊE]NCIA)\b/gi, ' ')

        // Remove referências a anexos e itens (ex: "Item 1", "Anexo I")
        .replace(/\bITEM\s+\d+\b/gi, '')
        .replace(/\bANEXO\s+\w+\b/gi, '')

        // Remove pontuação que atrapalha URL, mas mantém estrutura (hífen, etc)
        .replace(/[^\w\sÀ-ÿ\-\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
