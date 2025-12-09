import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log("INICIANDO SCRIPT DE BUSCA CA...");

async function searchCA(caNumber) {
    if (!process.env.GOOGLE_API_KEY) {
        console.error("Erro: GOOGLE_API_KEY não encontrada.");
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // Usando o modelo que tem suporte a tools (em alguns ambientes, o gemini-2.0-flash-exp suporta google_search direto, 
    // mas se não suportar, usaremos a estratégia de RAG manual com Custom Search API se disponível, 
    // OU faremos o Gemini gerar as keywords e simularemos a busca se tivermos a chave de Search).
    // Nota: O SDK Node nem sempre expõe a tool de google_search facilmente sem configuração extra.
    // Vamos testar o modelo standard com prompt focado primeiro, assumindo que ele PODE ter acesso a dados recentes ou que vamos implementar a busca via API separada.

    // CORREÇÃO ESTRATÉGICA: Como eu (Agente) consegui buscar na web, o código DEVE usar a API de Busca do Google (Custom Search JSON API) se quisermos resultados "live" garantidos.
    // O Gemini sozinho NÃO navega na web exceto se usarmos a feature de Grounding especifica (Vertex AI ou Studio). 
    // Como estamos em ambiente .env simples, provavelmente não temos Vertex configurado.

    // Vamos verificar se temos GOOGLE_SEARCH_KEY e CX.
    const searchKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_KEY; // Tentativa de nomes comuns
    const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CSE_ID;

    if (searchKey && cx) {
        console.log("MÉTODO ESCOLHIDO: Google Custom Search API (Melhor Opção)");
        await runCustomSearch(caNumber, searchKey, cx);
    } else {
        console.log("AVISO: Chaves da Custom Search API não encontradas. Tentando Gemini Direct (pode alucinar/estar desatualizado).");
        console.log("Para funcionar 100%, precisamos da GOOGLE_SEARCH_API_KEY e GOOGLE_SEARCH_CX no .env.local");
        // Fallback apenas para teste
    }
}

async function runCustomSearch(ca, apiKey, cx) {
    const query = `CA ${ca} ficha técnica consulta`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

    console.log(`Buscando: ${query}...`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.log("Nenhum resultado encontrado.");
            return;
        }

        console.log(`Encontrados ${data.items.length} resultados.`);

        // Preparar contexto para o Gemini extrair os dados
        const snippets = data.items.slice(0, 5).map(item => `
        TÍTULO: ${item.title}
        SNIPPET: ${item.snippet}
        LINK: ${item.link}
        `).join("\n---\n");

        console.log("\nSnippets obtidos (Amostra):");
        console.log(snippets.substring(0, 500) + "...");

        // Chamar Gemini para estruturar
        await structureDataWithGemini(ca, snippets);

    } catch (error) {
        console.error("Erro na busca:", error.message);
    }
}

async function structureDataWithGemini(ca, context) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    Analise os seguintes resultados de busca do Google sobre o CA ${ca}.
    Extraia as informações técnicas OFICIAIS confirmadas nos snippets.
    
    RESULTADOS DA BUSCA:
    ${context}

    Retorne APENAS um JSON com este formato:
    {
        "numero_ca": "${ca}",
        "fabricante": "Nome do Fabricante (ou 'Não identificado')",
        "nome_comercial": "Nome do EPI",
        "descricao_tecnica": "Descrição completa (materiais, cor, normas)",
        "validade": "Data de validade (se encontrada) ou 'Não informada'",
        "link_fonte": "Melhor link encontrado"
    }
    `;

    const result = await model.generateContent(prompt);
    console.log("\n--- RESULTADO ESTRUTURADO (JSON) ---");
    console.log(result.response.text());
}

// Teste com o CA 40377 (Botina Estival que testamos antes)
searchCA("40377");
