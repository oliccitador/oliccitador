/**
 * 🎯 ORQUESTRADOR DO PIPELINE - LICITADOR BLINDADO
 * 
 * Coordena as 9 etapas do pipeline para gerar CORPO_INTEGRADO canônico:
 * 
 * 1. Upload Layer
 * 2. Document Classifier
 * 3. OCR Engine
 * 4. Text Normalizer
 * 5. Index Builder
 * 6. Deduplicator
 * 7. Document Fusion ⭐ (CORPO_INTEGRADO)
 * 8. Structured Extractor
 * 9. Pipeline Validator
 */

import { randomUUID } from 'crypto';
import { getLogger } from '../services/logger.js';

// Importa todas as etapas
import UploadLayer from './01-uploadLayer.js';
import DocumentClassifier from './02-documentClassifier.js';
import OCREngine from './03-ocrEngine.js';
import TextNormalizer from './04-textNormalizer.js';
import IndexBuilder from './05-indexBuilder.js';
import Deduplicator from './06-deduplicator.js';
import DocumentFusion from './07-documentFusion.js';
import StructuredExtractor from './08-structuredExtractor.js';
import PipelineValidator from './09-pipelineValidator.js';

const logger = getLogger();
const PIPELINE_NAME = 'Pipeline';

class Pipeline {
    constructor() {
        this.uploadLayer = new UploadLayer();
        this.documentClassifier = new DocumentClassifier();
        this.ocrEngine = new OCREngine();
        this.textNormalizer = new TextNormalizer();
        this.indexBuilder = new IndexBuilder();
        this.deduplicator = new Deduplicator();
        this.documentFusion = new DocumentFusion();
        this.structuredExtractor = new StructuredExtractor();
        this.pipelineValidator = new PipelineValidator();
    }

    /**
     * Executa pipeline completo
     * Retorna CORPO_INTEGRADO + validação
     */
    async execute(files) {
        const pipelineId = randomUUID();
        const startTime = Date.now();

        try {
            logger.info(PIPELINE_NAME, `🚀 Iniciando pipeline ${pipelineId}`);

            // ETAPA 1: Upload Layer
            logger.info(PIPELINE_NAME, '▶️ [1/9] Upload Layer');
            const uploadResult = await this.uploadLayer.process(files);
            const loteId = uploadResult.loteId;

            // ETAPA 2: Document Classifier
            logger.info(PIPELINE_NAME, '▶️ [2/9] Document Classifier');
            const classificationResults = [];

            for (const fileMetadata of uploadResult.files) {
                // Precisa de texto para classificar - faz OCR rápido primeiro
                const quickOCR = await this.ocrEngine.process(fileMetadata);
                const text = quickOCR.fullTextRaw || '';

                const classification = await this.documentClassifier.classify(
                    text,
                    fileMetadata.originalFilename
                );

                classificationResults.push({
                    documentId: fileMetadata.documentId,
                    ...classification
                });

                // Armazena OCR result no metadata para usar depois
                fileMetadata.ocrResult = quickOCR;
            }

            // ETAPA 3: OCR Engine (já foi feito na etapa 2)
            logger.info(PIPELINE_NAME, '▶️ [3/9] OCR Engine (concluído)');
            const ocrResults = uploadResult.files.map(f => f.ocrResult);

            // ETAPA 4: Text Normalizer
            logger.info(PIPELINE_NAME, '▶️ [4/9] Text Normalizer');
            const normalizedDocs = [];

            for (const ocrResult of ocrResults) {
                const normalized = await this.textNormalizer.normalize(ocrResult);
                normalizedDocs.push(normalized);
            }

            // ETAPA 5: Index Builder
            logger.info(PIPELINE_NAME, '▶️ [5/9] Index Builder');
            const indexedDocs = [];

            for (const normalizedDoc of normalizedDocs) {
                const indexed = await this.indexBuilder.build(normalizedDoc);

                // Merge com dados anteriores
                const fileMetadata = uploadResult.files.find(f => f.documentId === normalizedDoc.documentId);
                const classification = classificationResults.find(c => c.documentId === normalizedDoc.documentId);

                indexedDocs.push({
                    ...indexed,
                    metadata: fileMetadata,
                    documentType: classification?.type || 'outros',
                    classificationConfidence: classification?.confidence || 0.5
                });
            }

            // ETAPA 6: Deduplicator
            logger.info(PIPELINE_NAME, '▶️ [6/9] Deduplicator');
            const deduplicationResult = await this.deduplicator.deduplicate(indexedDocs);
            const uniqueDocs = deduplicationResult.uniqueDocs;

            // ETAPA 7: Document Fusion ⭐ CRÍTICO
            logger.info(PIPELINE_NAME, '▶️ [7/9] Document Fusion ⭐');
            const fusionResult = await this.documentFusion.fuse(
                uniqueDocs,
                loteId,
                classificationResults
            );

            const CORPO_INTEGRADO = fusionResult.corpoIntegrado;

            // Adiciona info de duplicatas ao metadata
            CORPO_INTEGRADO.metadata.duplicatesRemoved = deduplicationResult.duplicatesRemoved.length;
            CORPO_INTEGRADO.metadata.duplicateDetails = deduplicationResult.duplicatesRemoved;

            // ETAPA 8: Structured Extractor
            logger.info(PIPELINE_NAME, '▶️ [8/9] Structured Extractor');
            const preAnalise = await this.structuredExtractor.extract(CORPO_INTEGRADO);

            // ETAPA 9: Pipeline Validator
            logger.info(PIPELINE_NAME, '▶️ [9/9] Pipeline Validator');
            const validation = await this.pipelineValidator.validate(CORPO_INTEGRADO, preAnalise);

            // Adiciona avisos e erros ao metadata
            CORPO_INTEGRADO.metadata.warningFlags = validation.warnings;
            CORPO_INTEGRADO.metadata.errorFlags = validation.errors;

            const duration = Date.now() - startTime;

            logger.info(
                PIPELINE_NAME,
                `✅ Pipeline concluído em ${(duration / 1000).toFixed(1)}s - ` +
                `Status: ${validation.status.toUpperCase()}`
            );

            // Retorna resultado completo
            return {
                pipelineId,
                loteId,
                status: validation.valid ? 'success' : 'completed_with_warnings',
                durationMs: duration,

                // CORPO_INTEGRADO canônico
                CORPO_INTEGRADO,

                // Pré-análise
                preAnalise,

                // Validação
                validation,

                // Metadados do pipeline
                pipelineMetadata: {
                    totalDocuments: uploadResult.files.length,
                    documentsProcessed: uniqueDocs.length,
                    duplicatesRemoved: deduplicationResult.duplicatesRemoved.length,
                    classificationResults,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            const duration = Date.now() - startTime;

            logger.critical(
                PIPELINE_NAME,
                `❌ Pipeline FALHOU após ${(duration / 1000).toFixed(1)}s`,
                { error: error.message, stack: error.stack }
            );

            throw new Error(`Pipeline falhou: ${error.message}`);
        }
    }

    /**
     * Obtém status de execução do pipeline
     */
    getStatus() {
        return {
            name: 'Pipeline Orquestrador',
            version: '1.0.0',
            stages: 9,
            stages_list: [
                '1. Upload Layer',
                '2. Document Classifier',
                '3. OCR Engine',
                '4. Text Normalizer',
                '5. Index Builder',
                '6. Deduplicator',
                '7. Document Fusion ⭐',
                '8. Structured Extractor',
                '9. Pipeline Validator'
            ]
        };
    }
}

export default Pipeline;
