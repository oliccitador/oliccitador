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
   - Sempre que o item não possuir CATMAT reconhecido, gere a Query Semântica exclusivamente no formato de descrição comercial do produto.
   - A Query Semântica deve representar o nome pelo qual o produto é conhecido no mercado, acompanhado das características essenciais para identificação comercial.
   - Não copie trechos da descrição literal, não replique texto do edital, não trunque frases e não inclua detalhes jurídicos ou requisitos documentais.
   - A síntese deve resultar em uma frase curta, clara e objetiva, equivalente a como um fornecedor identifica o produto no ato da cotação.
   
   **PRINCÍPIOS UNIVERSAIS DE EXTRAÇÃO (aplicam-se a QUALQUER produto):**
   
   1. CAPACIDADE/TAMANHO/POTÊNCIA:
      - Sempre extraia valores numéricos + unidade (18kg, 700W, 4.5L, 15.6", 12000 BTU)
      - Converta ranges para valores específicos: "superior a 14" → "15.6", "superior a 18kg" → "18kg"
   
   2. VOLUME/PESO DE EMBALAGEM (CRÍTICO para produtos vendidos por volume/peso):
      - SEMPRE INCLUIR para: químicos, limpeza, alimentos, bebidas, tintas, óleos
      - Incluir volume/peso + tipo de embalagem: "5L Galão", "1L Frasco", "5kg Pacote"
      - Exemplos: "Lava Roupas Líquido 5L", "Álcool Etílico 70% Frasco 1L", "Arroz Branco 5kg Pacote"
   
   3. DIMENSÕES FÍSICAS (CONTEXTUAL - incluir apenas quando são diferenciais comerciais):
      - INCLUIR para: móveis (largura x altura), pneus (aro, medida), portas/janelas, telas (polegadas)
      - REMOVER: dimensões de embalagem de eletrodomésticos, peso do produto acabado
      - Exemplos: "Mesa 1.20m x 0.60m", "Pneu Aro 15 195/65R15", "Monitor 27 polegadas"
   
   4. VOLTAGEM/ALIMENTAÇÃO:
      - Sempre inclua se mencionado: 110V, 220V, Bivolt, Bateria
   
   5. DIFERENCIAIS TECNOLÓGICOS (palavras-chave que indicam qualidade/preço superior):
      - Tecnologias: Inverter, Turbo, Frost Free, Anti-bolhas, Brushless, Concentrado
      - Materiais premium: Inox, Aço, Vidro Temperado, Madeira Maciça
      - Funções especiais: 12 Programas, 12 Velocidades, Multifuncional, Touchscreen
      - Traduza specs técnicas: "núcleos 4-8" → "Intel Core i5", "sistema proprietário" → "Windows"
   
   6. CARACTERÍSTICAS FÍSICAS RELEVANTES:
      - Número de: portas, gavetas, batedores, velocidades, programas
      - Tipo: touchscreen, multifuncional, ergonômica
   
   7. MARCA/MODELO:
      - Se mencionado explicitamente, sempre inclua
      - Priorize marcas líderes: Samsung, LG, Dell, HP, Makita, Bosch, Brastemp, Electrolux
   
   8. REMOVER SEMPRE (não afetam cotação):
      - Dados de faturamento: UN, valores monetários
      - Garantia: "12 meses", "on site"
      - Consumo energético: "0,7KWH", "Classe A"
      - Peso do produto: "3,23kg", "45kg" (exceto quando peso é a unidade de venda)
      - Dimensões de embalagem: "110x68x75cm"
      - Certificações/Normas (exceto CA para EPIs)
      - Frases jurídicas: "conforme especificação", "de acordo com"
      - Características padrão: "base antiderrapante", "4 níveis de água"
   
   **EXEMPLOS DE APLICAÇÃO:**
   - ✅ "Batedeira Planetária 4.5L 700W 12 Velocidades Turbo 2 Pares Batedores Inox 110V"
   - ✅ "Máquina de Lavar 18kg 110V 12 Programas Turbo Anti-bolhas Dispensers Completos"
   - ✅ "Notebook 15.6 polegadas touchscreen Intel Core i5 8GB RAM SSD 512GB webcam Windows teclado ABNT2"
   - ✅ "Lava Roupas Líquido 5L Concentrado Biodegradável"
   - ✅ "Mesa Escritório MDF 1.20m x 0.60m Branca 3 Gavetas"
   - ✅ "Pneu Aro 15 195/65R15 Radial"
   - ❌ "Batedeira 700W" (faltou capacidade, velocidades, diferenciais)
   - ❌ "Notebook 8GB+" (range genérico, faltou especificações)

4. REGRA DO PRODUTO DE REFERÊNCIA:
   - Identifique uma MARCA e MODELO específicos do mercado brasileiro que atendam EXATAMENTE às especificações técnicas.
   
   **FORMATO DO RETORNO:**
   - "marca": Nome da marca apenas (ex: "Samsung", "LG", "Dell")
   - "modelo": Código do modelo OU nome da linha/série (ex: "AR09AVHZ", "DUAL Inverter 9000", "WindFree 9K")
   - NUNCA repita a marca ou a descrição completa no campo "modelo"
   - O modelo DEVE cumprir TODAS as especificações técnicas descritas
   
   **QUANDO RETORNAR MARCA/MODELO:**
   - Se houver especificações técnicas quantificáveis (BTU, voltagem, potência, capacidade, tamanho)
   - Se houver características distintivas (tecnologia Inverter, tipo Split, material específico, certificação CA)
   
   **EXEMPLOS CORRETOS:**
   - ✅ { "marca": "Samsung", "modelo": "WindFree 9000 BTU" }
   - ✅ { "marca": "LG", "modelo": "DUAL Inverter S4-W09JA3AA" }
   - ✅ { "marca": "Brastemp", "modelo": "BWK12AB 12kg" }
   
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

      const prompt = `${SYSTEM_PROMPT}\\n\\nDescrição Técnica: "${description}"`;

      console.log("[GEMINI] Calling API...");

      // Timeout protection: 20 seconds for Gemini API call
      const GEMINI_TIMEOUT = 20000;
      const geminiPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT)
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();

      // Extract JSON
      const jsonText = text.replace(/```json\\s*/g, '').replace(/```\\s*/g, '');
      const jsonMatch = jsonText.match(/\\{[\\s\\S]*\\}/);

      if (jsonMatch) {
        geminiAnalysis = JSON.parse(jsonMatch[0]);
        console.log("[GEMINI] Analysis successful");
      } else {
        console.warn("[GEMINI] Failed to parse JSON response");
        geminiAnalysis = { justificativa_tecnica: text }; // Fallback
      }

    } catch (geminiError) {
      if (geminiError.message === 'GEMINI_TIMEOUT') {
        console.error("[GEMINI] API Timeout after 20s");
        // Provide fallback query based on first 100 chars
        geminiAnalysis = {
          regra_edital_gemeo: description.substring(0, 50),
          query_semantica_limpa: description.substring(0, 100).replace(/[^a-zA-Z0-9À-ÿ\s]/g, ' ').trim(),
          justificativa_tecnica: "Análise simplificada devido a timeout. Descrição muito complexa."
        };
      } else {
        console.error("[GEMINI] API Error:", geminiError.message);
        console.error("[GEMINI] Error details:", geminiError);
        // Fallback if API fails (e.g. quota exceeded)
        geminiAnalysis = {
          regra_edital_gemeo: description.substring(0, 50),
          query_semantica_limpa: description.substring(0, 50),
        };
      }
    }

    // Merge flowResult (deterministic) with geminiAnalysis (AI-generated)
    // flowResult takes priority for codes and structural data
    // BUT geminiAnalysis takes ABSOLUTE PRIORITY for "query_semantica_limpa" (Commercial Description)
    const finalResult = {
      ...geminiAnalysis,        // AI parts: justificativa, snippet, query_semantica
      ...flowResult,            // Orchestrator parts: codigos_detectados, catmat_data, flow_used
    };

    // CRITICAL FIX: Restore AI semantic query if it was overwritten by flowResult
    // The AI's commercial description is the primary source of truth for the market query.
    if (geminiAnalysis && geminiAnalysis.query_semantica_limpa) {
      console.log(`[GEMINI] Enforcing AI Semantic Query precedence: "${geminiAnalysis.query_semantica_limpa}"`);
      finalResult.query_semantica_limpa = geminiAnalysis.query_semantica_limpa;
    }

    // CA MODULE: Isolated plugin - does NOT interfere with existing flows
    // Only adds ca_module field if CA is detected
    try {
      const { buscarModuloCA } = await import('./ca-module.js');
      const caData = await buscarModuloCA(description);
      if (caData) {
        console.log('[GEMINI] CA Module data added to result');
        finalResult.ca_module = caData;
      }
    } catch (caError) {
      console.warn('[GEMINI] CA Module failed (non-critical):', caError.message);
      // CA module failure doesn't affect main analysis
    }

    return finalResult;
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
