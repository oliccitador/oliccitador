/**
 * 📊 AGENTE 9 - REPORT SYNTHESIZER (Consolidação Final)
 * Conforme DEV DOC 3/8 + DEV DOC 4/8 + DEV DOC 5/8
 * 
 * Responsável por:
 * - Consolidar TODOS os outputs dos agentes 2-8
 * - Montar caixa preta (timeline, warnings, rastreabilidade)
 * - Preparar modelo de dados para PDF/Anexo I (DEV DOC 5/8)
 * 
 * ENTRADA: Outputs de todos os agentes + pipeline_summary
 * SAÍDA: Envelope padrão + consolidado completo
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_09';

class ReportSynthesizer {
    async process(pipelineSummary, agentsOutputs) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Sintetizando relatório final');

            // Caixa preta
            const black_box = this.buildBlackBox(pipelineSummary, agentsOutputs);

            // Consolidado
            const consolidado = this.buildConsolidado(agentsOutputs);

            const runTime = Date.now() - startTime;

            logger.info(AGENT_ID, `Relatório consolidado em ${runTime}ms`);

            return {
                agent_id: AGENT_ID,
                status: 'ok',
                dados: {
                    black_box,
                    consolidado
                },
                alerts: [],
                evidence: [],
                metadata: {
                    run_ms: runTime,
                    items_found: 0,
                    confidence: 1.0
                },
                quality_flags: {
                    needs_review: false
                }
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });
            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: { black_box: {}, consolidado: {} },
                alerts: [{ type: 'ERROR', message: error.message }],
                metadata: { run_ms: Date.now() - startTime }
            };
        }
    }

    buildBlackBox(pipelineSummary, agentsOutputs) {
        const timeline = [];
        const warnings = [];
        const errors = [];

        // Pipeline timeline
        if (pipelineSummary?.etapas) {
            for (const etapa of pipelineSummary.etapas) {
                timeline.push({
                    step: etapa.nome,
                    status: etapa.status,
                    duration_ms: etapa.duracao_ms,
                    timestamp: etapa.timestamp
                });

                if (etapa.warnings) warnings.push(...etapa.warnings);
                if (etapa.erros) errors.push(...etapa.erros);
            }
        }

        // Agentes timeline
        for (const [key, output] of Object.entries(agentsOutputs)) {
            if (output?.metadata) {
                timeline.push({
                    step: output.agent_id,
                    status: output.status,
                    duration_ms: output.metadata.run_ms,
                    items_found: output.metadata.items_found
                });
            }

            if (output?.alerts) {
                warnings.push(...output.alerts.filter(a => a.type === 'WARNING'));
                errors.push(...output.alerts.filter(a => a.type === 'ERROR'));
            }
        }

        return {
            timeline,
            warnings,
            errors,
            total_execution_ms: timeline.reduce((sum, t) => sum + (t.duration_ms || 0), 0)
        };
    }

    buildConsolidado(agentsOutputs) {
        return {
            resumo_processo: agentsOutputs.agent2?.dados || {},
            itens: agentsOutputs.agent3?.dados?.itens || [],
            habilitacao: agentsOutputs.agent4?.dados || {},
            capacidade_tecnica: agentsOutputs.agent5?.dados || {},
            divergencias: agentsOutputs.agent7?.dados?.inconsistencias || [],
            respostas_usuario: agentsOutputs.agent6?.dados?.respostas_usuario || [],
            minutas: agentsOutputs.agent6?.dados?.minutas || [],
            matriz_risco: agentsOutputs.agent8?.dados?.matriz_risco || [],
            go_no_go: agentsOutputs.agent8?.dados?.go_no_go || {}
        };
    }
}

export default ReportSynthesizer;
