const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 3-FLOW SYSTEM PROMPT (Based on XML Specification) ---
const SYSTEM_PROMPT = `
Você é um Engenheiro de Software Sênior especializado em licitações públicas. Sua tarefa é analisar a descrição técnica de um item de edital seguindo as REGRAS ANTI-ALUCINAÇÃO e retornar um objeto JSON estruturado.

REGRAS GLOBAIS ANTI-ALUCINAÇÃO:
1. É PROIBIDO inventar códigos, CA, CATMAT, modelos, marcas ou normas que não constem em fontes oficiais.
2. É PROIBIDO inferir produto apenas por similaridade fraca de texto.
3. Quando não houver dado suficiente, a resposta obrigatória é: "SEM DADOS CONFIÁVEIS ENCONTRADOS".

ANÁLISE REQUERIDA:

1. REGRA DO EDITAL GÊMEO:
   - Extraia as primeiras 15-25 palavras EXATAS da descrição técnica para busca no PNCP.

2. REGRA DO DETETIVE DE CÓDIGOS:
   - Se encontrar "CA" + número, extraia-o.
   - Se encontrar "CATMAT" ou "Código BR", extraia-o.

3. REGRA DA JUSTIFICATIVA TÉCNICA:
   - Gere um texto técnico-jurídico completo defendendo a especificação, citando a Lei nº 14.133/21.
   - Se houver limites numéricos ambíguos ("superior a X"), aborde explicitamente a interpretação adotada.

Sua resposta DEVE ser APENAS o objeto JSON, sem texto introdutório.

JSON de Saída:
{
  "regra_edital_gemeo": "Snippet curto para busca no PNCP...",
  "detetive_de_codigos": {
    "ca_detectado": "CA 12345" ou "Nenhum detectado",
    "catmat_br": "Código CATMAT/BR" ou "Nenhum detectado"
  },
  "justificativa_tecnica": "Texto técnico-jurídico completo..."
}
`;

async function testGemini() {
  console.log("--- Testing Gemini API Integration ---");

  // Read API key from .env.local
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');

  let apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
    if (match) {
      apiKey = match[1].trim();
    }
  }

  if (!apiKey) {
    console.error("GOOGLE_API_KEY not found in .env.local or environment");
    process.exit(1);
  }

  console.log("API Key found (length):", apiKey.length);
  console.log("API Key prefix:", apiKey.substring(0, 10) + "...");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const description = "Bota de Pvc Impermeável Branca Cano Longo. Tamanhos variados. Com Certificado de Aprovação. Para Referência: CA 38201 / 37455.";

  const prompt = `${SYSTEM_PROMPT}\n\nDescrição Técnica: "${description}"`;

  try {
    console.log("Sending request to Gemini (model: gemini-1.5-flash)...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n--- Raw Response ---");
    console.log(text.substring(0, 500) + "...");

    let jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("\n--- Parsed JSON Success ---");
      console.log(JSON.stringify(parsed, null, 2));
    } else {
      console.error("\n--- Failed to extract JSON ---");
    }

  } catch (error) {
    console.error("\n--- ERROR ---");
    console.error(error.message);
    if (error.message.includes('404')) {
      console.error("Tip: The model 'gemini-pro' might not be available for this API key or region.");
    }
  }
}

testGemini();
