import { GoogleGenerativeAI } from "@google/generative-ai";

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

3. REGRA DA QUERY SEMÂNTICA LIMPA:
   - Gere uma string curta (max 5-7 palavras) otimizada para busca em e-commerce (ex: Mercado Livre, Google Shopping).
   - Remova "confeccionada em", "com reforço", "tipo", etc. Mantenha apenas o núcleo do produto + atributos essenciais.
   - Exemplo: "Luva Vaqueta Segurança Petroleira"

4. REGRA DO PRODUTO DE REFERÊNCIA:
   - Identifique uma MARCA e MODELO específicos do mercado brasileiro que atendam EXATAMENTE às especificações técnicas.
   
   **FORMATO DO RETORNO:**
   - "marca": Nome da marca apenas (ex: "Samsung", "LG", "Dell")
   - "modelo": Código do modelo OU nome da linha/série (ex: "AR09AVHZ", "DUAL Inverter 9000", "WindFree 9K")
   - NUNCA repita a marca ou a descrição completa no campo "modelo"
   - O modelo DEVE cumprir TODAS as especificações técnicas descritas (BTU, voltagem, tipo, etc.)
   
   **QUANDO RETORNAR MARCA/MODELO:**
   - Se houver especificações técnicas quantificáveis (BTU, voltagem, potência, capacidade, tamanho, normas técnicas)
   - Se houver características distintivas (tecnologia Inverter, tipo Split, material específico, certificação CA)
   - Priorize marcas líderes de mercado brasileiras (Samsung, LG, Midea, Springer, Dell, HP, Makita, Bosch, Volk, Danny, etc.)
   
   **EXEMPLOS CORRETOS:**
   - ✅ { "marca": "Samsung", "modelo": "WindFree 9000 BTU" }
   - ✅ { "marca": "LG", "modelo": "DUAL Inverter S4-W09JA3AA" }
   - ✅ { "marca": "Midea", "modelo": "Springer 42AGCB09S5" }
   
   **EXEMPLOS INCORRETOS:**
   - ❌ { "marca": "Samsung", "modelo": "Samsung - Ar Condicionado Split 9000 BTU" } (repetiu marca)
   - ❌ { "marca": "LG", "modelo": "Ar Condicionado Split Inverter 12000 BTU" } (descrição genérica)
   
   **QUANDO RETORNAR NULL:**
   - APENAS se a descrição for extremamente genérica SEM nenhuma especificação técnica
   - Exemplo: "Luva de segurança" (sem CA, sem material, sem norma)
   - Exemplo: "Caneta" (sem tipo, cor, marca)
   
   **REGRA ANTI-ALUCINAÇÃO:**
   - É PROIBIDO inventar marcas ou modelos que NÃO existam no mercado brasileiro
   - O produto sugerido DEVE atender a TODAS as especificações (não sugira 12000 BTU se o edital pede 9000 BTU)
   - Se incerto sobre o modelo exato, use apenas a marca + categoria geral (ex: "Samsung - Split Inverter 9000")

5. REGRA DA JUSTIFICATIVA TÉCNICA:
   - Gere um texto técnico-jurídico completo defendendo a especificação, citando a Lei nº 14.133/21.
   - Se houver limites numéricos ambíguos ("superior a X"), aborde explicitamente a interpretação adotada.

Sua resposta DEVE ser APENAS o objeto JSON, sem texto introdutório.

JSON de Saída:
{
  "regra_edital_gemeo": "Snippet curto para busca no PNCP...",
  "query_semantica_limpa": "Produto Atributo1 Atributo2",
  "produto_referencia": {
    "marca": "Nome da Marca",
    "modelo": "Nome do Modelo"
  } OU null,
  "detetive_de_codigos": {
    "ca_detectado": "CA 12345" ou "Nenhum detectado",
    "catmat_br": "Código CATMAT/BR" ou "Nenhum detectado"
  },
  "justificativa_tecnica": "Texto técnico-jurídico completo..."
}
`;

/**
 * Analyze procurement item with 3-flow system
 * Uses Gemini API for intelligence
 * @param {string} description - TR description
 * @param {string} ca - CA number (optional)
 * @param {string} catmat - CATMAT code (optional)
 * @returns {Promise<Object>} Analysis result with flow-specific data
 */
export async function analyzeWithFlow(description, ca, catmat) {
  console.log(`[GEMINI] Analyzing with 3-flow system: CA=${ca}, CATMAT=${catmat}`);

  try {
    // Import flow orchestrator
    const { determineFlow, executeFlow } = await import('./flow-orchestrator.js');

    // Determine which flow to use (now returns flowInfo with detected codes)
    const flowInfo = determineFlow({ description, ca, catmat });
    console.log(`[GEMINI] Selected flow: ${flowInfo.flow}, CA: ${flowInfo.ca}, CATMAT: ${flowInfo.catmat}`);

    // Execute the flow logic (CA/PNCP/CATMAT specific logic)
    // Pass flowInfo which contains the detected codes from regex
    const flowResult = await executeFlow(flowInfo, { description });

    // Call Gemini for the "Intelligence" part (Justification, Snippet extraction)
    let geminiAnalysis = {};
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_API_KEY not found");

      const genAI = new GoogleGenerativeAI(apiKey);
      // Using gemini-2.0-flash-exp as confirmed working model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `${SYSTEM_PROMPT}\n\nDescrição Técnica: "${description}"`;

      console.log("[GEMINI] Calling API...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON
      const jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        geminiAnalysis = JSON.parse(jsonMatch[0]);
        console.log("[GEMINI] Analysis successful");
      } else {
        console.warn("[GEMINI] Failed to parse JSON response");
        geminiAnalysis = { justificativa_tecnica: text }; // Fallback
      }

    } catch (geminiError) {
      console.error("[GEMINI] API Error:", geminiError.message);
      console.error("[GEMINI] Error details:", geminiError);
      // Fallback if API  fails (e.g. quota exceeded)
      geminiAnalysis = {
        regra_edital_gemeo: description.substring(0, 50),
        query_semantica_limpa: description.substring(0, 50),
      }
    }

    // Merge flowResult (deterministic) with geminiAnalysis (AI-generated)
    // flowResult takes priority for codes and structural data
    return {
      ...geminiAnalysis,        // AI parts: justificativa, snippet, query_semantica
      ...flowResult,            // Orchestrator parts: codigos_detectados, catmat_data, flow_used
    };
  } catch (error) {
    console.error("[GEMINI] Critical error in analyzeWithFlow:", error);
    return {
      error: "Failed to analyze item",
      details: error.message
    };
  }
}

// Placeholder exports for backward compatibility
export async function extractTechnicalVector(description) { return null; }
export async function generatePncpQueries(technicalVector) { return []; }
export async function compareItems(originalDescription, technicalVector, pncpCandidates) { return null; }
export async function analyzeProcurementItem(description) {
  return analyzeWithFlow(description, null, null);
}
