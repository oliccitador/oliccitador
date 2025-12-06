import { GoogleGenerativeAI } from "@google/generative-ai";
// Deployment forced: 2025-12-03 16:28 BRT - Timeout protection with 25-word queries

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

3. REGRA DA QUERY SEMÂNTICA LIMPA (Busca Comercial):
   - Gere uma string curta ("Produto Marca Modelo Atributos") para busca no Google Shopping.
   - Exemplo: "Luva Vaqueta Segurança Petroleira Par"

4. REGRA DA DESCRIÇÃO TÉCNICA LIMPA (Reconstrução):
   - Objetivo: Gerar a descrição TÉCNICA perfeita para o campo "Descrição Detalhada" da cotação, removendo AGRESSIVAMENTE todo o lixo jurídico e obrigações da contratada.
   - REMOVA OBRIGATORIAMENTE:
     - Termos de serviço/Obrigação: "A contratada deve", "fornecer", "devendo", "obrigatoriamente", "incluso instalação", "treinamento", "montagem", "startup incluso".
     - Termos de Acessórios/Brindes: "acompanha", "inclusos", "contendo", "capa", "película", "toner inicial", "mouse", "teclado" (se não for o item principal), "cabos" (se genérico), "maleta", "estojo".
     - Termos de entrega/Embalagem: "no local", "frete", "prazo de entrega", "balcão", "on-site", "caixa com", "fardos", "lacrados".
     - Documentação: "manuais", "drivers", "laudos", "certificados" (exceto se for certificação do PRODUTO como CA ou Inmetro), "laudo ergonômico".
     - Referências burocráticas/Marcas de Ref: "conforme edital", "anexo I", "termo de referência", "neste item", "objeto deste", "ver abaixo", "marca de referência", "ou similar".
     - Garantia/Validade: REMOVA COMPLETAMENTE frases de garantia e validade (ex: "garantia de 36 meses", "validade mínima"). ISSO É CRÍTICO.
   - MANTENHA:
     - O NOME do produto (Substantivo principal).
     - TODAS as especificações técnicas (voltagem, dimensões, material, cor, capacidade, potência).
     - Marca/Modelo APENAS se for a definição do PRODUTO (ex: "Tablet Samsung"), NUNCA como "referência".
   - O texto deve ser fluido e direto, parecendo uma etiqueta de produto de e-commerce.
   - Exemplo Entrada: "Capacete de segurança... CA válido... cor azul... devendo a contratada fornecer laudo..."
   - Exemplo Saída: "Capacete segurança polietileno alta densidade aba total classe B suspensão dupla jugular cor azul"

5. REGRA DA JUSTIFICATIVA TÉCNICA:
   - Gere um texto técnico-jurídico completo defendendo a especificação, citando a Lei nº 14.133/21.
   - Se houver limites numéricos ambíguos ("superior a X"), aborde explicitamente a interpretação adotada.

Sua resposta DEVE ser APENAS o objeto JSON, sem texto introdutório.

