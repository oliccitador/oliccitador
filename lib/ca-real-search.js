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



async function structureWithGemini(ca, items) {
    console.log(`[CA-SEARCH] Gemini estruturando dados para CA ${ca} com ${items.length} snippets...`);

    if (!GOOGLE_API_KEY) {
        console.error("[CA-SEARCH] GOOGLE_API_KEY missing!");
        return null;
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    // STABILITY FIX: Revert to 1.5-flash (Production Ready) intead of 2.0-exp
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    try {
        console.log("[CA-SEARCH] Chamando Gemini API...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("[CA-SEARCH] Resposta Gemini recebida (preview):", text.substring(0, 50));

        // Clean cleanup
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[CA-SEARCH] Falha ao fazer parse do JSON do Gemini:", parseError);
            console.error("[CA-SEARCH] Texto recebido:", cleanedText);
            return null;
        }

    } catch (e) {
        console.error("[CA-SEARCH] Erro Geral no Gemini:", e);
        return null;
    }
}
