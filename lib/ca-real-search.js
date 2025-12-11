import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchGoogleWeb } from './serpapi.js'; // NOVO: Usa SerpApi

/**
 * CA Real Search Service
 * Tenta buscar dados do CA na Web via SerpApi (mais confiável que Custom Search).
 * Se falhar, usa Mock.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// MOCK DATA para fallback imediato
const MOCK_DB = {
    '40377': {
        numero_ca: '40377',
        fabricante: 'ESTIVAL CALCADOS DE SEGURANCA LTDA',
        nome_comercial: 'BOTINA DE SEGURANÇA NOBUCK',
        descricao_tecnica: 'Calçado ocupacional de uso profissional, tipo botina, fechamento em cadarço, confeccionado em couro nobuck, palmilha de montagem em material sintético montada pelo sistema strobel, biqueira de conformação, solado de poliuretano bidensidade antiderrapante injetado diretamente no cabedal, sistema de absorção de energia na região do salto, resistente ao óleo combustível.',
        validade: '21/07/2027',
        link_fonte: 'https://consultaca.com/40377'
    },
    '20565': {
        numero_ca: '20565',
        fabricante: '3M DO BRASIL LTDA',
        nome_comercial: 'RESPIRADOR PFF2 COM VÁLVULA',
        descricao_tecnica: 'Respirador purificador de ar tipo peça semifacial filtrante para partículas, classe PFF2 (S), com válvula de exalação. Formato dobrável.',
        validade: 'VIGENTE',
        link_fonte: 'https://consultaca.com/20565'
    }
};

export async function buscarDadosCA(caNumber) {
    const cleanCA = caNumber.replace(/\D/g, '');

    // 1. SerpApi Organic Search
    try {
        console.log(`[CA-SEARCH] Buscando CA ${cleanCA} via SerpApi (Google Web)...`);

        // Tenta query específica
        let query = `CA ${cleanCA} ficha técnica consulta`;
        let result = await searchGoogleWeb(query);

        if (!result.items || result.items.length === 0) {
            console.log("[CA-SEARCH] Tentativa 1 (SerpApi) falhou. Tentando query genérica...");
            query = `CA ${cleanCA} equipamento proteção`;
            result = await searchGoogleWeb(query);
        }

        if (result.items && result.items.length > 0) {
            console.log(`[CA-SEARCH] SerpApi retornou ${result.items.length} resultados.`);
            return await structureWithGemini(cleanCA, result.items.slice(0, 5));
        }

    } catch (error) {
        console.error(`[CA-SEARCH] Erro na SerpApi: ${error.message}`);
    }

    // 2. Fallback para Mock se a API falhar
    if (MOCK_DB[cleanCA]) {
        console.log(`[CA-SEARCH] Fallback: Usando Mock para CA ${cleanCA}`);
        return MOCK_DB[cleanCA];
    }

    return null;
}

// Fixed Function: Uses Model 2.0 and Anti-Crash Fallback
async function structureWithGemini(ca, items) {
    console.log(`[CA-SEARCH] Gemini estruturando dados para CA ${ca} com ${items.length} snippets...`);

    // Preparar objeto de Fallback (Salvavidas) usando o primeiro resultado da busca
    const fallbackResult = {
        numero_ca: ca,
        fabricante: "Fabricante não identificado (IA Indisponível)",
        nome_comercial: items[0]?.title || "Produto Identificado na Web",
        descricao_tecnica: items[0]?.snippet || "Descrição técnica não pode ser estruturada pela IA, mas o CA existe.",
        validade: "Consulte o link fonte",
        link_fonte: items[0]?.link || ""
    };

    if (!GOOGLE_API_KEY) {
        console.error("[CA-SEARCH] GOOGLE_API_KEY missing! Usando fallback bruto.");
        return fallbackResult;
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        // FIX: Use model 2.0-flash-exp (compatible with M1 project key)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const context = items.map(item => `
        TITULO: ${item.title}
        SNIPPET: ${item.snippet}
        LINK: ${item.link}
        `).join('\n---\n');

        const prompt = `
        Analise os snippets de busca sobre o Certificado de Aprovação (CA) ${ca}.
        Seu objetivo é extrair os dados técnicos confirmados.
        
        Regras:
        1. Se houver conflito de datas de validade, prefira a data mais futura.
        2. Retorne APENAS o JSON válido. Sem markdown, sem explicação.
    
        CONTEXTO:
        ${context}

        JSON OBRIGATÓRIO (Formato Exato):
        {
            "numero_ca": "${ca}",
            "fabricante": "Nome do Fabricante",
            "nome_comercial": "Nome do Produto",
            "descricao_tecnica": "Descrição completa do EPI",
            "validade": "DD/MM/AAAA",
            "link_fonte": "URL"
        }
        `;

        console.log("[CA-SEARCH] Chamando Gemini API (2.0-flash-exp)...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("[CA-SEARCH] Resposta Gemini recebida (preview):", text.substring(0, 50));

        // Clean cleanup
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[CA-SEARCH] Falha no Parse JSON do Gemini. Usando Fallback.", parseError);
            return fallbackResult;
        }

    } catch (e) {
        console.error("[CA-SEARCH] Erro Geral no Gemini:", e.message);
        console.warn("[CA-SEARCH] ATIVANDO FALLBACK DE SEGURANÇA (Dados Brutos)");
        // Retorna o resultado bruto da web em vez de null.
        return fallbackResult;
    }
}
