/**
 * 🎯 ORQUESTRADOR CENTRAL - MASTER LICITATOR (REFATORADO)
 * 
 * Coordena Pipeline + 8 Agentes Especializados.
 * 
 * FLUXO:
 * 1. Pipeline executa (GATE OBRIGATÓRIO) → gera CORPO_INTEGRADO
 * 2. Todos os agentes consomem apenas CORPO_INTEGRADO
 * 3. Processa perguntas do usuário (se houver)
 * 4. Consolida e retorna estrutura padronizada
 * 
 * NUNCA FAZ:
 * - OCR (feito pelo Pipeline)
 * - Leitura documental (feito pelo Pipeline)
 * - Apenas orquestra e valida
 */

import { randomUUID } from 'crypto';
import { getLogger } from '../services/logger.js';
import { validateAgentOutput } from '../services/validation.js';

// Importa Pipeline (OBRIGATÓRIO)
import Pipeline from '../pipeline/index.js';

// Importa agentes (TODOS - ordem de exec: 02,03,04,05,07,06,08,09)
import StructureMapper from '../agents/02-structure.js';
import ItemClassifier from '../agents/03-items.js';
import ComplianceChecker from '../agents/04-compliance.js';
import TechnicalValidator from '../agents/05-technical.js';
import LegalMindEngine from '../agents/06-legal.js';
import DivergenceScanner from '../agents/07-divergence.js';
import DecisionCore from '../agents/08-decision.js';
import ReportSynthesizer from '../agents/09-report.js';

const logger = getLogger();
const ORQUESTRADOR_NOME = 'MasterLicitator';

class MasterLicitator {
    constructor() {
        this.batchId = randomUUID();
        this.startTime = Date.now();
        this.pipeline = new Pipeline();

        // Instancia todos os agentes
        this.structureMapper = new StructureMapper();
        this.itemClassifier = new ItemClassifier();
        this.complianceChecker = new ComplianceChecker();
        this.technicalValidator = new TechnicalValidator();
        this.legalMindEngine = new LegalMindEngine();
        this.divergenceScanner = new DivergenceScanner();
        this.decisionCore = new DecisionCore();
        this.reportSynthesizer = new ReportSynthesizer();

        this.resultados = {};
        this.status = 'initializing';

        logger.info(ORQUESTRADOR_NOME, `🚀 Orquestrador iniciado - Batch: ${this.batchId}`);
    }

