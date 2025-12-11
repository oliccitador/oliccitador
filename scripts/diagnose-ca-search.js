

// Script de Diagnóstico PROFUNDO para CA Search
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load .env.local manual
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const CX = process.env.GOOGLE_SEARCH_CX;
const API_KEY = process.env.GOOGLE_SEARCH_API_KEY_M2 || process.env.GOOGLE_API_KEY; // Prioriza chave M2
const GEMINI_KEY = process.env.GOOGLE_API_KEY;

if (!CX || !API_KEY || !GEMINI_KEY) {
    console.error("❌ Faltam chaves no .env.local (mesmo após leitura manual)");
    console.log("CX:", !!CX, "SearchKey:", !!API_KEY, "GeminiKey:", !!GEMINI_KEY);
    // Tentar hardcode de fallback se necessário para debug, mas preferimos ler do env
    process.exit(1);
}

async function testCASearch(ca) {
    console.log(`\n\n🔍 --- DIAGNOSTICANDO CA ${ca} ---`);

    // 1. TENTATIVA GOOGLE SEARCH (Oficial)
    const query = `CA ${ca} ficha técnica consulta`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;

    console.log(`[Google] Buscando: "${query}"...`);

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`❌ Erro HTTP Google: ${res.status} ${res.statusText}`);
            const errText = await res.text();
            console.error("Detalhes:", errText);
            return;
        }

        const json = await res.json();

        if (!json.items || json.items.length === 0) {
            console.error("❌ Google retornou ZERO items.");

            // Retry Logic Check
            console.log("[Retry] Tentando query alternativa: 'equipamento proteção'...");
            const query2 = `CA ${ca} equipamento proteção`;
            const url2 = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query2)}`;
            const res2 = await fetch(url2);
            const json2 = await res2.json();

            if (!json2.items || json2.items.length === 0) {
                console.error("❌❌ Google Retry também retornou ZERO items. FIM DA LINHA.");
                return;
            }
            console.log(`✅ Retry salvou! Encontrou ${json2.items.length} itens.`);
            await testGemini(ca, json2.items);
            return;
        }

        console.log(`✅ Google encontrou ${json.items.length} itens.`);
        console.log("Exemplo Item 1:", json.items[0].title);

        // 2. TENTATIVA GEMINI PARSE
        await testGemini(ca, json.items);

    } catch (e) {
        console.error("❌ Exceção Fatal:", e);
    }
}

async function testGemini(ca, items) {
    console.log("[Gemini] Iniciando análise de snippets...");

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Usando Stable/Exp conforme lib/gemini.js

    const context = items.slice(0, 5).map(i => `Title: ${i.title}\nSnippet: ${i.snippet}`).join('\n---\n');

    const prompt = `
    Analise os snippets de busca sobre o CA ${ca}.
    JSON OBRIGATÓRIO (Formato Exato):
    {
        "numero_ca": "${ca}",
        "fabricante": "string",
        "nome_comercial": "string",
        "descricao_tecnica": "string",
        "validade": "string",
        "link_fonte": "string"
    }
    CONTEXTO: ${context}
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("📝 Resposta Bruta Gemini:", text.substring(0, 100) + "...");

        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const finalJson = JSON.parse(clean);

        console.log("✅ JSON VALIDADO COM SUCESSO:");
        console.log(JSON.stringify(finalJson, null, 2));

    } catch (e) {
        console.error("❌ Erro Parsing/Gemini:", e.message);
    }
}

// Executar testes
(async () => {
    // Teste 1: O CA problemático
    await testCASearch("40677");

    // Teste 2: Um CA que sabemos que existe
    // await testCASearch("40377");
})();
