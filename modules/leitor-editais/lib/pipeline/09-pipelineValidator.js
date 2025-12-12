/**
 * ✅ ETAPA 9 - PIPELINE VALIDATOR
 * 
 * Responsável por:
 * - Verificar se CORPO_INTEGRADO existe e é válido
 * - Validar estrutura canônica
 * - Conferir integridade de lineMap e segments
 * - Registrar avisos e erros
 * 
 * ÚLTIMA ETAPA ANTES DE ENTREGAR AOS AGENTES
 */

import { getLogger } from '../services/logger.js';
import { PIPELINE_CONSTANTS } from '../types/pipeline-schemas.js';

const logger = getLogger();
const AGENTE_NOME = 'PipelineValidator';

class PipelineValidator {
    constructor() {
        this.minOCRQuality = PIPELINE_CONSTANTS.OCR_QUALITY_MIN_ACCEPTABLE;
    }

    /**
     * Valida CORPO_INTEGRADO completo
     */
    async validate(corpoIntegrado, preAnalise) {
        try {
            logger.info(AGENTE_NOME, 'Validando CORPO_INTEGRADO');

            const validations = {
                estruturaBasica: this.validateBasicStructure(corpoIntegrado),
                globalLines: this.validateGlobalLines(corpoIntegrado),
                lineMap: this.validateLineMap(corpoIntegrado),
                segments: this.validateSegments(corpoIntegrado),
                qualidadeOCR: this.validateOCRQuality(corpoIntegrado),
                metadados: this.validateMetadata(corpoIntegrado, preAnalise)
            };

            // Consolida resultados
            const allValid = Object.values(validations).every(v => v.valid);

            const warnings = Object.values(validations)
                .flatMap(v => v.warnings || []);

            const errors = Object.values(validations)
                .flatMap(v => v.errors || []);

            // Determina status final
            let status = 'success';
            if (errors.length > 0) {
                status = 'error';
            } else if (warnings.length > 0) {
                status = 'warning';
            }

            logger.info(
                AGENTE_NOME,
                `Validação concluída: ${status.toUpperCase()} ` +
                `(${warnings.length} avisos, ${errors.length} erros)`
            );

            return {
                valid: allValid && errors.length === 0,
                status,
                validations,
                warnings,
                errors,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.critical(AGENTE_NOME, 'ERRO na validação', { error: error.message });

            return {
                valid: false,
                status: 'error',
                validations: {},
                warnings: [],
                errors: [error.message],
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Valida estrutura básica
     */
    validateBasicStructure(corpo) {
        const errors = [];
        const warnings = [];

        if (!corpo) {
            errors.push('CORPO_INTEGRADO não existe');
            return { valid: false, errors, warnings };
        }

        if (!corpo.loteId) errors.push('loteId ausente');
        if (!corpo.timestamp) errors.push('timestamp ausente');
        if (!corpo.textoCompleto) errors.push('textoCompleto ausente');
        if (!corpo.globalLines) errors.push('globalLines ausente');
        if (!corpo.segments) errors.push('segments ausente');
        if (!corpo.lineMap) errors.push('lineMap ausente');
        if (!corpo.metadata) errors.push('metadata ausente');

        if (corpo.textoCompleto && corpo.textoCompleto.length === 0) {
            warnings.push('textoCompleto vazio');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Valida globalLines
     */
    validateGlobalLines(corpo) {
        const errors = [];
        const warnings = [];

        if (!corpo.globalLines || !Array.isArray(corpo.globalLines)) {
            errors.push('globalLines inválido');
            return { valid: false, errors, warnings };
        }

        if (corpo.globalLines.length === 0) {
            errors.push('globalLines vazio');
            return { valid: false, errors, warnings };
        }

        // Valida sequência de linhas
        for (let i = 0; i < corpo.globalLines.length; i++) {
            const line = corpo.globalLines[i];

            if (line.lineNumber !== i + 1) {
                errors.push(`Linha ${i + 1}: número incorreto (${line.lineNumber})`);
            }

            if (line.charStart === undefined || line.charEnd === undefined) {
                errors.push(`Linha ${i + 1}: charStart/charEnd ausente`);
            }

            if (line.charStart > line.charEnd) {
                errors.push(`Linha ${i + 1}: charStart > charEnd`);
            }

            if (!line.sourceDocId) {
                errors.push(`Linha ${i + 1}: sourceDocId ausente`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Valida lineMap
     */
    validateLineMap(corpo) {
        const errors = [];
        const warnings = [];

        if (!corpo.lineMap || typeof corpo.lineMap !== 'object') {
            errors.push('lineMap inválido');
            return { valid: false, errors, warnings };
        }

        const lineMapSize = Object.keys(corpo.lineMap).length;
        const globalLinesSize = corpo.globalLines?.length || 0;

        if (lineMapSize !== globalLinesSize) {
            errors.push(
                `lineMap incompleto: ${lineMapSize} entradas, ` +
                `esperado ${globalLinesSize}`
            );
        }

        // Valida algumas entradas do lineMap
        const sampleSize = Math.min(10, globalLinesSize);
        for (let i = 1; i <= sampleSize; i++) {
            const entry = corpo.lineMap[i.toString()];

            if (!entry) {
                errors.push(`lineMap[${i}] ausente`);
                continue;
            }

            if (!entry.docId) errors.push(`lineMap[${i}]: docId ausente`);
            if (!entry.docType) errors.push(`lineMap[${i}]: docType ausente`);
            if (entry.charStart === undefined) errors.push(`lineMap[${i}]: charStart ausente`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Valida segments
     */
    validateSegments(corpo) {
        const errors = [];
        const warnings = [];

        if (!corpo.segments || !Array.isArray(corpo.segments)) {
            errors.push('segments inválido');
            return { valid: false, errors, warnings };
        }

        if (corpo.segments.length === 0) {
            errors.push('segments vazio');
            return { valid: false, errors, warnings };
        }

        for (const segment of corpo.segments) {
            if (!segment.documentId) errors.push(`Segment sem documentId`);
            if (!segment.segmentHash) errors.push(`Segment ${segment.documentId}: sem segmentHash`);
            if (segment.ocrQualityAvg === undefined) {
                errors.push(`Segment ${segment.documentId}: sem ocrQualityAvg`);
            }
            if (!segment.sourcePages || !Array.isArray(segment.sourcePages)) {
                errors.push(`Segment ${segment.documentId}: sourcePages inválido`);
            }
            if (!segment.globalLineRange) {
                errors.push(`Segment ${segment.documentId}: sem globalLineRange`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Valida qualidade OCR
     */
    validateOCRQuality(corpo) {
        const errors = [];
        const warnings = [];

        const avgQuality = corpo.metadata?.ocrQualityGlobal || 0;

        if (avgQuality < this.minOCRQuality) {
            warnings.push(
                `Qualidade OCR média baixa: ${avgQuality}% ` +
                `(mínimo recomendado: ${this.minOCRQuality}%)`
            );
        }

        // Verifica segments com qualidade muito baixa
        if (corpo.segments) {
            for (const segment of corpo.segments) {
                if (segment.ocrQualityAvg < this.minOCRQuality) {
                    warnings.push(
                        `Documento "${segment.documentName}" com OCR de baixa qualidade: ` +
                        `${segment.ocrQualityAvg.toFixed(0)}%`
                    );
                }
            }
        }

        return {
            valid: true, // Warnings não invalidam
            errors,
            warnings
        };
    }

    /**
     * Valida metadados com pré-análise
     */
    validateMetadata(corpo, preAnalise) {
        const errors = [];
        const warnings = [];

        if (!corpo.metadata) {
            errors.push('metadata ausente');
            return { valid: false, errors, warnings };
        }

        // Verifica se metadados básicos foram extraídos
        if (preAnalise) {
            const metadados = preAnalise.metadados || {};

            if (metadados.processo === 'SEM DADOS NO ARQUIVO') {
                warnings.push('Número do processo não encontrado no edital');
            }

            if (metadados.orgao === 'SEM DADOS NO ARQUIVO') {
                warnings.push('Órgão licitante não identificado');
            }

            if (!preAnalise.itens || preAnalise.itens.length === 0) {
                warnings.push('Nenhum item/lote detectado automaticamente');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}

export default PipelineValidator;