    /**
     * FLUXO PRINCIPAL DE EXECUÇÃO (REFATORADO)
     * 
     * @param {Array} files - Arquivos para análise
     * @param {Array} userQuestions - Perguntas do usuário (opcional)
     * @param {Object} userContext - Contexto operacional (opcional)
     * @param {String} cnpj - CNPJ da empresa (opcional)
     * @returns {Object} Estrutura padronizada com batch_id, pipeline_summary, results, warnings, user_answers
     */
    async execute(files, userQuestions = [], userContext = {}, cnpj = null) {
        try {
            this.status = 'running';
            logger.info(ORQUESTRADOR_NOME, '📋 Iniciando execução completa');

            // Validações iniciais
            this.validateInputs(files, cnpj);

            // ========================================
            // GATE OBRIGATÓRIO: PIPELINE
            // ========================================
            logger.info(ORQUESTRADOR_NOME, '🔷 ETAPA 0: Executando Pipeline (GATE OBRIGATÓRIO)');

            const pipelineResult = await this.pipeline.execute(files);

            if (!pipelineResult || !pipelineResult.CORPO_INTEGRADO) {
                throw new Error('Pipeline falhou - CORPO_INTEGRADO não gerado');
            }

            const CORPO_INTEGRADO = pipelineResult.CORPO_INTEGRADO;

            logger.info(
                ORQUESTRADOR_NOME,
                `✅ Pipeline concluído - CORPO_INTEGRADO pronto: ${CORPO_INTEGRADO.globalLines.length} linhas`
            );

            // ========================================
            // EXECUÇÃO DOS AGENTES (todos recebem CORPO_INTEGRADO)
            // ========================================

            // Agente 2: StructureMapper
            const structureResult = await this.executeAgent(
                'StructureMapper',
                'Agente 2 - Extração Estrutural',
                () => this.runStructureMapper(CORPO_INTEGRADO)
            );
            this.resultados.structure = structureResult;

            // Agente 3: Item Classifier
            const cnaeEmpresa = userContext.companyData?.cnae || [];
            const itemsResult = await this.executeAgent(
                'ItemClassifier',
                'Agente 3 - Classificação de Itens',
                () => this.runItemClassifier(CORPO_INTEGRADO, cnaeEmpresa)
            );
            this.resultados.items = itemsResult;

            // Agente 4: Compliance Checker
            const complianceResult = await this.executeAgent(
                'ComplianceChecker',
                'Agente 4 - Análise de Habilitação',
                () => this.runComplianceChecker(CORPO_INTEGRADO)
            );
            this.resultados.compliance = complianceResult;

            // Agente 5: Technical Validator
            const technicalResult = await this.executeAgent(
                'TechnicalValidator',
                'Agente 5 - Validação Técnica',
                () => this.runTechnicalValidator(CORPO_INTEGRADO)
            );
            this.resultados.technical = technicalResult;

            // ORDEM CORRETA: 07 ANTES DE 06 (divergência alimenta minuta)

            // Agente 7: Divergence Scanner
            const divergenceResult = await this.executeAgentSafe(
                'DivergenceScanner',
                'Agente 7 - Detector de Divergências',
                () => this.runDivergenceScanner(CORPO_INTEGRADO)
            );
            this.resultados.divergences = divergenceResult;

            // Agente 6: Legal Mind Engine (usa alerts de 4,5,7)
            const alerts = [
                ...(complianceResult?.alerts || []),
                ...(technicalResult?.alerts || []),
                ...(divergenceResult?.alerts || [])
            ];
            const legalResult = await this.executeAgentSafe(
                'LegalMindEngine',
                'Agente 6 - Análise Jurídica',
                () => this.runLegalMindEngine(CORPO_INTEGRADO, { alerts, userQuestions })
            );
            this.resultados.legal = legalResult;

            // Agente 8: Decision Core
            const agentsOutputs = {
                agent2: structureResult,
                agent3: itemsResult,
                agent4: complianceResult,
                agent5: technicalResult,
                agent6: legalResult,
                agent7: divergenceResult
            };
            const decisionResult = await this.executeAgentSafe(
                'DecisionCore',
                'Agente 8 - Decisão Estratégica',
                () => this.runDecisionCore(agentsOutputs)
            );
            this.resultados.decision = decisionResult;

            // Agente 9: Report Synthesizer (FINAL - consolida tudo)
            const reportResult = await this.executeAgentSafe(
                'ReportSynthesizer',
                'Agente 9 - Geração de Relatórios',
                () => this.runReportSynthesizer(pipelineResult.pipeline_summary, { ...agentsOutputs, agent8: decisionResult })
            );
            this.resultados.report = reportResult;

            // ========================================
            // PROCESSAMENTO DE PERGUNTAS DO USUÁRIO
            // ========================================
            const userAnswers = [];

            if (userQuestions && userQuestions.length > 0) {
                logger.info(ORQUESTRADOR_NOME, `📋 Processando ${userQuestions.length} pergunta(s) do usuário`);

                for (const question of userQuestions) {
                    const answer = await this.processUserQuestion(
                        question,
                        CORPO_INTEGRADO,
                        userContext,
                        this.resultados
                    );

                    userAnswers.push(answer);
                }
            }

            // ========================================
            // CONSOLID AÇÃO FINAL
            // ========================================
            const finalOutput = this.buildFinalOutput(
                pipelineResult,
                userAnswers,
                cnpj
            );

            this.status = 'completed';
            logger.info(ORQUESTRADOR_NOME, '✅ Execução completa com sucesso');

            return finalOutput;

        } catch (error) {
            this.status = 'error';
            logger.critical(
                ORQUESTRADOR_NOME,
                'Erro crítico na execução',
                { error: error.message, stack: error.stack }
            );

            throw error;
        }
    }

    /**
     * Valida inputs iniciais
     */
    validateInputs(files, cnpj) {
        logger.info(ORQUESTRADOR_NOME, 'Validando inputs');

        if (!files || files.length === 0) {
            throw new Error('VALIDAÇÃO FALHOU: Nenhum arquivo fornecido');
        }

        const maxFiles = parseInt(process.env.MAX_FILES_PER_UPLOAD || '10');
        if (files.length > maxFiles) {
            throw new Error(`VALIDAÇÃO FALHOU: Máximo de ${maxFiles} arquivos permitidos`);
        }

        if (cnpj) {
            logger.info(ORQUESTRADOR_NOME, `CNPJ: ${cnpj}`);
        }

        logger.info(ORQUESTRADOR_NOME, `Inputs validados: ${files.length} arquivo(s)`);
    }

