/**
 * 🔷 SCHEMAS DO PIPELINE - LICITADOR BLINDADO
 * 
 * Define estruturas de dados para todas as etapas do pipeline,
 * incluindo o CORPO_INTEGRADO canônico.
 */

/**
 * Schema do CORPO_INTEGRADO (Formato Canônico)
 * OBRIGATÓRIO antes de qualquer agente processar documentos
 */
export const CORPO_INTEGRADO_SCHEMA = {
    // Identificação única do lote
    loteId: '', // UUID
    timestamp: '', // ISO 8601

    // Texto global contínuo (todos os docs em ordem de prioridade)
    textoCompleto: '',

    // Linhas globais numeradas
    globalLines: [
        {
            lineNumber: 0, // Número da linha global (1-indexed)
            text: '', // Texto da linha
            charStart: 0, // Posição inicial no textoCompleto
            charEnd: 0, // Posição final no textoCompleto
            sourceDocId: '', // UUID do documento de origem
            sourceDocType: '', // Tipo do documento
            sourceDocName: '', // Nome do arquivo
            sourcePage: 0, // Página no documento original
            localLineInPage: 0, // Número da linha dentro da página
        }
    ],

    // Segmentos por documento (ordem de prioridade)
    segments: [
        {
            documentId: '', // UUID único
            documentName: '', // Nome do arquivo
            documentType: '', // edital | tr | minuta | anexo | ata | planilha | mapa-de-precos | outros
            priority: 0, // 1-8 (menor = maior prioridade)
            confidence: 0, // 0-1 (confiança da classificação)

            // Hash único do conteúdo normalizado deste segmento
            segmentHash: '', // SHA-256

            // Qualidade média do OCR neste documento
            ocrQualityAvg: 0, // 0-100

            // Páginas originais do arquivo fonte
            sourcePages: [], // array de números

            // Intervalo de linhas globais que este doc ocupa
            globalLineRange: {
                start: 0,
                end: 0
            },

            // Intervalo de caracteres no textoCompleto
            charRange: {
                start: 0,
                end: 0
            },

            // Páginas processadas deste documento
            pages: [
                {
                    pageNumber: 0,
                    text: '',
                    lines: [],
                    globalLineRange: { start: 0, end: 0 },
                    charRange: { start: 0, end: 0 },
                    ocrQuality: 0 // qualidade OCR desta página
                }
            ],

            // Estruturas detectadas neste documento
            structures: {
                chapters: [],
                sections: [],
                items: [],
                tables: []
            },

            // Metadata do arquivo original
            originalMetadata: {
                filename: '',
                extension: '',
                sizeBytes: 0,
                uploadTimestamp: ''
            }
        }
    ],

    // Mapeamento reverso: linha global → doc/página/linha local
    lineMap: {
        // Chave: número da linha global (string)
        // Valor: objeto com localização completa
        // Exemplo:
        // "1": {
        //   docId: "uuid",
        //   docType: "edital",
        //   docName: "edital.pdf",
        //   page: 1,
        //   localLine: 5,
        //   charStart: 0,
        //   charEnd: 67
        // }
    },

    // Metadados gerais do lote
    metadata: {
        totalDocuments: 0,
        totalPages: 0,
        totalLines: 0,
        totalChars: 0,

        documentTypes: {
            edital: 0,
            tr: 0,
            minuta: 0,
            anexo: 0,
            ata: 0,
            planilha: 0,
            'mapa-de-precos': 0,
            outros: 0
        },

        // Estatísticas de qualidade
        ocrQualityGlobal: 0, // média ponderada
        ocrQualityMin: 0,
        ocrQualityMax: 0,

        // Deduplicação
        duplicatesRemoved: 0,
        duplicateDetails: [
            {
                keptDoc: '',
                removedDoc: '',
                similarity: 0,
                reason: ''
            }
        ],

        // Avisos e problemas
        warningFlags: [],
        errorFlags: []
    }
};

/**
 * Schema de Documento Processado (saída do OCR)
 */
