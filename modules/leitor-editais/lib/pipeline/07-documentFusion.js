/**
 * 🔷 ETAPA 7 - DOCUMENT FUSION ⭐ CRÍTICO
 * 
 * Responsável por:
 * - Ordenar documentos por prioridade
 * - Concatenar textos respeitando ordem
 * - Montar globalLines com char_start/char_end
 * - Criar lineMap completo (linha → doc/type/página/char)
 * - Gerar segments com hash/quality/pages
 * - RETORNAR CORPO_INTEGRADO CANÔNICO
 * 
 * ESTE É O CORAÇÃO DO PIPELINE
 */

import crypto from 'crypto';
import { getLogger } from '../services/logger.js';
import { DOCUMENT_PRIORITIES } from '../types/pipeline-schemas.js';

const logger = getLogger();
const AGENTE_NOME = 'DocumentFusion';

class DocumentFusion {
    constructor() {
        this.priorities = DOCUMENT_PRIORITIES;
    }

    /**
     * Funde múltiplos documentos em CORPO_INTEGRADO canônico
     */
    async fuse(uniqueDocs, loteId, classification) {
        try {
            logger.info(AGENTE_NOME, `Fundindo ${uniqueDocs.length} documento(s) em CORPO_INTEGRADO`);

            // Ordena documentos por prioridade
            const sortedDocs = this.sortDocumentsByPriority(uniqueDocs, classification);

            // Concatena textos e monta globalLines
            const { textoCompleto, globalLines } = this.buildGlobalText(sortedDocs);

            // Cria lineMap
            const lineMap = this.buildLineMap(globalLines);

            // Cria segments
            const segments = this.buildSegments(sortedDocs, globalLines);

            // Calcula metadados globais
            const metadata = this.buildMetadata(sortedDocs, segments, globalLines);

            // Monta CORPO_INTEGRADO final
            const corpoIntegrado = {
                loteId,
                timestamp: new Date().toISOString(),
                textoCompleto,
                globalLines,
                segments,
                lineMap,
                metadata
            };

            logger.info(
                AGENTE_NOME,
                `CORPO_INTEGRADO criado: ${globalLines.length} linhas, ` +
                `${segments.length} segmentos, ${textoCompleto.length} caracteres`
            );

            return {
                corpoIntegrado,
                status: 'success'
            };

        } catch (error) {
            logger.critical(AGENTE_NOME, 'ERRO CRÍTICO ao fundir documentos', { error: error.message });
            throw error;
        }
    }

