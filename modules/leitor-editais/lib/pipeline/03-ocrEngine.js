/**
 * 🔍 ETAPA 3 - OCR ENGINE
 * 
 * Responsável por:
 * - Aplicar OCR em 100% dos documentos
 * - Processar PDF (pdf-parse + Tesseract se necessário)
 * - Processar imagens (Tesseract)
 * - Separar por páginas
 * - Calcular qualidade OCR
 * 
 * REGRA ABSOLUTA: OCR é OBRIGATÓRIO em todos os casos
 */

import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { getLogger } from '../services/logger.js';
import { sanitizeText } from '../services/validation.js';

const logger = getLogger();
const AGENTE_NOME = 'OCREngine';

class OCREngine {
    constructor() {
        this.ocrLanguage = process.env.OCR_LANGUAGE || 'por';
        this.ocrQuality = process.env.OCR_QUALITY || 'high';
    }

    /**
     * Processa documento com OCR
     */
    async process(fileMetadata) {
        try {
            const startTime = Date.now();

            logger.info(AGENTE_NOME, `Iniciando OCR: ${fileMetadata.originalFilename}`);

            const file = fileMetadata.fileReference;
            const extension = fileMetadata.extension;

            let pages = [];
            let textRaw = '';

            // Processa conforme tipo de arquivo
            if (extension === 'pdf') {
                const result = await this.processPDF(file);
                pages = result.pages;
                textRaw = result.fullText;
            } else if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(extension)) {
                textRaw = await this.processImage(file);
                pages = [{
                    pageNumber: 1,
                    textRaw,
                    lines: textRaw.split('\n').filter(l => l.trim().length > 0),
                    ocrQuality: this.calculateOCRQuality(textRaw)
                }];
            } else if (['doc', 'docx'].includes(extension)) {
                // TODO: Implementar processamento DOC/DOCX
                logger.warn(AGENTE_NOME, 'Formato DOC/DOCX ainda não suportado completamente');
                textRaw = 'SEM DADOS NO ARQUIVO - Formato DOC não implementado';
                pages = [{
                    pageNumber: 1,
                    textRaw,
                    lines: [],
                    ocrQuality: 0
                }];
            }

            // Calcula qualidade média
            const ocrQualityAvg = pages.length > 0
                ? pages.reduce((sum, p) => sum + p.ocrQuality, 0) / pages.length
                : 0;

            const duration = Date.now() - startTime;

            logger.info(
                AGENTE_NOME,
                `OCR concluído em ${(duration / 1000).toFixed(1)}s - ` +
                `${pages.length} página(s) - Qualidade: ${ocrQualityAvg.toFixed(0)}%`
            );

            return {
                documentId: fileMetadata.documentId,
                pages,
                fullTextRaw: textRaw,
                ocrQualityAvg,
                processingTimeMs: duration,
                status: 'success'
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro no OCR', {
                file: fileMetadata.originalFilename,
                error: error.message
            });

