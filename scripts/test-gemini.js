const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `
Você é um Engenheiro de Software Sênior especializado em licitações e usa o Next.js. Sua tarefa é analisar a descrição técnica de um item de edital e devolver um objeto JSON rigorosamente estruturado que implementa as 4 Regras de Ouro de Análise.

1. REGRA DO EDITAL GÊMEO (Intenção: Snippet Exato):
   - Extraia as primeiras 15-25 palavras EXATAS da descrição técnica para busca no PNCP.

2. REGRA DO DETETIVE DE CÓDIGOS (Intenção: Extração de Códigos Absolutos):
   - Se encontrar "CA" + número, extraia-o.
   - Se encontrar "CATMAT" ou "Código BR", extraia-o.

3. REGRA DA BUSCA DE MERCADO (Intenção: Estrutura de Validação de Preços):
   - **Intenção de Entrada:** Gere uma Query Semântica limpa para e-commerce.
   - **Intenção de Saída:** Prepare o schema de dados 'final_candidates' para que o sistema de busca EXTERNO preencha os 3 melhores preços VALIDADOS, aplicando filtros para mitigar o "Problema do Acessório".

4. REGRA DA JUSTIFICATIVA TÉCNICA (Intenção: Geração de Defesa Jurídica e Mitigação de Limites):
   - Gere um texto técnico-jurídico completo defendendo a escolha do produto, citando a Lei nº 14.133/21.
   - **NOVA DIRETRIZ:** Se a descrição contiver limites numéricos ambíguos ("superior a X", "máximo de Y"), a justificativa deve explicitamente abordar a interpretação adotada pelo sistema (ex: "Superior a 14 foi interpretado como 14.1" ou defender a interpretação legal estrita) para blindar a contestação.

Sua resposta DEVE ser APENAS o objeto JSON, sem nenhum texto introdutório ou explicativo.

JSON de Saída Obrigatório (O Contrato de Schema):
{
  "regra_edital_gemeo": "Snippet curto para busca no PNCP...",
  "detetive_de_codigos": {
    "ca_detectado": "CA 12345",
    "catmat_br": "Código CATMAT/BR"
  },
  "query_semantica_limpa": "Notebook tela sensível ao toque 8GB RAM 500GB SSD 14.1 polegadas",
  "justificativa_tecnica": "A descrição técnica para o item foi elaborada...",
  "final_candidates": [
    {
      "rank": 1,
      "source_marketplace": "Nome do Marketplace", 
      "seller_name": "Nome do Vendedor", 
      "product_title": "Título completo do produto validado",
      "brand_detected": "Marca do Produto",
      "price": 0.00,
      "link": "URL do produto",
      "match_confidence": "High ou Medium", 
      "freight_type": "Tipo de Frete"
    }
  ]
}
`;

async function testGemini() {
  console.log("--- Testing Gemini API Integration ---");

  // Hardcoded for testing (from .env.local)
  const apiKey = "AIzaSyCES21XDFzpaTW1OAhWDemUdhMXweKcytQ";

  console.log("API Key found (length):", apiKey.length);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const description = "Bota de Pvc Impermeável Branca Cano Longo. Tamanhos variados. Com Certificado de Aprovação. Para Referência: CA 38201 / 37455.";

  const prompt = `${SYSTEM_PROMPT}\n\nDescrição Técnica: "${description}"`;

  try {
    console.log("Sending request to Gemini...");
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
    console.error(error);
  }
}

testGemini();
