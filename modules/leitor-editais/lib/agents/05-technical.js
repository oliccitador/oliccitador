/**
 * 🔬 AGENTE 5 - TECHNICAL VALIDATOR (Capacidade Técnica)
 * Conforme DEV DOC 3/8 + DEV DOC 4/8
 * 
 * Responsável por:
 * - Extrair requisitos de capacidade técnica do CORPO_INTEGRADO
 * - Detectar: atestados, normas ABNT/NBR/ISO, amostras, ensaios, visita técnica
 * - Identificar certificados, laudos, conselhos profissionais
 * - Sinalizar nivel_risco + gatilho_impugnacao (SOMENTE com evidência)
 * - RASTREABILIDADE COMPLETA + ANTI-ALUCINAÇÃO
 * 
 * ENTRADA: CORPO_INTEGRADO
 * SAÍDA: Envelope padrão + requisitos_tecnicos + resumo + evidências
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_05';

// Estados de campo (DEV DOC 4/8)
const FieldState = {
    FOUND: 'FOUND',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    LOW_CONFIDENCE: 'LOW_CONFIDENCE',
    UNREADABLE: 'UNREADABLE'
};

// Níveis de risco
const RiskLevel = {
    BAIXO: 'BAIXO',
    MEDIO: 'MEDIO',
    ALTO: 'ALTO'
};

// Tipos de requisito técnico
const TechType = {
    ATESTADO: 'ATESTADO',
    NORMA: 'NORMA',
    CERTIFICACAO: 'CERTIFICACAO',
    VISITA_TECNICA: 'VISITA_TECNICA',
    AMOSTRA: 'AMOSTRA',
    ENSAIO: 'ENSAIO',
    CONSELHO: 'CONSELHO',
    OUTROS: 'OUTROS'
};

class TechnicalValidator {
    constructor() {
        this.patterns = this.loadPatterns();
    }

    /**
     * Processa CORPO_INTEGRADO e extrai requisitos técnicos
     */
    async process(corpoIntegrado) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Extraindo requisitos técnicos');

            if (!corpoIntegrado || !corpoIntegrado.textoCompleto) {
                throw new Error('CORPO_INTEGRADO inválido');
            }

            // Extrai requisitos
            const { requisitos, evidence, conflicts } = await this.extractRequirements(corpoIntegrado);

            // Monta resumo
            const resumo = this.buildSummary(requisitos);

            // Gera alerts
            const alerts = this.generateAlerts(requisitos, conflicts);

            // Quality flags
            const quality_flags = this.buildQualityFlags(requisitos, corpoIntegrado);

            const runTime = Date.now() - startTime;

            logger.info(AGENT_ID, `${requisitos.length} requisitos técnicos extraídos em ${runTime}ms`);

            return {
                agent_id: AGENT_ID,
                status: requisitos.length > 0 ? 'ok' : 'partial',
                dados: {
                    requisitos_tecnicos: requisitos,
                    resumo,
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
                    requisitos_tecnicos: [],
                    resumo: this.buildEmptySummary(),
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
                    missing_sections: ['CAPACIDADE_TECNICA']
                }
            };
        }
    }

    /**
     * Extrai requisitos técnicos
     */
    async extractRequirements(corpoIntegrado) {
        const requisitos = [];
        const evidence = [];
        const conflicts = [];

        const lines = corpoIntegrado.globalLines;

        // Patterns por tipo
        const patterns = {
            ATESTADO: [
                { re: /\batestado(s)?\s+(de\s+)?capacidade\s+t[eé]cnica\b/i, desc: 'Atestado de Capacidade Técnica' },
                { re: /\batestado(s)?\s+.*\bexecu[cç][aã]o\b/i, desc: 'Atestado de Execução' },
                { re: /\b(compatível|similar).*\bobjeto\b/i, desc: 'Similaridade com objeto' },
                { re: /\bquantitativo.*?(\d+)\s*%/i, desc: 'Quantitativo percentual' },
                { re: /\bparcela.*?(\d+)\s*%/i, desc: 'Parcela de execução' }
            ],
            NORMA: [
                { re: /\b(ABNT|NBR|ISO|IEC|ASTM|DIN)\s*[\d-]+/i, desc: 'Norma técnica' },
                { re: /\bnorma(s)?\s+t[eé]cnica(s)?\b/i, desc: 'Norma técnica genérica' },
                { re: /\bcertifica[cç][aã]o\b.*\b(ISO|ABNT|NBR)\b/i, desc: 'Certificação de norma' }
            ],
            CERTIFICACAO: [
                { re: /\bcertificado(s)?\b/i, desc: 'Certificado' },
                { re: /\blaudo(s)?\b/i, desc: 'Laudo técnico' },
                { re: /\bregistro.*\b(ANVISA|INMETRO|ANATEL)\b/i, desc: 'Registro em órgão regulador' }
            ],
            VISITA_TECNICA: [
                { re: /\bvisita\s+t[eé]cnica\b/i, desc: 'Visita técnica' },
                { re: /\bvistoria\b/i, desc: 'Vistoria' },
                { re: /\binspe[cç][aã]o\s+pr[eé]via\b/i, desc: 'Inspeção prévia' }
            ],
            AMOSTRA: [
                { re: /\bamostra(s)?\b/i, desc: 'Amostra' },
                { re: /\bprot[oó]tipo(s)?\b/i, desc: 'Protótipo' }
            ],
            ENSAIO: [
                { re: /\bensaio(s)?\b/i, desc: 'Ensaio' },
                { re: /\bteste(s)?\s+t[eé]cnico(s)?\b/i, desc: 'Teste técnico' }
            ],
            CONSELHO: [
                { re: /\b(CREA|CRQ|CRM|COREN|CRC|CAU)\b/i, desc: 'Conselho profissional' },
                { re: /\bresponsável\s+t[eé]cnico\b/i, desc: 'Responsável técnico' },
                { re: /\bart\b.*\b(pessoa\s+f[ií]sica|profissional)\b/i, desc: 'Profissional específico' }
            ]
        };

        // Busca em globalLines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const text = line.text;

            for (const [tipo, typePatterns] of Object.entries(patterns)) {
                for (const { re, desc } of typePatterns) {
                    if (re.test(text)) {
                        // Contexto
                        const contextLines = lines.slice(i, Math.min(i + 3, lines.length));
                        const fullContext = contextLines.map(l => l.text).join(' ');

                        // Analisa risco e gatilho
                        const { nivel_risco, gatilho_impugnacao, justificativa } = this.analyzeRisk(
                            tipo,
                            fullContext,
                            text
                        );

                        const requisito = {
                            tipo,
                            criterio: desc,
                            trecho_literal: fullContext.substring(0, 300),
                            nivel_risco,
                            gatilho_impugnacao,
                            justificativa_gatilho: justificativa,
                            state: FieldState.FOUND,
                            origens: []
                        };

                        // Evidência
                        const evidenceItem = {
                            field: `tecnico_${tipo.toLowerCase()}_${requisitos.length}`,
                            documento: line.sourceDocName,
                            doc_id: line.docId || 'unknown',
                            doc_type: this.detectDocType(corpoIntegrado, line.sourceDocName),
                            pagina: line.sourcePage,
                            line_range: contextLines.map(l => l.globalLine),
                            char_range: [contextLines[0].charStart, contextLines[contextLines.length - 1].charEnd],
                            segment_hash: line.segmentHash || 'unknown',
                            trecho_literal: fullContext.substring(0, 200),
                            confidence: 0.85,
                            notes: `Requisito técnico: ${desc}`
                        };

                        requisito.origens.push(evidenceItem);
                        evidence.push(evidenceItem);
                        requisitos.push(requisito);

                        break;
                    }
                }
            }
        }

        return { requisitos, evidence, conflicts };
    }

    /**
     * Analisa risco e gatilho de impugnação (SOMENTE com evidência)
     */
    analyzeRisk(tipo, context, text) {
        let nivel_risco = RiskLevel.BAIXO;
        let gatilho_impugnacao = false;
        let justificativa = "SEM DADOS NO ARQUIVO";

        const normalized = context.toLowerCase();

        // Gatilhos SOMENTE com evidência textual literal
        const gatilhos = {
            marca_exclusiva: /\bmarca\b.*\b(exclusiva|[uú]nica|obrigat[oó]ria)\b/i,
            vedacao_equivalencia: /\bveda[çc][aã]o\b.*\bequival[eê]ncia\b/i,
            quantitativo_alto: /\bparcela.*?(\d+)\s*%/i, // Apenas se > 50%
            atestado_desproporcional: /\batestado.*?(\d+)\s*%.*?\bvalor\b/i, // > 30%
            conselho_sem_base: /\b(CREA|CRQ|CRM)\b.*\b(obrigat[oó]rio|exigido)\b/i,
            visita_sem_justificativa: /\bvisita.*\bobrigat[oó]ria\b/i
        };

        // Marca exclusiva / vedação equivalência
        if (gatilhos.marca_exclusiva.test(text) || gatilhos.vedacao_equivalencia.test(text)) {
            nivel_risco = RiskLevel.ALTO;
            gatilho_impugnacao = true;
            justificativa = "Possível restrição à competitividade - marca exclusiva/vedação de equivalência (evidência literal encontrada)";
        }

        // Quantitativo alto em atestado
        const matchQuantitativo = text.match(gatilhos.quantitativo_alto);
        if (matchQuantitativo) {
            const percentual = parseInt(matchQuantitativo[1]);
            if (percentual > 50) {
                nivel_risco = RiskLevel.ALTO;
                gatilho_impugnacao = true;
                justificativa = `Atestado exige ${percentual}% de parcela - possível restrição (evidência literal: "${matchQuantitativo[0]}")`;
            } else if (percentual > 30) {
                nivel_risco = RiskLevel.MEDIO;
                justificativa = `Atestado exige ${percentual}% de parcela - atenção`;
            }
        }

        // Atestado desproporcional
        const matchAtestado = text.match(gatilhos.atestado_desproporcional);
        if (matchAtestado) {
            const percentual = parseInt(matchAtestado[1]);
            if (percentual > 30) {
                nivel_risco = RiskLevel.ALTO;
                gatilho_impugnacao = true;
                justificativa = `Atestado vinculado a ${percentual}% do valor - possível desproporcionalidade (evidência literal encontrada)`;
            }
        }

        // Conselho profissional sem base
        if (gatilhos.conselho_sem_base.test(text) && tipo === TechType.CONSELHO) {
            nivel_risco = RiskLevel.MEDIO;
            justificativa = "Exigência de conselho profissional - verificar pertinência ao objeto";
        }

        // Visita técnica obrigatória
        if (gatilhos.visita_sem_justificativa.test(text)) {
            nivel_risco = RiskLevel.MEDIO;
            justificativa = "Visita técnica obrigatória - verificar se justificada";
        }

        // Norma técnica é geralmente risco baixo (legítimo)
        if (tipo === TechType.NORMA && nivel_risco === RiskLevel.BAIXO) {
            justificativa = "Norma técnica identificada - risco baixo";
        }

        return { nivel_risco, gatilho_impugnacao, justificativa };
    }

    /**
     * Monta resumo
     */
    buildSummary(requisitos) {
        return {
            exige_atestado: requisitos.some(r => r.tipo === TechType.ATESTADO),
            exige_normas: requisitos.some(r => r.tipo === TechType.NORMA),
            exige_visita: requisitos.some(r => r.tipo === TechType.VISITA_TECNICA),
            exige_amostra: requisitos.some(r => r.tipo === TechType.AMOSTRA),
            total_requisitos: requisitos.length,
            gatilhos_impugnacao: requisitos.filter(r => r.gatilho_impugnacao).length,
            risco_alto: requisitos.filter(r => r.nivel_risco === RiskLevel.ALTO).length
        };
    }

    /**
     * Resumo vazio
     */
    buildEmptySummary() {
        return {
            exige_atestado: false,
            exige_normas: false,
            exige_visita: false,
            exige_amostra: false,
            total_requisitos: 0,
            gatilhos_impugnacao: 0,
            risco_alto: 0
        };
    }

    /**
     * Gera alerts
     */
    generateAlerts(requisitos, conflicts) {
        const alerts = [];

        // Gatilhos de impugnação
        const gatilhos = requisitos.filter(r => r.gatilho_impugnacao);
        if (gatilhos.length > 0) {
            alerts.push({
                type: 'WARNING',
                message: `${gatilhos.length} gatilho(s) de impugnação detectado(s) com evidência`,
                severity: 'HIGH',
                action_suggested: 'IMPUGNACAO'
            });
        }

        // Risco alto sem gatilho
        const riscoAlto = requisitos.filter(r => r.nivel_risco === RiskLevel.ALTO && !r.gatilho_impugnacao);
        if (riscoAlto.length > 0) {
            alerts.push({
                type: 'ATTENTION',
                message: `${riscoAlto.length} requisito(s) de risco alto - revisar`,
                severity: 'MEDIUM',
                action_suggested: 'REVISAR'
            });
        }

        // Nenhum requisito
        if (requisitos.length === 0) {
            alerts.push({
                type: 'INFO',
                message: 'Nenhum requisito técnico detectado',
                severity: 'LOW',
                action_suggested: 'VERIFICAR_DOCUMENTO'
            });
        }

        return alerts;
    }

    /**
     * Quality flags
     */
    buildQualityFlags(requisitos, corpoIntegrado) {
        return {
            needs_review: requisitos.some(r => r.gatilho_impugnacao),
            low_ocr_quality: corpoIntegrado.pipeline_summary?.ocr_avg_score < 0.5,
            missing_sections: requisitos.length === 0 ? ['CAPACIDADE_TECNICA'] : []
        };
    }

    /**
     * Calcula confidence
     */
    calculateConfidence(requisitos) {
        if (requisitos.length === 0) return 0.0;
        if (requisitos.length >= 3) return 0.9;
        return 0.7;
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
        const sections = [];
        for (const seg of corpoIntegrado.segments) {
            if (seg.structures) {
                const hasTech = seg.structures.sections?.some(s =>
                    /capacidade|t[eé]cnic/i.test(s.title || '')
                );
                if (hasTech) sections.push('CAPACIDADE_TECNICA');
            }
        }
        return [...new Set(sections)];
    }

    /**
     * Load patterns (placeholder)
     */
    loadPatterns() {
        return {};
    }
}

export default TechnicalValidator;
