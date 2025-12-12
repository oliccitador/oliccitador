/**
 * 📤 ETAPA 1 - UPLOAD LAYER
 * 
 * Responsável por:
 * - Receber todos os arquivos enviados
 * - Gerar ID único do lote
 * - Registrar metadados básicos
 * - Validar integridade
 * - Armazenar temporariamente (opcional)
 */

import { randomUUID } from 'crypto';
import { getLogger } from '../services/logger.js';
import { validateFileSize, validateFileExtension } from '../services/validation.js';

const logger = getLogger();
const AGENTE_NOME = 'UploadLayer';

class UploadLayer {
    constructor() {
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
        this.maxFiles = parseInt(process.env.MAX_FILES_PER_UPLOAD || '10');
    }

    /**
     * Processa upload de arquivos
     */
    async process(files) {
        try {
            logger.startAgent(AGENTE_NOME);
            logger.info(AGENTE_NOME, `Recebendo ${files.length} arquivo(s)`);

            // Gera ID único do lote
            const loteId = randomUUID();
            const timestamp = new Date().toISOString();

            logger.info(AGENTE_NOME, `Lote ID: ${loteId}`);

            // Validações iniciais
            this.validateBatch(files);

            // Processa cada arquivo
            const processedFiles = [];
            const warnings = [];
            const errors = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                try {
                    logger.info(AGENTE_NOME, `Processando arquivo ${i + 1}/${files.length}: ${file.name}`);

                    const processedFile = await this.processFile(file, loteId);
                    processedFiles.push(processedFile);

                } catch (error) {
                    const errorMsg = `Erro ao processar ${file.name}: ${error.message}`;
                    logger.error(AGENTE_NOME, errorMsg, { error: error.message });

                    errors.push({
                        filename: file.name,
                        error: error.message
                    });

                    // Continua processando outros arquivos
                }
            }

            // Se nenhum arquivo foi processado com sucesso
            if (processedFiles.length === 0) {
                throw new Error('Nenhum arquivo pôde ser processado com sucesso');
            }

            // Resultado final
            const result = {
                loteId,
                timestamp,
                files: processedFiles,
                metadata: {
                    totalFiles: processedFiles.length,
                    totalRejected: errors.length,
                    totalSizeBytes: processedFiles.reduce((sum, f) => sum + f.sizeBytes, 0)
                },
                warnings,
                errors
            };

            logger.endAgent(AGENTE_NOME, 'ok', 0);

            return result;

        } catch (error) {
            logger.critical(AGENTE_NOME, 'Erro crítico no upload', { error: error.message });
            throw error;
        }
    }

    /**
     * Valida lote de arquivos
     */
    validateBatch(files) {
        // Valida quantidade
        if (!files || files.length === 0) {
            throw new Error('Nenhum arquivo fornecido');
        }

        if (files.length > this.maxFiles) {
            throw new Error(`Máximo de ${this.maxFiles} arquivos permitidos. Enviados: ${files.length}`);
        }

        logger.info(AGENTE_NOME, `Validação do lote: ${files.length} arquivo(s) OK`);
    }

    /**
     * Processa arquivo individual
     */
    async processFile(file, loteId) {
        // Gera UUID único para o documento
        const documentId = randomUUID();

        // Extrai metadados básicos
        const metadata = {
            documentId,
            loteId,
            originalFilename: file.name,
            extension: this.extractExtension(file.name),
            sizeBytes: file.size || 0,
            uploadTimestamp: new Date().toISOString()
        };

        // Validações
        this.validateFile(metadata);

        // Verifica integridade (se possível)
        const integrity = await this.checkIntegrity(file);

        if (!integrity.valid) {
            logger.warn(
                AGENTE_NOME,
                `Arquivo pode estar corrompido: ${file.name}`,
                { reason: integrity.reason }
            );
            metadata.integrityWarning = integrity.reason;
        }

        // Armazena referência ao arquivo original
        // (em produção, poderia salvar em storage temporário)
        metadata.fileReference = file;

        logger.info(AGENTE_NOME, `Arquivo processado: ${file.name} (${this.formatBytes(metadata.sizeBytes)})`);

        return metadata;
    }

    /**
     * Valida arquivo individual
     */
    validateFile(metadata) {
        // Valida tamanho
        if (!validateFileSize(metadata.sizeBytes, this.maxFileSize)) {
            throw new Error(
                `Arquivo muito grande: ${this.formatBytes(metadata.sizeBytes)} ` +
                `(máximo: ${this.maxFileSize}MB)`
            );
        }

        // Valida extensão
        const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'tiff'];
        if (!validateFileExtension(metadata.originalFilename, allowedExtensions)) {
            throw new Error(`Extensão não permitida: .${metadata.extension}`);
        }

        // Valida nome do arquivo
        if (!metadata.originalFilename || metadata.originalFilename.trim() === '') {
            throw new Error('Nome de arquivo inválido');
        }
    }

    /**
     * Verifica integridade básica do arquivo
     */
    async checkIntegrity(file) {
        try {
            // Verifica se é possível ler o arquivo
            if (!file || file.size === 0) {
                return {
                    valid: false,
                    reason: 'Arquivo vazio'
                };
            }

            // Para PDF, verifica header básico
            if (file.name.toLowerCase().endsWith('.pdf')) {
                const buffer = await this.readFirstBytes(file, 5);
                const header = buffer.toString('utf-8', 0, 5);

                if (header !== '%PDF-') {
                    return {
                        valid: false,
                        reason: 'Header PDF inválido'
                    };
                }
            }

            return { valid: true };

        } catch (error) {
            return {
                valid: false,
                reason: `Erro ao verificar integridade: ${error.message}`
            };
        }
    }

    /**
     * Lê primeiros bytes de um arquivo
     */
    async readFirstBytes(file, numBytes) {
        try {
            if (file.arrayBuffer) {
                const arrayBuffer = await file.arrayBuffer();
                return Buffer.from(arrayBuffer.slice(0, numBytes));
            }

            if (Buffer.isBuffer(file)) {
                return file.slice(0, numBytes);
            }

            return Buffer.alloc(0);

        } catch (error) {
            logger.warn(AGENTE_NOME, `Não foi possível ler bytes: ${error.message}`);
            return Buffer.alloc(0);
        }
    }

    /**
     * Extrai extensão do arquivo
     */
    extractExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    /**
     * Formata bytes para leitura humana
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

export default UploadLayer;
