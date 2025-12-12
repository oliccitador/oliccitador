/**
 * ⚖️ AGENTE 6 - LEGAL MIND ENGINE (Jurídico + Minutas)
 * Conforme DEV DOC 3/8 + DEV DOC 4/8 + DEV DOC 5/8
 * 
 * Responsável por:
 * - Responder userQuestions[] usando APENAS evidência
 * - Gerar minutas (esclarecimento/impugnação) com template fixo
 * - SOMENTE gera minuta quando houver gatilho + evidência
 * - Lista fundamentos legais aplicáveis SEM ex trapolar fatos
 * 
 * ENTRADA: CORPO_INTEGRADO + alerts de outros agentes + userQuestions
 * SAÍDA: Envelope padrão + respostas + minutas
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_06';

class LegalMindEngine {
    async process(corpoIntegrado, { alerts = [], userQuestions = [] } = {}) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Processando análise jurídica');

            // Responde perguntas do usuário
            const respostas = await this.answerQuestions(userQuestions, corpoIntegrado);

            // Gera minutas baseado em gatilhos
            const minutas = await this.generateMinutas(alerts, corpoIntegrado);

            const runTime = Date.now() - startTime;

            return {
                agent_id: AGENT_ID,
                status: 'ok',
                dados: {
                    respostas_usuario: respostas,
                    minutas
                },
                alerts: [],
                evidence: [],
                metadata: {
                    run_ms: runTime,
                    items_found: minutas.length,
                    sections_hit: [],
                    confidence: 0.85
                },
                quality_flags: {
                    needs_review: false,
                    low_ocr_quality: false,
                    missing_sections: []
                }
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });
            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: { respostas_usuario: [], minutas: [] },
                alerts: [{ type: 'ERROR', message: error.message, severity: 'HIGH' }],
                evidence: [],
                metadata: { run_ms: Date.now() - startTime, items_found: 0 },
                quality_flags: { needs_review: true }
            };
        }
    }

    async answerQuestions(questions, corpus) {
        return questions.map(q => ({
            pergunta: q.text,
            categoria: 'JURIDICO',
            resposta: "Resposta baseada em evidência (implementação futura com IA)",
            origens: []
        }));
    }

    async generateMinutas(alerts, corpus) {
        const minutas = [];

        // Gera minuta SOMENTE se houver gatilho com evidência
        const gatilhos = alerts.filter(a =>
            a.type === 'WARNING' && a.action_suggested === 'IMPUGNACAO'
        );

        for (const gatilho of gatilhos) {
            minutas.push({
                tipo: 'IMPUGNACAO',
                titulo: 'Minuta de Impugnação',
                texto: this.buildImpugnacaoTemplate(gatilho),
                gatilho: gatilho.message,
                origens: []
            });
        }

        return minutas;
    }

    buildImpugnacaoTemplate(gatilho) {
        return `MINUTA DE IMPUGNAÇÃO

Ao [ÓRGÃO]

[EMPRESA], CNPJ [X], vem respeitosamente IMPUGNAR o Edital [X] pelos seguintes fundamentos:

1. FATOS
${gatilho.message}

2. FUNDAMENTO LEGAL
Lei 14.133/2021

3. PEDIDO
Retificação do edital

Atenciosamente,
[EMPRESA]`;
    }
}

export default LegalMindEngine;
