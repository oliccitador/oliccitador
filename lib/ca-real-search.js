import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * CA Real Search Service
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
    const query = `CA ${ca} ficha técnica consulta`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    const json = await response.json();

    if (json.error) {
        throw new Error(`Google API Error: ${json.error.message}`);
    }

    if (!json.items || json.items.length === 0) return null;

    // Se achou, usa Gemini para estruturar o JSON a partir dos Snippets
    // Isso é mais seguro que regex
    return await structureWithGemini(ca, json.items.slice(0, 5));
}

async function structureWithGemini(ca, items) {
    if (!GOOGLE_API_KEY) return null;

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const context = items.map(item => `
    TITULO: ${item.title}
    SNIPPET: ${item.snippet}
    LINK: ${item.link}
    `).join('\n---\n');

    const prompt = `
    Analise os snippets de busca sobre o CA ${ca}.
    Extraia dados confirmados. Se houver conflito de datas, prefira a mais futura (validade).
    
    CONTEXTO:
    ${context}

    JSON OBRIGATÓRIO:
    {
        "numero_ca": "${ca}",
        "fabricante": "Nome exato do fabricante",
        "nome_comercial": "Nome curto do produto",
        "descricao_tecnica": "Descrição técnica detalhada (material, tipo)",
        "validade": "DD/MM/AAAA ou 'Vigente'",
        "link_fonte": "Link mais confiavel"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
return JSON.parse(jsonText);
    } catch (e) {
    console.error("[CA-SEARCH] Erro no Gemini Parse:", e);
    return null;
}
}
