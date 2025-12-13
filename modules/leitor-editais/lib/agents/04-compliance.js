/**
 * ⚖️ AGENTE 4 - COMPLIANCE CHECKER (Habilitação)
 * Conforme DEV DOC 3/8 + DEV DOC 4/8
 * 
 * Responsável por:
 * - Extrair TODAS as exigências de habilitação
 * - Classificar por categoria (fiscal/trabalhista/cadastro/econômico/declarações)
 * - Detectar exigências excessivas/restritivas
 * - Validar tratamento ME/EPP
 * - RASTREABILIDADE COMPLETA + ANTI-ALUCINAÇÃO
 * 
 * ENTRADA: CORPO_INTEGRADO
 * SAÍDA: Envelope padrão + checklist + alerts + evidências
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_04';

// Estados de campo (DEV DOC 4/8)
const FieldState = {
    FOUND: 'FOUND',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    LOW_CONFIDENCE: 'LOW_CONFIDENCE',
    UNREADABLE: 'UNREADABLE'
};

class ComplianceChecker {
    constructor() {
        this.categories = this.loadCategories();
        this.excessivePatterns = this.loadExcessivePatterns();
    }

    /**
     * Processa CORPO_INTEGRADO e extrai requisitos de habilitação
     */
    async process(corpoIntegrado) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Extraindo requisitos de habilitação');

            if (!corpoIntegrado || !corpoIntegrado.textoCompleto) {
                throw new Error('CORPO_INTEGRADO inválido');
            }

            // Extrai requisitos por categoria
            const { requisitos, evidence, conflicts } = await this.extractRequirements(corpoIntegrado);

            // Monta checklist estruturado
            const checklist = this.buildChecklist(requisitos);

            // Extrai observações ME/EPP
            const me_epp = await this.extractMeEppObservations(corpoIntegrado, evidence);

            // Gera alerts
            const alerts = this.generateAlerts(requisitos, conflicts);

            // Quality flags
            const quality_flags = this.buildQualityFlags(requisitos, corpoIntegrado);

            const runTime = Date.now() - startTime;

            logger.info(AGENT_ID, `${requisitos.length} requisitos extraídos em ${runTime}ms`);

            return {
                agent_id: AGENT_ID,
                status: requisitos.length > 0 ? 'ok' : 'partial',
                dados: {
                    requisitos,
                    checklist,
                    me_epp_observacoes: me_epp.observacoes,
                    conflitos: conflicts
                },
                alerts,
                evidence,
                metadata: {
                    run_ms: runTime,
                    items_found: requisitos.length,
                    sections_hit: this.getSectionsHit(corpoIntegrado),
                    confidence: this.calculateConfidence(requisitos)
                },
                quality_flags
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });

            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: {
                    requisitos: [],
                    checklist: this.buildEmptyChecklist(),
                    me_epp_observacoes: "SEM DADOS NO ARQUIVO",
                    conflitos: []
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
                    missing_sections: ['HABILITACAO']
                }
            };
        }
    }

    /**
     * Extrai requisitos de habilitação do CORPO_INTEGRADO
     */
    async extractRequirements(corpoIntegrado) {
        const requisitos = [];
        const evidence = [];
        const conflicts = [];

        const lines = corpoIntegrado.globalLines;

        // Patterns por categoria
        const patterns = {
            FISCAL: [
                { re: /\b(regularidade|certid[aã]o).*?(fazenda|fiscal|tribut[aá]ria)\b/i, desc: 'Regularidade Fiscal' },
                { re: /\b(rfb|pgfn|receita federal)\b/i, desc: 'RFB/PGFN' },
                { re: /\bfazenda\s+(estadual|municipal)\b/i, desc: 'Fazenda Estadual/Municipal' }
            ],
            TRABALHISTA: [
                { re: /\bfgts\b/i, desc: 'FGTS' },
                { re: /\b(cndt|certid[aã]o.*?d[eé]bitos.*?trabalhistas)\b/i, desc: 'CNDT' },
                { re: /\bjusti[cç]a do trabalho\b/i, desc: 'Justiça do Trabalho' }
            ],
            CADASTRO: [
                { re: /\bsicaf\b/i, desc: 'SICAF' },
                { re: /\b(crc|cadastro.*?registro.*?cadastral)\b/i, desc: 'CRC' }
            ],
            ECONOMICO_FINANCEIRO: [
                { re: /\bbalan[cç]o\s+patrimonial\b/i, desc: 'Balanço Patrimonial' },
                { re: /\b[ií]ndices?\s+(financeiros?|econ[oô]micos?)\b/i, desc: 'Índices Financeiros' },
                { re: /\bcapital\s+m[ií]nimo\b/i, desc: 'Capital Mínimo' },
                { re: /\bpatrim[oô]nio\s+l[ií]quido\b/i, desc: 'Patrimônio Líquido' },
                { re: /\bgarantia\b.*?\b(proposta|contratual)\b/i, desc: 'Garantia' }
            ],
            DECLARACOES: [
                { re: /\bart\.?\s*7[º°]?\s*xxxiii\b/i, desc: 'Declaração Art. 7º XXXIII' },
                { re: /\bfato\s+impeditivo\b/i, desc: 'Declaração Fato Impeditivo' },
                { re: /\belabora[cç][aã]o\s+independente\b/i, desc: 'Elaboração Independente' },
                { re: /\banticorrup[cç][aã]o\b/i, desc: 'Declaração Anticorrupção' }
            ]
        };

        // Busca em globalLines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const text = line.text;

            for (const [categoria, catPatterns] of Object.entries(patterns)) {
                for (const { re, desc } of catPatterns) {
                    if (re.test(text)) {
                        // Contexto (3 linhas)
                        const contextLines = lines.slice(i, Math.min(i + 3, lines.length));
                        const fullContext = contextLines.map(l => l.text).join(' ');

                        // Detecta excessividade
                        const isExcessive = this.detectExcessiveRequirement(fullContext);
                        const detectedState = FieldState.FOUND;

                        // Extrai prazo se houver
                        const prazo = this.extractPrazo(fullContext) || "SEM DADOS NO ARQUIVO";

                        const requisito = {
                            categoria,
                            descricao: desc,
                            trecho_literal: fullContext.substring(0, 300),
                            prazo,
                            exigencia_excessiva: isExcessive,
                            justificativa_alerta: isExcessive ? "Possível exigência desproporcional" : "SEM DADOS NO ARQUIVO",
                            state: detectedState,
                            origens: []
                        };

                        // Evidência
                        const evidenceItem = {
                            field: `habilitacao_${categoria.toLowerCase()}_${requisitos.length}`,
                            documento: line.sourceDocName,
                            doc_id: line.docId || 'unknown',
                            doc_type: this.detectDocType(corpoIntegrado, line.sourceDocName),
                            pagina: line.sourcePage,
                            line_range: contextLines.map(l => l.globalLine),
                            char_range: [contextLines[0].charStart, contextLines[contextLines.length - 1].charEnd],
                            segment_hash: line.segmentHash || 'unknown',
                            trecho_literal: fullContext.substring(0, 200),
                            confidence: 0.85,
                            notes: `Requisito de ${categoria}: ${desc}`
                        };

                        requisito.origens.push(evidenceItem);
                        evidence.push(evidenceItem);
                        requisitos.push(requisito);

                        break; // Evita duplicatas na mesma linha
                    }
                }
            }
        }

        // Se não encontrou nada crítico
        if (requisitos.length === 0) {
            logger.warn(AGENT_ID, 'Nenhum requisito de habilitação detectado');
        }

        return { requisitos, evidence, conflicts };
    }

    /**
     * Detecta exigências excessivas
     */
    detectExcessiveRequirement(text) {
        const excessivePatterns = [
            /\b[ií]ndice.*?(\d+[,.]?\d*)\s*%/i, // Índices com valores
            /\bcapital.*?m[ií]nimo.*?r?\$?\s*[\d.,]+\s*(mil|milh[oõ]es)?/i,
            /\bpatrim[oô]nio.*?l[ií]quido.*?r?\$?\s*[\d.,]+/i,
            /\bbalanço.*?(\d+)\s*(anos?|exerc[ií]cios?)/i
        ];

        return excessivePatterns.some(p => p.test(text));
    }

    /**
     * Extrai prazo
     */
    extractPrazo(text) {
        const patterns = [
            /prazo.*?(\d+)\s*(dias?|horas?)/i,
            /at[eé].*?(\d+\s*(?:h|hs|horas?))/i
        ];

        for (const p of patterns) {
            const m = text.match(p);
            if (m) return m[0];
        }
        return null;
    }

    /**
     * Extrai observações ME/EPP
     */
    async extractMeEppObservations(corpoIntegrado, evidence) {
        const meEppPatterns = [
            /\b(micro|pequena)\s*empresa\b/i,
            /\b(me|epp)\b/i,
            /\blc\s*123\b/i,
            /\btratamento\s+(diferenciado|favorecido)\b/i
        ];

        const lines = corpoIntegrado.globalLines;
        const observations = [];

        for (const line of lines) {
            for (const pattern of meEppPatterns) {
                if (pattern.test(line.text)) {
                    observations.push(line.text.substring(0, 200));
                    break;
                }
            }
        }

        if (observations.length === 0) {
            return { observacoes: "SEM DADOS NO ARQUIVO", state: FieldState.NOT_FOUND };
        }

        return {
            observacoes: observations.join(' | '),
            state: FieldState.FOUND
        };
    }

    /**
     * Monta checklist estruturado
     */
    buildChecklist(requisitos) {
        const checklist = {
            fiscal: [],
            trabalhista: [],
            cadastro: [],
            economico_financeiro: [],
            declaracoes: []
        };

        for (const req of requisitos) {
            const key = req.categoria.toLowerCase();
            if (checklist[key]) {
                checklist[key].push(req.descricao);
            }
        }

        // Preenche com "SEM DADOS NO ARQUIVO" se vazio
        for (const [key, value] of Object.entries(checklist)) {
            if (value.length === 0) {
                checklist[key] = ["SEM DADOS NO ARQUIVO"];
            }
        }

        return checklist;
    }

    /**
     * Checklist vazio
     */
    buildEmptyChecklist() {
        return {
            fiscal: ["SEM DADOS NO ARQUIVO"],
            trabalhista: ["SEM DADOS NO ARQUIVO"],
            cadastro: ["SEM DADOS NO ARQUIVO"],
            economico_financeiro: ["SEM DADOS NO ARQUIVO"],
            declaracoes: ["SEM DADOS NO ARQUIVO"]
        };
    }

    /**
     * Gera alerts
     */
    generateAlerts(requisitos, conflicts) {
        const alerts = [];

        // Exigências excessivas
        const excessive = requisitos.filter(r => r.exigencia_excessiva);
        if (excessive.length > 0) {
            alerts.push({
                type: 'WARNING',
                message: `${excessive.length} requisito(s) potencialmente excessivo(s) detectado(s)`,
                severity: 'MEDIUM',
                action_suggested: 'IMPUGNACAO'
            });
        }

        // Nenhum requisito
        if (requisitos.length === 0) {
            alerts.push({
                type: 'WARNING',
                message: 'Nenhum requisito de habilitação detectado',
                severity: 'HIGH',
                action_suggested: 'VERIFICAR_DOCUMENTO'
            });
        }

        // Conflitos
        if (conflicts.length > 0) {
            alerts.push({
                type: 'CONFLICT',
                message: `${conflicts.length} conflito(s) detectado(s) entre documentos`,
                severity: 'HIGH',
                action_suggested: 'PEDIDO_DE_ESCLARECIMENTO'
            });
        }

        return alerts;
    }

    /**
     * Quality flags
     */
    buildQualityFlags(requisitos, corpoIntegrado) {
        const missing = [];

        const categories = ['fiscal', 'trabalhista', 'cadastro', 'economico_financeiro', 'declaracoes'];
        for (const cat of categories) {
            const found = requisitos.some(r => r.categoria.toLowerCase() === cat.toLowerCase());
            if (!found) {
                missing.push(cat.toUpperCase());
            }
        }

        return {
            needs_review: requisitos.some(r => r.exigencia_excessiva),
            low_ocr_quality: corpoIntegrado.pipeline_summary?.ocr_avg_score < 0.5,
            missing_sections: missing
        };
    }

    /**
     * Calcula confidence
     */
    calculateConfidence(requisitos) {
        if (requisitos.length === 0) return 0.0;
        if (requisitos.length >= 5) return 0.9;
        return 0.6;
    }

    /**
     * Detecta tipo do documento
     */
    detectDocType(corpoIntegrado, docName) {
        const seg = corpoIntegrado.segments.find(s => s.documentName === docName);
        return seg?.documentType || 'unknown';
    }

    /**
     * Seções atingidas
     */
    getSectionsHit(corpoIntegrado) {
        // Simplificado: procura por "habilitação" nos segments
        const sections = [];
        for (const seg of corpoIntegrado.segments) {
            if (seg.structures) {
                const hasHabilitation = seg.structures.sections?.some(s =>
                    /habilita[cç][aã]o/i.test(s.title || '')
                );
                if (hasHabilitation) sections.push('HABILITACAO');
            }
        }
        return [...new Set(sections)];
    }

    /**
     * Load categories (placeholder)
     */
    loadCategories() {
        return {};
    }

    /**
     * Load excessive patterns (placeholder)
     */
    loadExcessivePatterns() {
        return [];
    }
}

export default ComplianceChecker;