    /**
     * Executa um agente com tratamento de erros e logging
     */
    async executeAgent(agentName, description, executionFn) {
        const startTime = Date.now();

        logger.startAgent(agentName);
        logger.info(ORQUESTRADOR_NOME, `▶️ ${description}`);

        try {
            const result = await executionFn();

            // Injeta timestamp se ausente (wrapper injeta)
            if (!result.timestamp) {
                result.timestamp = new Date().toISOString();
            }

            // Valida output do agente
            if (!validateAgentOutput(result, agentName)) {
                throw new Error(`Output inválido do agente ${agentName}`);
            }

            const duration = Date.now() - startTime;
            logger.endAgent(agentName, result.status, duration);

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            logger.error(
                agentName,
                `Erro na execução: ${error.message}`,
                { error: error.message, stack: error.stack }
            );

            logger.endAgent(agentName, 'erro', duration);

            // Retorna output de erro padronizado
            return {
                agente: agentName,
                status: 'erro',
                timestamp: new Date().toISOString(),
                dados: null,
                erro: error.message,
                origem: {
                    documento: 'SISTEMA',
                    pagina: 0,
                    trecho: 'Erro de execução',
                },
            };
        }
    }

    /**
     * Executa agente com tolerância a falhas (para agentes 6-9)
     * Retorna partial se falhar, mas não quebra o lote
     */
    async executeAgentSafe(agentName, description, agentFunction) {
        try {
            return await this.executeAgent(agentName, description, agentFunction);
        } catch (error) {
            logger.error(
                agentName,
                `Erro não-crítico (tolerado): ${error.message}`,
                { error: error.message }
            );

            // Retorna partial ao invés de quebrar
            return {
                agent_id: agentName,
                status: 'partial',
                dados: {},
                alerts: [{
                    type: 'ERROR',
                    message: `Agente ${agentName} falhou: ${error.message}`,
                    severity: 'MEDIUM'
                }],
                evidence: [],
                metadata: { run_ms: 0, items_found: 0, confidence: 0 },
                quality_flags: { needs_review: true }
            };
        }
    }

    /**
     * MÉTODOS DOS AGENTES (Placeholders - receberão CORPO_INTEGRADO)
     */

    async runStructureMapper(corpoIntegrado) {
        return await this.structureMapper.process(corpoIntegrado);
    }

    async runItemClassifier(corpoIntegrado, cnaeEmpresa) {
        const companyProfile = cnaeEmpresa ? { cnaes: Array.isArray(cnaeEmpresa) ? cnaeEmpresa : [cnaeEmpresa] } : null;
        return await this.itemClassifier.process(corpoIntegrado, companyProfile);
    }

    async runComplianceChecker(corpoIntegrado) {
        return await this.complianceChecker.process(corpoIntegrado);
    }

    async runTechnicalValidator(corpoIntegrado) {
        return await this.technicalValidator.process(corpoIntegrado);
    }

    async runLegalMindEngine(corpoIntegrado, params) {
        return await this.legalMindEngine.process(corpoIntegrado, params);
    }

    async runDivergenceScanner(corpoIntegrado) {
        return await this.divergenceScanner.process(corpoIntegrado);
    }

    async runDecisionCore(agentsOutputs) {
        return await this.decisionCore.process(agentsOutputs);
    }

    async runReportSynthesizer(pipelineSummary, agentsOutputs) {
        return await this.reportSynthesizer.process(pipelineSummary, agentsOutputs);
    }

    /**
     * Processa pergunta do usuário e roteia para agente apropriado
     */
    async processUserQuestion(question, corpoIntegrado, userContext, agentResults) {
        logger.info(ORQUESTRADOR_NOME, `Processando pergunta: "${question.question}"`);

        // Detecta categoria se não fornecida
        const category = question.category || this.detectQuestionCategory(question.question);

        let answer = {
            questionId: question.id,
            question: question.question,
            answer: 'SEM DADOS NO ARQUIVO',
            found: false,
            citations: [],
            clarificationDraft: {
                available: false
            },
            respondedBy: 'Unknown',
            confidence: 0,
            timestamp: new Date().toISOString(),
            processingTimeMs: 0
        };

        try {
            // Roteia para agente apropriado
            switch (category) {
                case 'juridico':
                    if (agentResults.legal && agentResults.legal.status !== 'erro') {
                        // TODO: Implementar askLegalMindEngine
                        answer.respondedBy = 'LegalMindEngine';
                    }
                    break;

                case 'item':
                case 'itens':
                    if (agentResults.items && agentResults.items.status !== 'erro') {
                        // TODO: Implementar askItemClassifier
                        answer.respondedBy = 'ItemClassifier';
                    }
                    break;

                case 'tecnico':
                case 'capacidade-tecnica':
                    if (agentResults.technical && agentResults.technical.status !== 'erro') {
                        // TODO: Implementar askTechnicalValidator
                        answer.respondedBy = 'TechnicalValidator';
                    }
                    break;

                default:
                    // Busca genérica no CORPO_INTEGRADO
                    answer.respondedBy = 'GenericSearch';
            }

        } catch (error) {
            logger.error(ORQUESTRADOR_NOME, 'Erro ao processar pergunta', { error: error.message });
        }

        return answer;
    }

