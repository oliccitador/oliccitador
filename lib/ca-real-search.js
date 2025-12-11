import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchGoogleWeb } from './serpapi.js';

/**
 * CA Real Search Service
 * Busca AMPLA na web (anúncios, PDFs, manuais) para encontrar dados do CA.
 * Usa IA para extrair informações de QUALQUER fonte que mencione o CA.
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

    // 1. SerpApi Organic Search (AMPLA - captura anúncios, PDFs, manuais, lojas)
    try {
        console.log(`[CA-SEARCH] Buscando CA ${cleanCA} via SerpApi (Busca Ampla - inclui anúncios e docs)...`);

        // Query AMPLA: Remove restrições para capturar QUALQUER menção ao CA
        // Aceita: lojas de EPI, anúncios Mercado Livre, PDFs técnicos, etc
        let query = `CA ${cleanCA}`;
        let result = await searchGoogleWeb(query);

        if (!result.items || result.items.length === 0) {
            console.log("[CA-SEARCH] Tentativa 1 falhou. Tentando com contexto EPI...");
            query = `"CA ${cleanCA}" EPI`;
            result = await searchGoogleWeb(query);
        }

        if (result.items && result.items.length > 0) {
            console.log(`[CA-SEARCH] SerpApi retornou ${result.items.length} resultados (incluindo anúncios comerciais).`);
            // Passa MAIS resultados (10 em vez de 5) para Gemini ter mais chances
            return await structureWithGemini(cleanCA, result.items.slice(0, 10));
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
    console.log(`[CA-SEARCH] Gemini estruturando dados para CA ${ca} com ${items.length} snippets (de anúncios e docs)...`);

    // Preparar objeto de Fallback usando o primeiro resultado
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const context = items.map(item => `
        TITULO: ${item.title}
        SNIPPET: ${item.snippet}
        LINK: ${item.link}
        `).join('\n---\n');

        const prompt = `
        Você é um especialista em Equipamentos de Proteção Individual (EPIs).
        Analise os resultados de busca sobre o Certificado de Aprovação (CA) ${ca}.
        
        IMPORTANTE: Os resultados podem vir de:
        - Anúncios de lojas especializadas em EPI
        - Fichas técnicas de fabricantes
        - PDFs e manuais de produtos
        - Sites de consulta de CA
        - Marketplaces (Mercado Livre, etc)
        
        Sua tarefa é EXTRAIR as informações técnicas do CA, independente da fonte.
        Se encontrar o nome do produto e fabricante em um anúncio de loja, USE essas informações.
        
        Regras:
        1. Extraia Nome Comercial e Fabricante de QUALQUER fonte que mencione claramente o CA ${ca}
        2. Se houver conflito entre fontes, prefira a mais detalhada
        3. A descrição técnica pode vir de snippets de lojas (ex: "Botina bico de aço CA...")
        4. Se não encontrar validade, use "Consultar fonte oficial"
        5. Retorne APENAS o JSON válido. Sem markdown, sem explicação.
    
        CONTEXTO DOS RESULTADOS:
        ${context}

        JSON OBRIGATÓRIO (Formato Exato):
        {
            "numero_ca": "${ca}",
            "fabricante": "Nome do Fabricante (extraído de qualquer fonte confiável)",
            "nome_comercial": "Nome Comercial do Produto",
            "descricao_tecnica": "Descrição completa do EPI (pode vir de anúncios)",
            "validade": "DD/MM/AAAA ou 'Consultar fonte oficial'",
            "link_fonte": "URL da melhor fonte encontrada"
        }
        `;

        console.log("[CA-SEARCH] Chamando Gemini API (2.0-flash-exp com instruções para aceitar anúncios)...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("[CA-SEARCH] Resposta Gemini recebida (preview):", text.substring(0, 80));

        // Clean cleanup
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanedText);
            console.log("[CA-SEARCH] ✅ Gemini estruturou dados com sucesso!");
            return parsed;
        } catch (parseError) {
            console.error("[CA-SEARCH] Falha no Parse JSON. Usando Fallback.", parseError.message);
            return fallbackResult;
        }

    } catch (e) {
        console.error("[CA-SEARCH] Erro Geral no Gemini:", e.message);
        console.warn("[CA-SEARCH] ATIVANDO FALLBACK DE SEGURANÇA (Dados Brutos)");
        return fallbackResult;
    }
}