JSON de Saída:
{
  "regra_edital_gemeo": "Snippet curto para busca no PNCP...",
  "query_semantica_limpa": "Produto Atributo1 Atributo2",
  "descricao_tecnica_limpa": "Descrição técnica completa e limpa...",
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
      const jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

      // Helper to clean description and extract meaningful words (VALIDATED VERSION)
      const cleanAndExtract = (text, wordLimit) => {
        if (!text) return "";

        // 1. Remove valores monetários (R$ X.XXX,XX ou X.XXX,XX)
        let cleaned = text
          .replace(/R\$\s?[\d\.]+,?\d{0,2}/gi, '')
          .replace(/\b\d{1,3}(\.\d{3})*,\d{2}\b/g, '')

          // 2. Remove unidades decimais (UN 1,0000 ou 1,0000)
          .replace(/\bUN\b\s+[\d,\.]+/gi, '')
          .replace(/\b\d+,\d{4}\b/g, '')

          // 3. Remove sequências numéricas soltas (billing codes) - MAS PRESERVA NÚMEROS + ATRIBUTOS
          .replace(/\b[\d,\.]+\s+[\d,\.]+\s+[\d,\.]+\b(?!\s+[A-Z])/g, '')

          // 4. Remove peso em KG (não é especificação comercial)
          .replace(/\b\d+,\d+KG\b/gi, '')

          // 5. Remove palavras irrelevantes (incluindo PULSAR, + símbolo)
          .replace(/\b(OU|MAIS|COMUM|NAO|INDUSTRIAL|BASE|ANTIDERRAPANTE|GARANTIA|DE|MESES|PULSAR)\b/gi, '')
          .replace(/\+/g, '')

          // 6. Limpeza geral de pontuação
          .replace(/[^\wÀ-ÿ\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // 7. Normalização de termos específicos
        cleaned = cleaned
          .replace(/\bAUTOLIMPEZA\b/gi, 'AUTOLIMPANTE')
          .replace(/\bACO\s+INOX\b/gi, '');

        // 8. Extrai capacidade (3L, 142L, etc.) - força lowercase no 'l'
        const capacityMatch = text.match(/\b(\d+)L\b/i);
        const capacity = capacityMatch ? `CAPACIDADE ${capacityMatch[1]}l` : '';

        // 9. Split e filtro (preserva números que vêm antes de palavras)
        const words = cleaned.split(' ').filter(w => w.length > 0);

        // 10. Deduplicate (mas mantém ordem para números + atributos)
        const uniqueWords = [];
        const seen = new Set();
        for (const word of words) {
          const key = word.toUpperCase();
          if (!seen.has(key) && word.length > 2) {
            seen.add(key);
            uniqueWords.push(word);
          } else if (!seen.has(key) && word.match(/^\d+$/)) {
            // Preserva números soltos (podem ser parte de "12 VELOCIDADES")
            uniqueWords.push(word);
          }
        }

        // 11. Reorganiza: PRODUTO + CAPACIDADE + ATRIBUTOS + VOLTAGEM
        let result = [];

        // Produto (primeira palavra)
        if (uniqueWords[0]) result.push(uniqueWords[0]);

        // Capacidade
        if (capacity) result.push(capacity);

        // Demais atributos (exceto voltagem e capacidade)
        const voltage = uniqueWords.find(w => w.match(/\d+V$/i));
        const otherAttrs = uniqueWords.slice(1).filter(w => {
          // Remove voltagem e palavras que contêm 'L' sozinho (já incluído em capacidade)
          return w !== voltage && !w.match(/^\d+L$/i);
        });
        result.push(...otherAttrs);

        // Voltagem por último
        if (voltage) result.push(voltage);

        return result.slice(0, wordLimit).join(' ');
      };

      if (jsonMatch) {
        geminiAnalysis = JSON.parse(jsonMatch[0]);
        console.log("[GEMINI] Analysis successful");

        // UNIVERSAL CLEANING: Enforce cleaning even on successful API response
        if (geminiAnalysis.regra_edital_gemeo) {
          geminiAnalysis.regra_edital_gemeo = cleanAndExtract(geminiAnalysis.regra_edital_gemeo, 15);
        }

        if (geminiAnalysis.query_semantica_limpa) {
          // Always clean and deduplicate the AI's output first
          geminiAnalysis.query_semantica_limpa = cleanAndExtract(geminiAnalysis.query_semantica_limpa, 25);

          // If AI returned a short query (or became short after cleaning), try to enrich it from description
          if (geminiAnalysis.query_semantica_limpa.split(' ').length < 3) {
            geminiAnalysis.query_semantica_limpa = cleanAndExtract(description, 25);
          }
        }

        // NEW: Validate and fallback for Clean Technical Description
        if (!geminiAnalysis.descricao_tecnica_limpa || geminiAnalysis.descricao_tecnica_limpa.length < 10) {
          // Apply strict cleaning to original description if AI failed to generate it
          geminiAnalysis.descricao_tecnica_limpa = cleanAndExtract(description, 50);
        }

      } else {
        console.warn("[GEMINI] Failed to parse JSON response");
        geminiAnalysis = {
          justificativa_tecnica: text,
          // Fallback for failed JSON parse
          descricao_tecnica_limpa: cleanAndExtract(description, 50)
        };
      }

    } catch (geminiError) {
      // Helper defined inside catch for scope safety in fallback (SAME VALIDATED VERSION)
      const cleanAndExtract = (text, wordLimit) => {
        if (!text) return "";

        let cleaned = text
          .replace(/R\$\s?[\d\.]+,?\d{0,2}/gi, '')
          .replace(/\b\d{1,3}(\.\d{3})*,\d{2}\b/g, '')
          .replace(/\bUN\b\s+[\d,\.]+/gi, '')
          .replace(/\b\d+,\d{4}\b/g, '')
          .replace(/\b[\d,\.]+\s+[\d,\.]+\s+[\d,\.]+\b(?!\s+[A-Z])/g, '')
          .replace(/\b\d+,\d+KG\b/gi, '')
          .replace(/\b(OU|MAIS|COMUM|NAO|INDUSTRIAL|BASE|ANTIDERRAPANTE|GARANTIA|DE|MESES|PULSAR)\b/gi, '')
          .replace(/\+/g, '')
          .replace(/[^\wÀ-ÿ\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        cleaned = cleaned
          .replace(/\bAUTOLIMPEZA\b/gi, 'AUTOLIMPANTE')
          .replace(/\bACO\s+INOX\b/gi, '');

        const capacityMatch = text.match(/\b(\d+)L\b/i);
        const capacity = capacityMatch ? `CAPACIDADE ${capacityMatch[1]}l` : '';

        const words = cleaned.split(' ').filter(w => w.length > 0);

        const uniqueWords = [];
        const seen = new Set();
        for (const word of words) {
          const key = word.toUpperCase();
          if (!seen.has(key) && word.length > 2) {
            seen.add(key);
            uniqueWords.push(word);
          } else if (!seen.has(key) && word.match(/^\d+$/)) {
            uniqueWords.push(word);
          }
        }

        let result = [];
        if (uniqueWords[0]) result.push(uniqueWords[0]);
        if (capacity) result.push(capacity);

        const voltage = uniqueWords.find(w => w.match(/\d+V$/i));
        const otherAttrs = uniqueWords.slice(1).filter(w => w !== voltage && !w.match(/^\d+L$/i));
        result.push(...otherAttrs);

        if (voltage) result.push(voltage);

        return result.slice(0, wordLimit).join(' ');
      };

      if (geminiError.message === 'GEMINI_TIMEOUT') {
        console.error("[GEMINI] API Timeout after 20s");

        geminiAnalysis = {
          regra_edital_gemeo: cleanAndExtract(description, 15),
          query_semantica_limpa: cleanAndExtract(description, 25),
          descricao_tecnica_limpa: cleanAndExtract(description, 50),
          justificativa_tecnica: "Análise simplificada devido a timeout. Descrição muito complexa para processamento completo."
        };
      } else {
        console.error("[GEMINI] API Error:", geminiError.message);
        console.error("[GEMINI] Error details:", geminiError);
        // Fallback if API fails (e.g. quota exceeded)
        geminiAnalysis = {
          regra_edital_gemeo: description.substring(0, 50),
          query_semantica_limpa: description.substring(0, 50),
          descricao_tecnica_limpa: cleanAndExtract(description, 50)
        };
      }
    }

    // Merge flowResult (deterministic) with geminiAnalysis (AI-generated)

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

    // NEW: Enforce AI Clean Technical Description precedence
    if (geminiAnalysis && geminiAnalysis.descricao_tecnica_limpa) {
      finalResult.descricao_tecnica_limpa = geminiAnalysis.descricao_tecnica_limpa;
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
