import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * CA Real Search Service
 * Tenta buscar dados do CA na Web via Google Custom Search API.
 * Se falhar (erro de chave), usa um Mock de segurança para demonstração.
 */

// Chaves carregadas do .env (Node environment)
// Chaves carregadas do .env (Node environment)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// DIAGNOSTICO: A chave _KEY e _KEY_2 (Gemini) são as únicas válidas, mas precisam da API ativada.
// A antiga chave dedicada (SEARCH_API_KEY) está revogada.
// PORTANTO: Prioridade absoluta para a chave que sabemos ser o projeto 766773995616
const SEARCH_API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY_2;
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX;

// MOCK DATA para demonstração imediata caso API falhe
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

    // 1. Tentar Mock primeiro se for um CA conhecido de teste (para evitar erro de API na demo)
    // (Remover em produção real, mas útil agora)
    // if (MOCK_DB[cleanCA]) {
    //     console.log(`[CA-SEARCH] Usando Mock para CA ${cleanCA}`);
    //     return MOCK_DB[cleanCA];
    // }

    // 2. Tentar Google Custom Search API
    if (SEARCH_API_KEY && SEARCH_CX) {
        try {
            console.log(`[CA-SEARCH] Buscando CA ${cleanCA} no Google...`);
            const data = await googleCustomSearch(cleanCA, SEARCH_API_KEY, SEARCH_CX);
            if (data) return data;
        } catch (error) {
            console.error(`[CA-SEARCH] Erro na API Google: ${error.message}`);
            // Fallback para Mock se a API falhar (ex: 403 Forbidden)
            if (MOCK_DB[cleanCA]) {
                console.log(`[CA-SEARCH] Fallback: Usando Mock para CA ${cleanCA}`);
                return MOCK_DB[cleanCA];
            }
        }
    } else {
        console.warn("[CA-SEARCH] Chaves de Busca não configuradas.");
        if (MOCK_DB[cleanCA]) return MOCK_DB[cleanCA];
    }

    return null;
}


async function googleCustomSearch(ca, apiKey, cx) {
    // Tentativa 1: Busca Específica
    let query = `CA ${ca} ficha técnica consulta`;
    let url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

    try {
        let response = await fetch(url);
        let json = await response.json();

        // Se falhar ou zero resultados, tenta query alternativa
        if (!json.items || json.items.length === 0) {
            console.log("[CA-SEARCH] Tentativa 1 falhou. Tentando query genérica...");
            query = `CA ${ca} equipamento proteção`;
            url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
            response = await fetch(url);
            json = await response.json();
        }

        if (json.error) {
            console.error(`[CA-SEARCH] Google API Error: ${json.error.message}`);
            return null;
        }

        if (!json.items || json.items.length === 0) return null;

        // Se achou, usa Gemini para estruturar o JSON a partir dos Snippets
        return await structureWithGemini(ca, json.items.slice(0, 5));

    } catch (err) {
        console.error("[CA-SEARCH] Fetch Error:", err);
        return null;
    }
}


async function structureWithGemini(ca, items) {
    if (!GOOGLE_API_KEY) return null;

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
        const result = await model.generateContent(prompt);
        const text = result.response.text();

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
