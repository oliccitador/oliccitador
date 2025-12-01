/**
 * CA Module - Isolated plugin for CA detection and information retrieval
 * Does NOT interfere with CATMAT, PNCP, or Semantic Query flows
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Detect CA in description
 * @param {string} description - Item description
 * @returns {string|null} CA number or null
 */
export function detectarCA(description) {
    if (!description) return null;

    // Regex to detect CA in multiple formats:
    // CA 46391, CA: 46391, CA-46391, CA46391, (CA: 46391)
    const caRegex = /(?:CA|ca)[\s:.-]*(\d{5,6})/i;
    const match = description.match(caRegex);

    if (match && match[1]) {
        console.log(`[CA-MODULE] CA detected: ${match[1]}`);
        return match[1];
    }

    return null;
}

/**
 * Search for CA information using AI (no scraping)
 * @param {string} ca - CA number
 * @param {string} description - Item description for context
 * @returns {Promise<Object|null>} CA data or null
 */
export async function buscarInformacoesCA(ca, description = "") {
    console.log(`[CA-MODULE] Searching for CA ${ca} information using AI...`);

    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('[CA-MODULE] GOOGLE_API_KEY not found');
            return null;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
Você é um especialista em EPIs (Equipamentos de Proteção Individual) e CAs (Certificados de Aprovação) do Ministério do Trabalho e Emprego (MTE).

CONTEXTO:
O usuário informou um CA: ${ca}
Descrição do item: "${description}"

TAREFA:
Com base no seu conhecimento sobre EPIs e CAs brasileiros, forneça:
1. "nome_comercial": Nome comercial típico do produto com este CA (como aparece em catálogos/anúncios)
2. "descricao_tecnica": Especificação técnica mínima do produto certificado (materiais, tipo de proteção, características essenciais)

REGRAS IMPORTANTES:
1. Use apenas conhecimento real sobre EPIs brasileiros
2. Se não tiver certeza sobre este CA específico, use a descrição do item para inferir o tipo de EPI
3. Seja específico e técnico na descrição
4. Não invente marcas ou modelos específicos
5. Foque nas características genéricas do tipo de EPI

FORMATO DE SAÍDA (JSON):
{
  "nome_comercial": "Nome do tipo de EPI",
  "descricao_tecnica": "Especificação técnica detalhada"
}

Se não houver informações suficientes, retorne: { "erro": "Informações insuficientes" }
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);

            if (data.erro) {
                console.warn(`[CA-MODULE] AI could not extract info for CA ${ca}`);
                return null;
            }

            if (data.nome_comercial && data.descricao_tecnica) {
                console.log(`[CA-MODULE] Successfully extracted info for CA ${ca}`);
                return {
                    ca_detectado: ca,
                    nome_comercial: data.nome_comercial,
                    descricao_tecnica: data.descricao_tecnica,
                    mensagem_usuario: "Este produto foi identificado a partir do CA informado. Recomendamos também consultar a descrição técnica, pois existem outros modelos no mercado com as mesmas especificações e preços diferentes, inclusive com CAs distintos."
                };
            }
        }

        return null;

    } catch (error) {
        console.error(`[CA-MODULE] Error searching for CA ${ca}:`, error.message);
        return null;
    }
}

/**
 * Main entry point for CA module
 * @param {string} description - Item description
 * @returns {Promise<Object|null>} CA data or null
 */
export async function buscarModuloCA(description) {
    const ca = detectarCA(description);

    if (!ca) {
        console.log('[CA-MODULE] No CA detected, skipping module');
        return null;
    }

    // Pass both CA and description to AI for better context
    const caInfo = await buscarInformacoesCA(ca, description);
    return caInfo;
}