            return {
                documentId: fileMetadata.documentId,
                pages: [],
                fullTextRaw: 'SEM DADOS NO ARQUIVO',
                ocrQualityAvg: 0,
                processingTimeMs: 0,
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Processa arquivo PDF
     */
    async processPDF(file) {
        logger.info(AGENTE_NOME, '📑 Processando PDF...');

        try {
            // Converte para buffer
            const buffer = await this.fileToBuffer(file);

            // Extrai texto com pdf-parse
            const pdfData = await pdfParse(buffer, {
                // Opções para melhor extração
                max: 0, // Sem limite de páginas
                version: 'default'
            });

            const fullText = pdfData.text || '';
            const numPages = pdfData.numpages || 1;

            logger.info(AGENTE_NOME, `PDF: ${numPages} página(s), ${fullText.length} caracteres`);

            // Separa texto por páginas (aproximado)
            const pagesText = this.splitTextIntoPages(fullText, numPages);

            // Monta estrutura de páginas
            const pages = pagesText.map((pageText, index) => {
                const lines = pageText.split('\n').filter(l => l.trim().length > 0);

                return {
                    pageNumber: index + 1,
                    textRaw: pageText,
                    lines,
                    ocrQuality: this.calculateOCRQuality(pageText)
                };
            });

            // Se o texto extraído for muito pequeno, tenta OCR em imagens
            if (fullText.length < 100 && numPages > 0) {
                logger.warn(
                    AGENTE_NOME,
                    'Texto extraído muito pequeno - PDF pode ser de imagens escaneadas'
                );

                // TODO: Implementar conversão PDF→Imagens→OCR
                // Por enquanto, retorna o que conseguiu
            }

            return {
                pages,
                fullText: sanitizeText(fullText)
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro ao processar PDF', { error: error.message });

            return {
                pages: [{
                    pageNumber: 1,
                    textRaw: 'SEM DADOS NO ARQUIVO',
                    lines: [],
                    ocrQuality: 0
                }],
                fullText: 'SEM DADOS NO ARQUIVO'
            };
        }
    }

    /**
     * Processa imagem com OCR
     */
    async processImage(file) {
        logger.info(AGENTE_NOME, '🖼️ Processando imagem com OCR...');

        try {
            const buffer = await this.fileToBuffer(file);

            // Otimiza imagem com sharp para melhor OCR
            const optimizedImage = await sharp(buffer)
                .greyscale()
                .normalize()
                .sharpen()
                .toBuffer();

            // Aplica OCR com Tesseract
            const worker = await createWorker(this.ocrLanguage);

            const { data: { text } } = await worker.recognize(optimizedImage);

            await worker.terminate();

            logger.info(AGENTE_NOME, `OCR: ${text.length} caracteres extraídos`);

            return sanitizeText(text);

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro ao processar imagem', { error: error.message });
            return 'SEM DADOS NO ARQUIVO';
        }
    }

    /**
     * Divide texto em páginas aproximadas
     */
    splitTextIntoPages(text, numPages) {
        if (numPages <= 1) {
            return [text];
        }

        // Tenta identificar quebras de página por padrões
        const pageBreakPatterns = [
            /\f/g, // Form feed
            /\n{4,}/g, // Múltiplas quebras de linha
            /Página \d+/gi,
        ];

        let pages = [text];

        // Tenta dividir por padrões
        for (const pattern of pageBreakPatterns) {
            const splits = text.split(pattern);

            if (splits.length > 1 && splits.length <= numPages * 1.5) {
                pages = splits;
                break;
            }
        }

        // Se não conseguiu dividir por padrões, divide por tamanho
        if (pages.length === 1) {
            const charsPerPage = Math.ceil(text.length / numPages);
            pages = [];

            for (let i = 0; i < numPages; i++) {
                const start = i * charsPerPage;
                const end = start + charsPerPage;
                const pageText = text.substring(start, end);

                if (pageText.trim().length > 0) {
                    pages.push(pageText);
                }
            }
        }

        return pages.length > 0 ? pages : [text];
    }

    /**
     * Calcula qualidade do OCR (0-100)
     */
    calculateOCRQuality(text) {
        if (!text || text === 'SEM DADOS NO ARQUIVO') {
            return 0;
        }

        let score = 100;

        // Penaliza se tem muitos caracteres especiais (ruído)
        const specialCharsRatio = (text.match(/[^a-zA-Z0-9\sáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ.,;:()\-]/g) || []).length / text.length;
        if (specialCharsRatio > 0.1) {
            score -= 20;
        }

        // Penaliza se tem muitas palavras muito curtas
        const words = text.split(/\s+/);
        const shortWords = words.filter(w => w.length < 2).length;
        const shortWordsRatio = words.length > 0 ? shortWords / words.length : 0;
        if (shortWordsRatio > 0.3) {
            score -= 30;
        }

        // Penaliza se tem muitas linhas vazias
        const lines = text.split('\n');
        const emptyLines = lines.filter(l => l.trim().length === 0).length;
        const emptyLinesRatio = lines.length > 0 ? emptyLines / lines.length : 0;
        if (emptyLinesRatio > 0.5) {
            score -= 15;
        }

        // Bonifica se tem estrutura de parágrafos
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        if (paragraphs.length > 3) {
            score += 10;
        }

        // Bonifica se tem pontuação adequada
        const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
        if (sentences.length > 5) {
            score += 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Converte File/Blob para Buffer
     */
    async fileToBuffer(file) {
        if (Buffer.isBuffer(file)) {
            return file;
        }

        if (file instanceof ArrayBuffer) {
            return Buffer.from(file);
        }

        if (file.arrayBuffer) {
            const arrayBuffer = await file.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }

        throw new Error('Formato de arquivo não suportado para conversão');
    }
}

export default OCREngine;