    /**
     * Ordena documentos por prioridade
     */
    sortDocumentsByPriority(docs, classification) {
        const docsWithPriority = docs.map(doc => {
            // Pega tipo do documento (da classificação ou metadata)
            const docType = classification?.find(c => c.documentId === doc.documentId)?.type ||
                doc.documentType ||
                'outros';

            const priority = this.priorities[docType] || 8;

            return {
                ...doc,
                documentType: docType,
                priority
            };
        });

        // Ordena por prioridade (menor = maior prioridade)
        docsWithPriority.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            // Se mesma prioridade, ordena por nome
            const nameA = a.metadata?.originalFilename || '';
            const nameB = b.metadata?.originalFilename || '';
            return nameA.localeCompare(nameB);
        });

        logger.info(
            AGENTE_NOME,
            `Ordem de fusão: ${docsWithPriority.map(d => `${d.documentType} (pri:${d.priority})`).join(' → ')}`
        );

        return docsWithPriority;
    }

    /**
     * Constrói texto completo global e globalLines
     */
    buildGlobalText(sortedDocs) {
        let textoCompleto = '';
        const globalLines = [];
        let currentLineNumber = 1;
        let currentCharPosition = 0;

        for (const doc of sortedDocs) {
            const docLines = doc.globalLines || [];

            for (const line of docLines) {
                const lineText = line.text || '';
                const charStart = currentCharPosition;
                const charEnd = currentCharPosition + lineText.length;

                globalLines.push({
                    lineNumber: currentLineNumber,
                    text: lineText,
                    charStart,
                    charEnd,

                    // Informações de origem
                    sourceDocId: doc.documentId,
                    sourceDocType: doc.documentType,
                    sourceDocName: doc.metadata?.originalFilename || doc.documentId,
                    sourcePage: line.sourcePage,
                    localLineInPage: line.localLineInPage
                });

                textoCompleto += lineText + '\n';

                currentLineNumber++;
                currentCharPosition = charEnd + 1; // +1 para o '\n'
            }

            // Adiciona quebra extra entre documentos
            textoCompleto += '\n';
            currentCharPosition += 1;
        }

        return {
            textoCompleto: textoCompleto.trim(),
            globalLines
        };
    }

    /**
     * Constrói lineMap (linha global → informações completas)
     */
    buildLineMap(globalLines) {
        const lineMap = {};

        for (const line of globalLines) {
            lineMap[line.lineNumber.toString()] = {
                docId: line.sourceDocId,
                docType: line.sourceDocType,
                docName: line.sourceDocName,
                page: line.sourcePage,
                localLine: line.localLineInPage,
                charStart: line.charStart,
                charEnd: line.charEnd
            };
        }

        return lineMap;
    }

    /**
     * Constrói segments para cada documento
     */
    buildSegments(sortedDocs, globalLines) {
        const segments = [];

        for (const doc of sortedDocs) {
            // Encontra intervalo de linhas globais deste documento
            const docGlobalLines = globalLines.filter(l => l.sourceDocId === doc.documentId);

            if (docGlobalLines.length === 0) {
                logger.warn(AGENTE_NOME, `Documento ${doc.documentId} sem linhas globais`);
                continue;
            }

            const firstLine = docGlobalLines[0];
            const lastLine = docGlobalLines[docGlobalLines.length - 1];

            // Calcula qualidade OCR média
            const ocrQualityAvg = this.calculateAvgOCRQuality(doc);

            // Extrai páginas originais
            const sourcePages = [...new Set(docGlobalLines.map(l => l.sourcePage))].sort((a, b) => a - b);

            // Gera segment hash
            const segmentText = docGlobalLines.map(l => l.text).join('\n');
            const segmentHash = crypto.createHash('sha256').update(segmentText).digest('hex');

            // Monta estrutura de páginas
            const pages = this.buildSegmentPages(doc, docGlobalLines);

            // Constrói segment
            const segment = {
                documentId: doc.documentId,
                documentName: doc.metadata?.originalFilename || doc.documentId,
                documentType: doc.documentType,
                priority: doc.priority,
                confidence: doc.classificationConfidence || 1.0,

                segmentHash,
                ocrQualityAvg,
                sourcePages,

                globalLineRange: {
                    start: firstLine.lineNumber,
                    end: lastLine.lineNumber
                },

                charRange: {
                    start: firstLine.charStart,
                    end: lastLine.charEnd
                },

                pages,

                structures: doc.structures || {
                    chapters: [],
                    sections: [],
                    items: [],
                    tables: []
                },

                originalMetadata: {
                    filename: doc.metadata?.originalFilename || '',
                    extension: doc.metadata?.extension || '',
                    sizeBytes: doc.metadata?.sizeBytes || 0,
                    uploadTimestamp: doc.metadata?.uploadTimestamp || new Date().toISOString()
                }
            };

            segments.push(segment);
        }

        return segments;
    }

    /**
     * Constrói páginas de um segment
     */
    buildSegmentPages(doc, docGlobalLines) {
        const pageNumbers = [...new Set(docGlobalLines.map(l => l.sourcePage))].sort((a, b) => a - b);
        const pages = [];

        for (const pageNum of pageNumbers) {
            const pageLines = docGlobalLines.filter(l => l.sourcePage === pageNum);

            if (pageLines.length === 0) continue;

            const firstLine = pageLines[0];
            const lastLine = pageLines[pageLines.length - 1];
            const pageText = pageLines.map(l => l.text).join('\n');

            // Qualidade OCR da página (se disponível em doc.pages original)
            const originalPage = doc.pages?.find(p => p.pageNumber === pageNum);
            const ocrQuality = originalPage?.ocrQuality || doc.metadata?.ocrQualityAvg || 0;

            pages.push({
                pageNumber: pageNum,
                text: pageText,
                lines: pageLines.map(l => l.text),
                globalLineRange: {
                    start: firstLine.lineNumber,
                    end: lastLine.lineNumber
                },
                charRange: {
                    start: firstLine.charStart,
                    end: lastLine.charEnd
                },
                ocrQuality
            });
        }

        return pages;
    }

    /**
     * Calcula qualidade OCR média de um documento
     */
    calculateAvgOCRQuality(doc) {
        // Tenta pegar de metadata
        if (doc.metadata?.ocrQualityAvg) {
            return doc.metadata.ocrQualityAvg;
        }

        // Tenta calcular de páginas
        if (doc.pages && doc.pages.length > 0) {
            const qualities = doc.pages
                .map(p => p.ocrQuality || 0)
                .filter(q => q > 0);

            if (qualities.length > 0) {
                return qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
            }
        }

        return 0;
    }

    /**
     * Constrói metadados globais
     */
    buildMetadata(docs, segments, globalLines) {
        // Conta tipos de documentos
        const documentTypes = {};
        for (const doc of docs) {
            const type = doc.documentType || 'outros';
            documentTypes[type] = (documentTypes[type] || 0) + 1;
        }

        // Calcula estatísticas de OCR
        const ocrQualities = segments
            .map(s => s.ocrQualityAvg)
            .filter(q => q > 0);

        const ocrQualityGlobal = ocrQualities.length > 0
            ? ocrQualities.reduce((sum, q) => sum + q, 0) / ocrQualities.length
            : 0;

        const ocrQualityMin = ocrQualities.length > 0 ? Math.min(...ocrQualities) : 0;
        const ocrQualityMax = ocrQualities.length > 0 ? Math.max(...ocrQualities) : 0;

        // Total de páginas
        const totalPages = segments.reduce((sum, s) => sum + s.sourcePages.length, 0);

        // Total de caracteres
        const totalChars = globalLines.reduce((sum, l) => sum + l.text.length, 0);

        return {
            totalDocuments: docs.length,
            totalPages,
            totalLines: globalLines.length,
            totalChars,

            documentTypes,

            ocrQualityGlobal: Math.round(ocrQualityGlobal),
            ocrQualityMin: Math.round(ocrQualityMin),
            ocrQualityMax: Math.round(ocrQualityMax),

            duplicatesRemoved: 0, // Será preenchido por etapa anterior
            duplicateDetails: [],

            warningFlags: [],
            errorFlags: []
        };
    }
}

export default DocumentFusion;
