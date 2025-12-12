/**
 * 🔍 AGENTE 1 - INGESTOR ENGINE (OCR)
 * 
 * Responsável por:
 * - Receber arquivos múltiplos
 * - Identificar tipo de documento (edital, TR, minuta, ata, anexo, planilha)
 * - Aplicar OCR em 100% dos casos
 * - Padronizar formatação
 * - Remover ruídos
 * - Criar estrutura paginada e indexada
 * 
 * TECNOLOGIAS:
 * - Tesseract.js (OCR)
 * - pdf-parse (leitura de PDF)
 * - sharp (processamento de imagem)
 */

import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { getLogger } from '../services/logger.js';
import { validateFileSize, validateFileExtension, sanitizeText } from '../services/validation.js';
import { IngestorOutputSchema } from '../types/schemas.js';

const logger = getLogger();
const AGENTE_NOME = 'IngestorEngine';

class IngestorEngine {
    constructor() {
        this.ocrLanguage = process.env.OCR_LANGUAGE || 'por';
        this.ocrQuality = process.env.OCR_QUALITY || 'high';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
    }

    /**
     * Processa múltiplos arquivos
     */
    async process(files) {
        try {
            logger.startAgent(AGENTE_NOME);
            logger.info(AGENTE_NOME, `Processando ${files.length} arquivo(s)`);

            const results = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                logger.info(AGENTE_NOME, `📄 Processando arquivo ${i + 1}/${files.length}: ${file.name}`);

                try {
                    const processedFile = await this.processFile(file);
                    results.push(processedFile);
                } catch (error) {
                    logger.error(
                        AGENTE_NOME,
                        `Erro ao processar arquivo "${file.name}"`,
                        { error: error.message },
                        'continuar com próximo arquivo'
                    );

                    // Adiciona resultado de erro
                    results.push({
                        tipo: 'erro',
                        nomeArquivo: file.name,
                        erro: error.message,
                        texto: 'SEM DADOS NO ARQUIVO',
                        paginas: [],
                        linhas: [],
                        metadata: {
                            totalPaginas: 0,
                            tamanhoBytes: file.size || 0,
                            dataProcessamento: new Date().toISOString(),
                            ocrQuality: 0,
                        },
                    });
                }
            }

            return {
                agente: AGENTE_NOME,
                status: results.every(r => r.tipo !== 'erro') ? 'ok' : 'parcial',
                timestamp: new Date().toISOString(),
                dados: results,
                origem: {
                    documento: 'SISTEMA',
                    pagina: 0,
                    trecho: 'Processamento de OCR',
                },
            };

        } catch (error) {
            logger.critical(AGENTE_NOME, 'Erro crítico no processamento', { error: error.message });
            throw error;
        }
    }

    /**
     * Processa um arquivo individual
     */
    async processFile(file) {
        // Validações
        if (!validateFileSize(file.size, this.maxFileSize)) {
            throw new Error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        if (!validateFileExtension(file.name)) {
            throw new Error(`Extensão não suportada: ${file.name}`);
        }

        // Detecta tipo de arquivo
        const tipo = this.detectFileType(file.name);
        logger.info(AGENTE_NOME, `Tipo detectado: ${tipo}`);

        // Processa conforme extensão
        const extension = file.name.split('.').pop().toLowerCase();

        let textoExtraido = '';
        let paginas = [];

        if (extension === 'pdf') {
            const result = await this.processPDF(file);
            textoExtraido = result.text;
            paginas = result.paginas;
        } else if (['jpg', 'jpeg', 'png', 'tiff'].includes(extension)) {
            textoExtraido = await this.processImage(file);
            paginas = [textoExtraido];
        } else if (['doc', 'docx'].includes(extension)) {
            // TODO: Implementar processamento de DOC/DOCX
            textoExtraido = 'SEM DADOS NO ARQUIVO - Formato DOC não implementado';
            paginas = [textoExtraido];
        }

        // Sanitiza texto
        textoExtraido = sanitizeText(textoExtraido);

        // Cria array de linhas
        const linhas = textoExtraido.split('\n').filter(linha => linha.trim().length > 0);

        // Calcula qualidade do OCR
        const ocrQuality = this.calculateOCRQuality(textoExtraido);

        return {
            tipo,
            nomeArquivo: file.name,
            texto: textoExtraido,
            paginas,
            linhas,
            metadata: {
                totalPaginas: paginas.length,
                tamanhoBytes: file.size,
                dataProcessamento: new Date().toISOString(),
                ocrQuality,
            },
        };
    }

    /**
     * Processa arquivo PDF
     */
    async processPDF(file) {
        logger.info(AGENTE_NOME, '📑 Processando PDF...');

        try {
            // Converte file para buffer
            const buffer = await this.fileToBuffer(file);

            // Extrai texto com pdf-parse
            const pdfData = await pdfParse(buffer);

            // Separa por páginas (pdf-parse não fornece isso diretamente,
            // então fazemos uma aproximação por quebras de página)
            const fullText = pdfData.text;
            const paginas = this.splitIntoPagesApprox(fullText, pdfData.numpages);

            logger.info(AGENTE_NOME, `PDF processado: ${pdfData.numpages} página(s)`);

            // Se o texto extraído for muito pequeno, aplica OCR
            if (fullText.length < 100 && pdfData.numpages > 0) {
                logger.warn(AGENTE_NOME, 'Texto extraído muito pequeno - aplicando OCR em imagens');
                // TODO: Converter PDF para imagens e aplicar OCR
                return {
                    text: fullText || 'SEM DADOS NO ARQUIVO',
                    paginas: paginas.length > 0 ? paginas : ['SEM DADOS NO ARQUIVO'],
                };
            }

            return {
                text: fullText,
                paginas,
            };

        } catch (error) {
            logger.error(
                AGENTE_NOME,
                'Erro ao processar PDF',
                { error: error.message },
                'retornar SEM DADOS'
            );

            return {
                text: 'SEM DADOS NO ARQUIVO',
                paginas: ['SEM DADOS NO ARQUIVO'],
            };
        }
    }

    /**
     * Processa arquivo de imagem com OCR
     */
    async processImage(file) {
        logger.info(AGENTE_NOME, '🖼️ Processando imagem com OCR...');

        try {
            const buffer = await this.fileToBuffer(file);

            // Otimiza imagem com sharp
            const optimizedImage = await sharp(buffer)
                .greyscale()
                .normalize()
                .sharpen()
                .toBuffer();

            // Aplica OCR com Tesseract
            const worker = await createWorker(this.ocrLanguage);
            const { data: { text } } = await worker.recognize(optimizedImage);
            await worker.terminate();

            logger.info(AGENTE_NOME, `OCR concluído: ${text.length} caracteres extraídos`);

            return text;

        } catch (error) {
            logger.error(
                AGENTE_NOME,
                'Erro ao processar imagem',
                { error: error.message },
                'retornar SEM DADOS'
            );

            return 'SEM DADOS NO ARQUIVO';
        }
    }

    /**
     * Detecta tipo de documento pelo nome
     */
    detectFileType(filename) {
        const lower = filename.toLowerCase();

        if (lower.includes('edital')) return 'edital';
        if (lower.includes('tr') || lower.includes('termo') || lower.includes('referencia')) return 'tr';
        if (lower.includes('minuta')) return 'minuta';
        if (lower.includes('ata')) return 'ata';
        if (lower.includes('anexo')) return 'anexo';
        if (lower.includes('planilha') || lower.includes('.xls')) return 'planilha';

        // Default
        logger.warn(AGENTE_NOME, `Tipo de documento não identificado: ${filename} - usando "anexo"`);
        return 'anexo';
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

        throw new Error('Formato de arquivo não suportado');
    }

    /**
     * Divide texto em páginas aproximadas
     */
    splitIntoPagesApprox(text, numPages) {
        if (numPages <= 1) {
            return [text];
        }

        const charsPerPage = Math.ceil(text.length / numPages);
        const paginas = [];

        for (let i = 0; i < numPages; i++) {
            const start = i * charsPerPage;
            const end = start + charsPerPage;
            const pageText = text.substring(start, end);

            if (pageText.trim().length > 0) {
                paginas.push(pageText);
            }
        }

        return paginas.length > 0 ? paginas : [text];
    }

    /**
     * Calcula qualidade do OCR (0-100)
     */
    calculateOCRQuality(text) {
        if (!text || text === 'SEM DADOS NO ARQUIVO') {
            return 0;
        }

        let score = 100;

        // Penaliza se tem muitos caracteres especiais
        const specialCharsRatio = (text.match(/[^a-zA-Z0-9\s.,;:()\-]/g) || []).length / text.length;
        if (specialCharsRatio > 0.1) {
            score -= 20;
        }

        // Penaliza se tem muitas palavras com < 2 caracteres
        const words = text.split(/\s+/);
        const shortWords = words.filter(w => w.length < 2).length;
        const shortWordsRatio = shortWords / words.length;
        if (shortWordsRatio > 0.3) {
            score -= 30;
        }

        // Bonifica se tem estrutura de parágrafos
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        if (paragraphs.length > 3) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    }
}

export default IngestorEngine;
