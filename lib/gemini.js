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
   - A Query Semântica deve representar o nome pelo qual o produto é conhecido no mercado, acompanhado apenas das características essenciais utilizadas para identificação comercial, tais como material base, forma física, concentração relevante, uso predominante e unidade de fornecimento.
   - A Query Semântica deve sempre incluir a unidade comercial de fornecimento informada na descrição literal (ex.: embalagem, frasco, caixa, galão, saco).
   - Quando o item possuir volume ou peso de embalagem, essa informação deve ser obrigatoriamente incorporada à descrição comercial final, porque é uma característica essencial para identificação e cotação no mercado.
   - Não copie trechos da descrição literal, não replique texto do edital, não trunque frases e não inclua detalhes jurídicos ou requisitos documentais.
   - A síntese deve resultar em uma frase curta, clara e objetiva, equivalente a como um fornecedor identifica o produto no ato da cotação.
   - Exemplo: "Luva Vaqueta Segurança Petroleira Par" (em vez de "Luva de segurança...")
   - Exemplo: "Álcool Etílico 70% Frasco 1L" (em vez de "Álcool...")
   
   **REGRAS ESPECIAIS POR CATEGORIA DE PRODUTO:**
   
   **PRINCÍPIO UNIVERSAL:** Use VALORES ESPECÍFICOS nunca ranges ("8GB" não "8GB+", "15.6 polegadas" não "superior a 14", "18kg" não "superior a 15kg")
   
   **ELETRÔNICOS (Notebooks, Smartphones, Tablets, Impressoras):**
   - Para NOTEBOOKS: inclua tamanho tela exato, processador traduzido (ex: "Intel Core i5"), RAM, SSD, touchscreen se houver, webcam, teclado ABNT2, Windows
   - Para SMARTPHONES: inclua tamanho tela, capacidade armazenamento, RAM, câmera
   - Para IMPRESSORAS: inclua tipo (laser/jato), função (multifuncional), conectividade (WiFi)
   - Traduza specs: "núcleos 4-8" → "Intel Core i5", "sistema proprietário" → "Windows", "superior a 14" → "15.6 polegadas"
   - Exemplo: "Notebook 15.6 polegadas touchscreen Intel Core i5 8GB RAM SSD 512GB webcam Windows teclado ABNT2"
   
   **ELETRODOMÉSTICOS (Máquinas de Lavar, Geladeiras, Ar-Condicionado, Micro-ondas, Fogões):**
   - Inclua: capacidade/potência exata, voltagem, diferenciais tecnológicos (Turbo, Inverter, Frost Free, Anti-bolhas)
   - Inclua: número de programas, funções especiais, dispensers
   - Traduza: "superior a 18kg" → "18kg", "superior a 12000 BTU" → "12000 BTU"
   - Exemplo: "Máquina de Lavar 18kg 110V 12 Programas Turbo Anti-bolhas Dispensers Completos"
   - Exemplo: "Geladeira Frost Free 450L Inox Duplex Inverter"
   - Exemplo: "Ar Condicionado Split Inverter 12000 BTU 220V"
   
   **FERRAMENTAS E EQUIPAMENTOS PROFISSIONAIS (Furadeiras, Parafusadeiras, Serras, Compressores):**
   - Inclua: potência exata (W/HP), voltagem, tipo (com fio/bateria), características profissionais
   - Inclua: mandril, velocidade, impacto se houver
   - Traduza: "potência superior a 700W" → "800W"
   - Exemplo: "Furadeira Impacto 800W 110V Profissional Mandril 13mm"
   - Exemplo: "Parafusadeira Bateria 20V Brushless 2 Baterias Maleta"
   
   **MÓVEIS E EQUIPAMENTOS DE ESCRITÓRIO (Mesas, Cadeiras, Armários, Estantes):**
   - Inclua: material principal (MDF/Madeira/Aço), dimensões principais (largura x altura)
   - Inclua: características (gavetas, rodízios, regulável, ergonômica)
   - Traduza: "MDF 15mm" → "MDF", "superior a 1.5m" → "1.60m"
   - Exemplo: "Mesa Escritório MDF 1.20m x 0.60m Branca 3 Gavetas"
   - Exemplo: "Cadeira Escritório Ergonômica Regulável Rodízios Braços Ajustáveis"
   
   **VEÍCULOS E PEÇAS AUTOMOTIVAS:**
   - Inclua: marca, modelo, ano, cilindradas/motor, combustível
   - Inclua: características principais (4 portas, ar-condicionado, direção hidráulica)
   - Exemplo: "Fiat Uno 2024 1.0 Flex 4 Portas Ar-Condicionado Direção Hidráulica"
   - Exemplo: "Pneu Aro 15 195/65R15 Radial"
   
   **MATERIAIS DE CONSTRUÇÃO (Cimento, Areia, Tijolos, Tintas):**
   - Inclua: tipo/especificação, quantidade (sacos, m³, litros), classe/resistência
   - Exemplo: "Cimento Portland CP-II 50kg Saco"
   - Exemplo: "Tinta Acrílica Branca Fosca 18L Galão"
   
   **ALIMENTOS E BEBIDAS (para licitações de merenda/hospitais):**
   - Inclua: tipo/categoria, peso/volume, embalagem, características (integral, desnatado, orgânico)
   - Exemplo: "Leite Integral UHT 1L Caixa"
   - Exemplo: "Arroz Branco Tipo 1 5kg Pacote"
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
