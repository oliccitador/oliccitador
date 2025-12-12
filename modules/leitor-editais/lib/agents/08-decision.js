/**
 * 🎯 AGENTE 8 - DECISION CORE (Matriz de Risco + GO/NO-GO)
 * Conforme DEV DOC 3/8 + DEV DOC 4/8
 * 
 * Responsável por:
 * - Consolidar resultados dos agentes 2-7
 * - Produzir matriz de risco (probabilidade × impacto)
 * - Recomendação GO/NO-GO com justificativa baseada em evidência
 * 
 * ENTRADA: Outputs dos agentes 2-7
 * SAÍDA: Envelope padrão + matriz_risco + go_no_go
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_08';

class DecisionCore {
    async process(agentsOutputs) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Consolidando análise e decisão');

            // Extrai riscos de cada agente
            const riscos = this.extractRisks(agentsOutputs);

            // Monta matriz de risco
            const matriz_risco = this.buildRiskMatrix(riscos);

            // Decisão GO/NO-GO
            const go_no_go = this.decideGoNoGo(matriz_risco, agentsOutputs);

            const runTime = Date.now() - startTime;

            return {
                agent_id: AGENT_ID,
                status: 'ok',
                dados: {
                    matriz_risco,
                    go_no_go
                },
                alerts: [],
                evidence: [],
                metadata: {
                    run_ms: runTime,
                    items_found: matriz_risco.length,
                    confidence: 0.9
                },
                quality_flags: {
                    needs_review: go_no_go.recomendacao === 'NAO_RECOMENDADO'
                }
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });
            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: { matriz_risco: [], go_no_go: {} },
                alerts: [{ type: 'ERROR', message: error.message }],
                metadata: { run_ms: Date.now() - startTime }
            };
        }
    }

    extractRisks(agentsOutputs) {
        const riscos = [];

        // Agente 3 (Itens)
        if (agentsOutputs.agent3?.dados?.resumo) {
            const incompativeis = agentsOutputs.agent3.dados.resumo.incompativeis || 0;
            if (incompativeis > 0) {
                riscos.push({
                    tema: 'ITENS',
                    risco: `${incompativeis} itens incompatíveis com CNAE da empresa`,
                    probabilidade: 'ALTA',
                    impacto: 'MEDIO',
                    nivel: 'ALTO'
                });
            }
        }

        // Agente 4 (Compliance)
        if (agentsOutputs.agent4?.dados?.requisitos) {
            const excessivos = agentsOutputs.agent4.dados.requisitos.filter(r => r.exigencia_excessiva);
            if (excessivos.length > 0) {
                riscos.push({
                    tema: 'HABILITACAO',
                    risco: `${excessivos.length} exigências potencialmente excessivas`,
                    probabilidade: 'MEDIA',
                    impacto: 'ALTO',
                    nivel: 'ALTO'
                });
            }
        }

        // Agente 5 (Technical)
        if (agentsOutputs.agent5?.dados?.resumo) {
            const gatilhos = agentsOutputs.agent5.dados.resumo.gatilhos_impugnacao || 0;
            if (gatilhos > 0) {
                riscos.push({
                    tema: 'CAPACIDADE_TECNICA',
                    risco: `${gatilhos} gatilho(s) de impugnação detectado(s)`,
                    probabilidade: 'ALTA',
                    impacto: 'ALTO',
                    nivel: 'CRITICO'
                });
            }
        }

        // Agente 7 (Divergence)
        if (agentsOutputs.agent7?.dados?.inconsistencias) {
            const altas = agentsOutputs.agent7.dados.inconsistencias.filter(i => i.severidade === 'ALTA');
            if (altas.length > 0) {
                riscos.push({
                    tema: 'DIVERGENCIAS',
                    risco: `${altas.length} inconsistência(s) crítica(s) entre documentos`,
                    probabilidade: 'ALTA',
                    impacto: 'ALTO',
                    nivel: 'ALTO'
                });
            }
        }

        return riscos;
    }

    buildRiskMatrix(riscos) {
        return riscos.map(r => ({
            ...r,
            acao: this.suggestAction(r.nivel),
            origens: []
        }));
    }

    suggestAction(nivel) {
        if (nivel === 'CRITICO' || nivel === 'ALTO') return 'IMPUGNAR';
        if (nivel === 'MEDIO') return 'ESCLARECER';
        return 'MONITORAR';
    }

    decideGoNoGo(matriz, agentsOutputs) {
        const criticos = matriz.filter(r => r.nivel === 'CRITICO');
        const altos = matriz.filter(r => r.nivel === 'ALTO');

        if (criticos.length > 0) {
            return {
                recomendacao: 'NAO_RECOMENDADO',
                justificativa: `${criticos.length} risco(s) crítico(s) detectado(s). Impugnação necessária.`,
                condicoes_para_go: ['Impugnação aceita', 'Retificação do edital'],
                origens: []
            };
        }

        if (altos.length > 2) {
            return {
                recomendacao: 'NAO_RECOMENDADO',
                justificativa: `${altos.length} riscos altos. Participação não recomendada sem correções.`,
                condicoes_para_go: ['Esclarecimentos favoráveis', 'Análise jurídica detalhada'],
                origens: []
            };
        }

        return {
            recomendacao: 'PARTICIPAR',
            justificativa: 'Riscos dentro do aceitável. Participação viável.',
            condicoes_para_go: ['Preparação adequada de documentos'],
            origens: []
        };
    }
}

export default DecisionCore;