    /**
     * Detecta categoria de uma pergunta
     */
    detectQuestionCategory(questionText) {
        const lower = questionText.toLowerCase();

        if (/juridic|legal|ilegal|impugna|recurs/.test(lower)) return 'juridico';
        if (/item|lote|produto/.test(lower)) return 'item';
        if (/atestado|tecnic|capacidade/.test(lower)) return 'tecnico';
        if (/prazo|entrega|data/.test(lower)) return 'prazos-entrega';
        if (/pagamento|valor|preço/.test(lower)) return 'pagamento';
        if (/habilita|document|certid/.test(lower)) return 'habilitacao';

        return 'outros';
    }

    /**
     * Constrói output final padronizado
     */
    buildFinalOutput(pipelineResult, userAnswers, cnpj) {
        const tempoTotal = (Date.now() - this.startTime) / 1000;

        logger.info(ORQUESTRADOR_NOME, '🔄 Consolidando output final');

        return {
            // STATUS (top-level obrigatório - DEV DOC 3/8)
            status: this.status,

            // Identificação
            batch_id: this.batchId,
            timestamp: new Date().toISOString(),
            total_duration_seconds: tempoTotal,

            // CNPJ (se fornecido)
            cnpj: cnpj || null,

            // Pipeline Summary
            pipeline_summary: {
                status: pipelineResult.status,
                pipeline_id: pipelineResult.pipelineId,
                lote_id: pipelineResult.loteId,
                duration_seconds: (pipelineResult.durationMs / 1000).toFixed(2),
                documents_processed: pipelineResult.pipelineMetadata.documentsProcessed,
                documents_total: pipelineResult.pipelineMetadata.totalDocuments,
                duplicates_removed: pipelineResult.pipelineMetadata.duplicatesRemoved,
                ocr_quality_avg: pipelineResult.CORPO_INTEGRADO.metadata.ocrQualityGlobal,
                total_lines: pipelineResult.CORPO_INTEGRADO.globalLines.length,
                total_pages: pipelineResult.CORPO_INTEGRADO.metadata.totalPages,
            },

            // Pipeline Warnings
            pipeline_warnings: pipelineResult.validation.warnings || [],

            // Pré-Análise (do Pipeline)
            pre_analise: {
                metadados: pipelineResult.preAnalise.metadados,
                itens_detectados: pipelineResult.preAnalise.itens.length,
                secoes_importantes: pipelineResult.preAnalise.secoesImportantes.length,
            },

            // Results por Agente (compatibilidade)
            results: {
                structure: this.resultados.structure || null,
                items: this.resultados.items || null,
                compliance: this.resultados.compliance || null,
                technical: this.resultados.technical || null,
                legal: this.resultados.legal || null,
                divergences: this.resultados.divergences || null,
                decision: this.resultados.decision || null,
                report: this.resultados.report || null,
            },

            // AGENTS (formato DEV DOC 3/8 - OBRIGATÓRIO)
            agents: {
                AGENT_02: this.resultados.structure || null,
                AGENT_03: this.resultados.items || null,
                AGENT_04: this.resultados.compliance || null,
                AGENT_05: this.resultados.technical || null,
                AGENT_06: this.resultados.legal || null,
                AGENT_07: this.resultados.divergences || null,
                AGENT_08: this.resultados.decision || null,
                AGENT_09: this.resultados.report || null,
            },

            // User Answers (se houver perguntas)
            user_answers: userAnswers,

            // Metadados gerais
            metadata: {
                total_items: this.resultados.items?.dados?.itens?.length || 0,
                total_divergences: this.resultados.divergences?.dados?.inconsistencias?.length || 0,
                total_minutas: this.resultados.legal?.dados?.minutas?.length || 0,
                go_no_go: this.resultados.decision?.dados?.go_no_go?.recomendacao || 'PENDENTE',
                total_execution_time_ms: Date.now() - this.startTime,
            },

            // Caixa Preta (timeline + warnings + errors - DEV DOC 3/8)
            black_box: this.resultados.report?.dados?.black_box || {
                logs: logger.getLogs(),
                stats: logger.getStats(),
                errors: logger.getErrors(),
                timeline: logger.getLogs().map(log => ({
                    timestamp: log.timestamp,
                    agent: log.agente,
                    level: log.nivel,
                    message: log.mensagem,
                })),
            },

            // CORPO_INTEGRADO (OBRIGATÓRIO - DEV DOC 3/8)
            corpo_integrado: pipelineResult.CORPO_INTEGRADO,

            // _corpus (compatibilidade)
            _corpus: pipelineResult.CORPO_INTEGRADO,
        };
    }
}

export default MasterLicitator;
