import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Analyze procurement item with 3-flow system
 * TEMPORARY: Bypasses Gemini due to invalid API key
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

    // Determine which flow to use
    const flow = determineFlow({ description, ca, catmat });
    console.log(`[GEMINI] Selected flow: ${flow}`);

    // Execute the flow
    const flowResult = await executeFlow(flow, { description, ca, catmat });

    // Mock base analysis (bypass Gemini due to invalid API key)
    const baseAnalysis = {
      regra_edital_gemeo: description.substring(0, 100),
      detetive_de_codigos: {
        ca_detectado: ca || "Nenhum detectado",
        catmat_br: catmat || "Nenhum detectado"
      },
      justificativa_tecnica: `Análise do item: ${description}\n\nNota: Usando análise simplificada (Gemini API temporariamente desabilitado para testes).`
    };

    // Merge results
    return {
      ...flowResult,
      detetive_de_codigos: baseAnalysis.detetive_de_codigos,
      regra_edital_gemeo: baseAnalysis.regra_edital_gemeo,
      _test_mode: true,
      _gemini_bypassed: true
    };

  } catch (error) {
    console.error('[GEMINI] Error in analyzeWithFlow:', error);
    return {
      error: 'Failed to analyze with flow system',
      details: error.message
    };
  }
}

// Placeholder exports for backward compatibility
export async function extractTechnicalVector(description) {
  return null;
}

export async function generatePncpQueries(technicalVector) {
  return [];
}

export async function compareItems(originalDescription, technicalVector, pncpCandidates) {
  return null;
}

export async function analyzeProcurementItem(description) {
  return {
    regra_edital_gemeo: description.substring(0, 100),
    detetive_de_codigos: {
      ca_detectado: "Nenhum detectado",
      catmat_br: "Nenhum detectado"
    },
    justificativa_tecnica: `Análise básica: ${description}`
  };
}