export const PROCESSED_DOCUMENT_SCHEMA = {
    documentId: '', // UUID
    originalFilename: '',
    extension: '',
    sizeBytes: 0,
    uploadTimestamp: '',

    // Classificação
    documentType: '', // edital | tr | minuta | anexo | ata | planilha | mapa-de-precos | outros
    classificationConfidence: 0, // 0-1

    // Conteúdo extraído
    pages: [
        {
            pageNumber: 0,
            textRaw: '', // Texto bruto do OCR
            textNormalized: '', // Texto após normalização
            lines: [],
            ocrQuality: 0
        }
    ],

    // Texto completo normalizado
    fullTextNormalized: '',

    // Fingerprint para deduplicação
    fingerprint: {
        metadataHash: '', // Hash de metadados
        contentHash: '', // SHA-256 do conteúdo normalizado
        contentSample: '', // Primeiros 1000 chars normalizados
        textLength: 0,
        simhash: '', // SimHash para detecção rápida
    },

    // Qualidade geral
    ocrQualityAvg: 0,
    completeness: 0, // 0-1

    // Status
    processingStatus: '', // 'success' | 'partial' | 'failed'
    warnings: [],
    errors: []
};

/**
 * Schema de Comparação de Duplicatas
 */
export const DUPLICATE_COMPARISON_SCHEMA = {
    doc1Id: '',
    doc2Id: '',

    // Similaridade
    hashMatch: false, // true se hashes são idênticos
    cosineSimilarity: 0, // 0-1
    lengthRatio: 0, // 0-1 (min/max)

    // Decisão
    isDuplicate: false,
    duplicateType: '', // 'exact' | 'probable' | 'none'

    // Critérios de desempate
    comparison: {
        doc1QualityScore: 0,
        doc2QualityScore: 0,
        winnerDocId: '',
        reason: ''
    }
};

/**
 * Prioridades de documentos para fusão
 */
export const DOCUMENT_PRIORITIES = {
    'edital': 1,
    'tr': 2,
    'minuta': 3,
    'anexo': 4,
    'ata': 5,
    'planilha': 6,
    'mapa-de-precos': 7,
    'outros': 8
};

/**
 * Schema de Estrutura Detectada (Pré-Análise)
 */
export const DETECTED_STRUCTURE_SCHEMA = {
    type: '', // 'chapter' | 'section' | 'item' | 'table'
    level: 0, // 1, 2, 3...
    number: '', // "1", "1.1", "1.1.1"
    title: '',
    globalLineStart: 0,
    globalLineEnd: 0,
    charStart: 0,
    charEnd: 0,
    content: ''
};

/**
 * Constantes do Pipeline
 */
export const PIPELINE_CONSTANTS = {
    // Limiares de deduplicação
    SIMILARITY_THRESHOLD: 0.95, // ≥ 0.95 para duplicado provável
    LENGTH_RATIO_THRESHOLD: 0.90, // ≥ 0.90 para duplicado provável

    // Classificação de documentos
    CLASSIFICATION_CONFIDENCE_MIN: 0.80, // Se < 0.80, usa IA

    // Qualidade OCR
    OCR_QUALITY_MIN_ACCEPTABLE: 50, // < 50 = aviso
    OCR_QUALITY_GOOD: 80, // ≥ 80 = bom

    // Normalização de texto
    MAX_REPEATED_CHARS: 3, // Máximo de caracteres repetidos

    // Palavras-chave para classificação
    KEYWORDS: {
        edital: ['edital', 'pregão', 'concorrência', 'licitação'],
        tr: ['termo de referência', 'especificações técnicas', 'projeto básico'],
        minuta: ['minuta', 'contrato', 'cláusula'],
        ata: ['ata', 'registro de preços', 'srp'],
        planilha: ['planilha', 'orçamentária', 'quantitativo'],
        'mapa-de-precos': ['mapa de preços', 'preço médio', 'pesquisa de preços']
    }
};

export default {
    CORPO_INTEGRADO_SCHEMA,
    PROCESSED_DOCUMENT_SCHEMA,
    DUPLICATE_COMPARISON_SCHEMA,
    DOCUMENT_PRIORITIES,
    DETECTED_STRUCTURE_SCHEMA,
    PIPELINE_CONSTANTS,
};
