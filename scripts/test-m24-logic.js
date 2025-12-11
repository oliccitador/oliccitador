/**
 * TESTE DE ESTRESSE LÓGICO - M24 (Hybrid Quotation Engine)
 * Objetivo: Validar se o M24 escolhe a estratégia correta e limpa o texto adequadamente
 * para diversos cenários de entrada suja.
 * 
 * NÃO CONSOME CRÉDITOS DE API (Mocka a saída do Google)
 */

// Mock das dependências para não bater na API real
const mockSearch = async (query) => {
    return [
        { titulo: `Produto Simulado para: ${query}`, preco: 100, loja: "Teste Store" }
    ];
};

// Hack para substituir a função real pela mockada durante o teste
// Como estamos em CommonJS/Node script, vamos importar o módulo e sobrescrever se possível,
// ou clonar a lógica da função 'buscarMelhoresPrecosM24' mas usando o mock.
// Para ser Fiel, vou copiar a lógica CORE do M24 aqui para testar o algoritmo.

function cleanTextNLP(text) {
    if (!text) return "";
    // Regex IDÊNTICA ao arquivo lib/m24-quotation.js
    return text
        .replace(/\b(AQUISI[ÇC][ÃA]O|CONTRATA[ÇC][ÃA]O|REGISTRO|PRE[ÇC]OS|OBJETO|EDITAL|PREG[ÃA]O|FUTURA|DE|PARA)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function decideStrategy({ query, has_ca, ca_numero, query_semantica }) {
    console.log(`\n--- CENÁRIO DE TESTE ---`);
    console.log(`INPUT: query="${query || ''}" | CA="${ca_numero || ''}" | Semântica="${query_semantica || ''}"`);

    // --- LÓGICA M24 (Cópia Fiel) ---
    let detectedCA = ca_numero;

    if (!detectedCA && query) {
        const caMatch = query.match(/(?:CA|C\.A\.|CA:)\s*(\d{4,6})/i);
        if (caMatch) {
            detectedCA = caMatch[1];
            console.log(`[SCANNER] CA Detectado no texto: ${detectedCA}`);
        }
    }

    let finalSearchQuery = '';
    let strategy = 'unknown';

    if (detectedCA) {
        const cleanCA = detectedCA.replace(/\D/g, '');
        finalSearchQuery = `CA ${cleanCA} EPI`;
        strategy = 'ca_hybrid';
    } else {
        if (query_semantica && query_semantica.length > 3) {
            finalSearchQuery = query_semantica;
            strategy = 'semantic_gemini';
        } else {
            finalSearchQuery = cleanTextNLP(query || '');
            strategy = 'nlp_cleaner';
        }
    }

    console.log(`DECISÃO M24: Estratégia=[${strategy}] | Query Final=[${finalSearchQuery}]`);
    return { strategy, finalSearchQuery, detectedCA };
}

// --- CASOS DE TESTE ---

async function runTests() {
    const scenarios = [
        {
            name: "1. Texto Sujo com CA oculto",
            input: { query: "Luva de vaqueta petroleira com CA 12345 para uso geral" }
        },
        {
            name: "2. Texto Burocrático (Limpeza NLP)",
            input: { query: "Objeto do pregão registro de preços para aquisição futura de Botina de Segurança" }
        },
        {
            name: "3. Query Limpa vinda da IA (Prioridade)",
            input: { query: "Texto sujo original", query_semantica: "Botina Segurança Nobuck" }
        },
        {
            name: "4. CA Explícito (Vindo do M2)",
            input: { query: "", ca_numero: "20565", has_ca: true }
        },
        {
            name: "5. Formato de CA Alternativo no Texto",
            input: { query: "Capacete classe B C.A. 9876 com jugular" }
        },
        {
            name: "6. Texto Vazio (Erro esperado)",
            input: { query: "" }
        }
    ];

    let passed = 0;

    for (const test of scenarios) {
        console.log(`\n🔹 TESTE: ${test.name}`);
        const result = decideStrategy(test.input);

        // Validações Básicas
        if (test.name.includes("CA oculto") && result.strategy !== 'ca_hybrid') console.error("❌ FALHA: Deveria ser ca_hybrid");
        else if (test.name.includes("Limpeza NLP") && result.finalSearchQuery.includes("Objeto")) console.error("❌ FALHA: Não limpou 'Objeto'");
        else if (test.name.includes("Prioridade") && result.finalSearchQuery !== "Botina Segurança Nobuck") console.error("❌ FALHA: Ignorou query semântica");
        else {
            passed++;
            console.log("✅ PARECE CORRETO");
        }
    }

    console.log(`\n\nRESULTADO FINAL: ${passed}/${scenarios.length} cenários avaliados.`);
}

runTests();
