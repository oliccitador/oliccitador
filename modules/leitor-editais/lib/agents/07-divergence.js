/**
 * ⚠️ AGENTE 7 - DIVERGENCE SCANNER (Quadro de Inconsistências)
 * Conforme DEV DOC 3/8 + DEV DOC 4/8
 * 
 * Responsável por:
 * - Comparar campos críticos entre Edital × TR × Esclarecimentos × Plataforma
 * - Registrar inconsistências SEM ESCOLHER o "correto"
 * - Sugerir ação (esclarecer/impugnar/atenção)
 * - RASTREABILIDADE COMPLETA de cada fonte
 * 
 * ENTRADA: CORPO_INTEGRADO
 * SAÍDA: Envelope padrão + quadro de inconsistências
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_07';

// Campos críticos a comparar (DEV DOC 3/8)
const CriticalFields = {
    PRAZO_ENTREGA: 'prazo_entrega',
    PRAZO_DISPUTA: 'prazo_disputa',
    PRAZO_RECURSOS: 'prazo_recursos',
    PRAZO_PROPOSTAS: 'prazo_propostas',
    ITEM_DESCRICAO: 'item_descricao',
    ITEM_QUANTIDADE: 'item_quantidade',
    ITEM_UNIDADE: 'item_unidade',
    MARCA: 'marca',
    NORMA: 'norma',
    PAGAMENTO: 'pagamento',
    PENALIDADES: 'penalidades',
    GARANTIAS: 'garantias'
};

// Severidade da divergência
const Severity = {
    BAIXA: 'BAIXA',
    MEDIA: 'MEDIA',
    ALTA: 'ALTA'
};

// Ação sugerida
const Action = {
    PEDIDO_ESCLARECIMENTO: 'PEDIDO_DE_ESCLARECIMENTO',
    IMPUGNACAO: 'IMPUGNACAO',
    ATENCAO: 'ATENCAO'
};

class DivergenceScanner {
    constructor() {
        this.criticalPatterns = this.loadCriticalPatterns();
    }

    /**
     * Processa CORPO_INTEGRADO e identifica divergências
     */
    async process(corpoIntegrado) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Escaneando divergências entre documentos');

            if (!corpoIntegrado || !corpoIntegrado.segments) {
                throw new Error('CORPO_INTEGRADO inválido');
            }

            // Identifica documentos por tipo
            const documentsByType = this.groupDocumentsByType(corpoIntegrado);

            // Extrai valores por campo crítico
            const fieldValues = await this.extractFieldValues(corpoIntegrado, documentsByType);

            // Compara e detecta divergências
            const inconsistencias = this.detectDivergences(fieldValues);

            // Gera alerts
            const alerts = this.generateAlerts(inconsistencias);

            // Evidence (todas as fontes comparadas)
            const evidence = this.buildEvidence(fieldValues);

            const runTime = Date.now() - startTime;

            logger.info(AGENT_ID, `${inconsistencias.length} inconsistências detectadas em ${runTime}ms`);

            return {
                agent_id: AGENT_ID,
                status: inconsistencias.length > 0 ? 'ok' : 'ok', // ok mesmo sem divergências
                dados: {
                    inconsistencias,
                    total_comparacoes: Object.keys(fieldValues).length,
                    documentos_analisados: this.countDocuments(documentsByType)
                },
                alerts,
                evidence,
                metadata: {
                    run_ms: runTime,
                    items_found: inconsistencias.length,
                    sections_hit: this.getSectionsHit(corpoIntegrado),
                    confidence: 0.9
                },
                quality_flags: {
                    needs_review: inconsistencias.some(i => i.severidade === Severity.ALTA),
                    low_ocr_quality: false,
                    missing_sections: []
                }
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });

            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: {
                    inconsistencias: [],
                    total_comparacoes: 0,
                    documentos_analisados: {}
                },
                alerts: [{
                    type: 'ERROR',
                    message: error.message,
                    severity: 'HIGH',
                    action_suggested: 'VERIFICAR_CORPUS'
                }],
                evidence: [],
                metadata: {
                    run_ms: Date.now() - startTime,
                    items_found: 0,
                    sections_hit: [],
                    confidence: 0.0
                },
                quality_flags: {
                    needs_review: true,
                    low_ocr_quality: false,
                    missing_sections: []
                }
            };
        }
    }

    /**
     * Agrupa documentos por tipo
     */
    groupDocumentsByType(corpoIntegrado) {
        const grouped = {
            edital: [],
            tr: [],
            esclarecimentos: [],
            plataforma: [],
            minuta: [],
            outros: []
        };

        for (const seg of corpoIntegrado.segments) {
            const type = seg.documentType || 'outros';

            if (type === 'nucleo_certame') {
                grouped.edital.push(seg);
            } else if (type === 'tr') {
                grouped.tr.push(seg);
            } else if (type === 'esclarecimentos_retificacoes') {
                grouped.esclarecimentos.push(seg);
            } else if (type === 'fase_competitiva' || type === 'pos_julgamento_execucao') {
                grouped.plataforma.push(seg);
            } else if (type === 'minuta') {
                grouped.minuta.push(seg);
            } else {
                grouped.outros.push(seg);
            }
        }

        return grouped;
    }

    /**
     * Extrai valores de campos críticos por documento
     */
    async extractFieldValues(corpoIntegrado, documentsByType) {
        const fieldValues = {};

        const lines = corpoIntegrado.globalLines;

        // Patterns para campos críticos
        const patterns = {
            prazo_entrega: /\bprazo\s+de\s+entrega[:\s]+(\d+)\s+(dias?|horas?)/i,
            prazo_pagamento: /\bprazo\s+de\s+pagamento[:\s]+(\d+)\s+dias?/i,
            item_quantidade: /\bquantidade[:\s]+(\d+)/i,
            marca: /\bmarca[:\s]+([\w\s]+)/i,
            norma: /\b(ABNT|NBR|ISO)\s*([\d-]+)/i
        };

        for (const line of lines) {
            const docType = this.getDocTypeFromLine(line, documentsByType);

            for (const [field, pattern] of Object.entries(patterns)) {
                const match = line.text.match(pattern);
                if (match) {
                    if (!fieldValues[field]) {
                        fieldValues[field] = {};
                    }

                    const fonte = this.determineFonte(docType);
                    const valor = match[1] + (match[2] ? ' ' + match[2] : '');

                    if (!fieldValues[field][fonte]) {
                        fieldValues[field][fonte] = {
                            valor,
                            evidence: {
                                documento: line.sourceDocName,
                                doc_type: docType,
                                pagina: line.sourcePage,
                                line_range: [line.globalLine],
                                trecho_literal: line.text.substring(0, 200)
                            }
                        };
                    }
                }
            }
        }

        return fieldValues;
    }

    /**
     * Detecta divergências comparando valores
     */
    detectDivergences(fieldValues) {
        const inconsistencias = [];

        for (const [campo, fontes] of Object.entries(fieldValues)) {
            const fontesList = Object.keys(fontes);

            // Precisa de pelo menos 2 fontes para comparar
            if (fontesList.length < 2) continue;

            // Compara valores
            const valores = Object.values(fontes).map(f => f.valor);
            const valoresUnicos = [...new Set(valores)];

            // Se há mais de 1 valor único, há divergência
            if (valoresUnicos.length > 1) {
                const { severidade, acao_sugerida } = this.classifyDivergence(campo, fontes);

                const inconsistencia = {
                    campo,
                    valores: Object.entries(fontes).map(([fonte, data]) => ({
                        fonte,
                        valor: data.valor,
                        evidence: data.evidence
                    })),
                    acao_sugerida,
                    severidade,
                    origens: Object.values(fontes).map(f => f.evidence)
                };

                inconsistencias.push(inconsistencia);
            }
        }

        return inconsistencias;
    }

    /**
     * Classifica severidade e ação da divergência
     */
    classifyDivergence(campo, fontes) {
        // Campos críticos têm severidade ALTA
        const camposCriticos = ['prazo_entrega', 'prazo_pagamento', 'item_quantidade'];

        if (camposCriticos.includes(campo)) {
            return {
                severidade: Severity.ALTA,
                acao_sugerida: Action.PEDIDO_ESCLARECIMENTO
            };
        }

        // Marca/norma = MEDIA (pode ser impugnação se restritivo)
        if (campo === 'marca' || campo === 'norma') {
            return {
                severidade: Severity.MEDIA,
                acao_sugerida: Action.ATENCAO
            };
        }

        // Outros = BAIXA
        return {
            severidade: Severity.BAIXA,
            acao_sugerida: Action.ATENCAO
        };
    }

    /**
     * Determina fonte baseado no tipo de documento
     */
    determineFonte(docType) {
        const mapping = {
            'nucleo_certame': 'Edital',
            'tr': 'TR',
            'esclarecimentos_retificacoes': 'Esclarecimentos',
            'fase_competitiva': 'Plataforma',
            'pos_julgamento_execucao': 'Plataforma',
            'minuta': 'Minuta'
        };

        return mapping[docType] || 'Outro';
    }

    /**
     * Obtém tipo de documento da linha
     */
    getDocTypeFromLine(line, documentsByType) {
        const docName = line.sourceDocName;

        for (const [type, docs] of Object.entries(documentsByType)) {
            const found = docs.find(d => d.documentName === docName);
            if (found) return found.documentType || 'outros';
        }

        return 'outros';
    }

    /**
     * Constrói evidências
     */
    buildEvidence(fieldValues) {
        const evidence = [];

        for (const [campo, fontes] of Object.entries(fieldValues)) {
            for (const [fonte, data] of Object.entries(fontes)) {
                evidence.push({
                    field: campo,
                    fonte,
                    ...data.evidence,
                    confidence: 0.9,
                    notes: `Valor encontrado em ${fonte}`
                });
            }
        }

        return evidence;
    }

    /**
     * Gera alerts
     */
    generateAlerts(inconsistencias) {
        const alerts = [];

        const alta = inconsistencias.filter(i => i.severidade === Severity.ALTA);
        if (alta.length > 0) {
            alerts.push({
                type: 'WARNING',
                message: `${alta.length} inconsistência(s) de severidade ALTA detectada(s)`,
                severity: 'HIGH',
                action_suggested: 'PEDIDO_DE_ESCLARECIMENTO'
            });
        }

        const media = inconsistencias.filter(i => i.severidade === Severity.MEDIA);
        if (media.length > 0) {
            alerts.push({
                type: 'ATTENTION',
                message: `${media.length} inconsistência(s) de severidade MÉDIA detectada(s)`,
                severity: 'MEDIUM',
                action_suggested: 'REVISAR'
            });
        }

        if (inconsistencias.length === 0) {
            alerts.push({
                type: 'INFO',
                message: 'Nenhuma inconsistência detectada entre documentos',
                severity: 'LOW',
                action_suggested: 'NENHUMA'
            });
        }

        return alerts;
    }

    /**
     * Conta documentos analisados
     */
    countDocuments(documentsByType) {
        const counts = {};
        for (const [type, docs] of Object.entries(documentsByType)) {
            counts[type] = docs.length;
        }
        return counts;
    }

    /**
     * Seções atingidas
     */
    getSectionsHit(corpoIntegrado) {
        return ['DIVERGENCIAS'];
    }

    /**
     * Load patterns (placeholder)
     */
    loadCriticalPatterns() {
        return {};
    }
}

export default DivergenceScanner;
