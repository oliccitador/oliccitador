/**
 * 🔄 ETAPA 6 - DEDUPLICATOR
 * 
 * Responsável por:
 * - Detectar documentos duplicados ou versões diferentes
 * - Camada 1: Hash SHA-256 para duplicados exatos
 * - Camada 2: Similaridade (cosine) ≥0.95 + length_ratio ≥0.9
 * - Manter melhor versão baseado em:
 *   1. Qualidade OCR
 *   2. Completude (páginas/linhas)
 *   3. Sinais de versão
 *   4. Timestamp
 */

import crypto from 'crypto';
import { getLogger } from '../services/logger.js';
import { PIPELINE_CONSTANTS } from '../types/pipeline-schemas.js';

const logger = getLogger();
const AGENTE_NOME = 'Deduplicator';

class Deduplicator {
    constructor() {
        this.similarityThreshold = PIPELINE_CONSTANTS.SIMILARITY_THRESHOLD;
        this.lengthRatioThreshold = PIPELINE_CONSTANTS.LENGTH_RATIO_THRESHOLD;
    }

    /**
     * Deduplica lista de documentos processados
     */
    async deduplicate(indexedDocs) {
        try {
            logger.info(AGENTE_NOME, `Deduplicando ${indexedDocs.length} documento(s)`);

            if (indexedDocs.length < 2) {
                logger.info(AGENTE_NOME, 'Menos de 2 documentos - não há o que deduplic ar');
                return {
                    uniqueDocs: indexedDocs,
                    duplicatesRemoved: [],
                    status: 'success'
                };
            }

            // Gera fingerprints para todos os documentos
            const docsWithFingerprints = indexedDocs.map(doc => ({
                ...doc,
                fingerprint: this.generateFingerprint(doc)
            }));

            // Agrupa candidatos a duplicatas
            const duplicateGroups = this.findDuplicateGroups(docsWithFingerprints);

            // Para cada grupo, mantém apenas o melhor
            const uniqueDocs = [];
            const duplicatesRemoved = [];

            const processedIds = new Set();

            for (const doc of docsWithFingerprints) {
                if (processedIds.has(doc.documentId)) {
                    continue; // Já processado como duplicata
                }

                // Verifica se faz parte de algum grupo de duplicatas
                const group = duplicateGroups.find(g =>
                    g.some(d => d.documentId === doc.documentId)
                );

                if (group) {
                    // Encontra o melhor documento do grupo
                    const best = this.selectBestDocument(group);
                    uniqueDocs.push(best);

                    // Marca duplicatas removidas
                    group.forEach(d => {
                        processedIds.add(d.documentId);

                        if (d.documentId !== best.documentId) {
                            duplicatesRemoved.push({
                                keptDoc: best.documentId,
                                keptDocName: best.metadata?.originalFilename || best.documentId,
                                removedDoc: d.documentId,
                                removedDocName: d.metadata?.originalFilename || d.documentId,
                                similarity: d.comparisonScore || 1.0,
                                reason: d.duplicateReason || 'Hash idêntico'
                            });
                        }
                    });
                } else {
                    // Não é duplicata de ninguém
                    uniqueDocs.push(doc);
                    processedIds.add(doc.documentId);
                }
            }

            logger.info(
                AGENTE_NOME,
                `Deduplicação concluída: ${uniqueDocs.length} únicos, ` +
                `${duplicatesRemoved.length} removidos`
            );

            return {
                uniqueDocs,
                duplicatesRemoved,
                status: 'success'
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro na deduplicação', { error: error.message });

            return {
                uniqueDocs: indexedDocs,
                duplicatesRemoved: [],
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Gera fingerprint de um documento
     */
    generateFingerprint(doc) {
        const text = doc.fullTextNormalized || doc.fullTextRaw || '';

        // Normaliza para fingerprint
        const normalized = text
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\sáéíóúâêôãõç]/g, '')
            .trim();

        // Gera hash SHA-256
        const hash = crypto.createHash('sha256').update(normalized).digest('hex');

        // Amostra para comparação de similaridade
        const sample = normalized.substring(0, 2000);

        // SimHash simplificado (hashcode de palavras)
        const simhash = this.generateSimHash(normalized);

        return {
            hash,
            sample,
            simhash,
            length: normalized.length,
            wordCount: normalized.split(/\s+/).length
        };
    }

    /**
     * Gera SimHash simplificado para detecção rápida
     */
    generateSimHash(text) {
        const words = text.split(/\s+/).slice(0, 100); // Primeiras 100 palavras

        let hash = 0;
        for (const word of words) {
            for (let i = 0; i < word.length; i++) {
                hash = ((hash << 5) - hash) + word.charCodeAt(i);
                hash = hash & hash; // Convert to 32-bit integer
            }
        }

        return hash.toString(16);
    }

    /**
     * Encontra grupos de documentos duplicados
     */
    findDuplicateGroups(docs) {
        const groups = [];
        const processedPairs = new Set();

        for (let i = 0; i < docs.length; i++) {
            for (let j = i + 1; j < docs.length; j++) {
                const doc1 = docs[i];
                const doc2 = docs[j];

                const pairKey = [doc1.documentId, doc2.documentId].sort().join('|');
                if (processedPairs.has(pairKey)) continue;

                processedPairs.add(pairKey);

                const comparison = this.compareDocuments(doc1, doc2);

                if (comparison.isDuplicate) {
                    // Adiciona score de comparação para uso posterior
                    doc1.comparisonScore = comparison.similarity;
                    doc2.comparisonScore = comparison.similarity;
                    doc1.duplicateReason = comparison.reason;
                    doc2.duplicateReason = comparison.reason;

                    // Procura grupo existente
                    let existingGroup = groups.find(g =>
                        g.some(d => d.documentId === doc1.documentId || d.documentId === doc2.documentId)
                    );

                    if (existingGroup) {
                        // Adiciona ao grupo existente
                        if (!existingGroup.some(d => d.documentId === doc1.documentId)) {
                            existingGroup.push(doc1);
                        }
                        if (!existingGroup.some(d => d.documentId === doc2.documentId)) {
                            existingGroup.push(doc2);
                        }
                    } else {
                        // Cria novo grupo
                        groups.push([doc1, doc2]);
                    }
                }
            }
        }

        logger.info(AGENTE_NOME, `Encontrados ${groups.length} grupo(s) de duplicatas`);

        return groups;
    }

    /**
     * Compara dois documentos e determina se são duplicatas
     */
    compareDocuments(doc1, doc2) {
        const fp1 = doc1.fingerprint;
        const fp2 = doc2.fingerprint;

        // Camada 1: Hash idêntico (duplicata exata)
        if (fp1.hash === fp2.hash) {
            return {
                isDuplicate: true,
                duplicateType: 'exact',
                similarity: 1.0,
                lengthRatio: 1.0,
                reason: 'Hash SHA-256 idêntico'
            };
        }

        // Camada 2: Similaridade cosine + length ratio
        const similarity = this.calculateCosineSimilarity(fp1.sample, fp2.sample);
        const lengthRatio = Math.min(fp1.length, fp2.length) / Math.max(fp1.length, fp2.length);

        const isProbableDuplicate =
            similarity >= this.similarityThreshold &&
            lengthRatio >= this.lengthRatioThreshold;

        if (isProbableDuplicate) {
            return {
                isDuplicate: true,
                duplicateType: 'probable',
                similarity,
                lengthRatio,
                reason: `Similaridade ${(similarity * 100).toFixed(1)}%, ` +
                    `Razão de tamanho ${(lengthRatio * 100).toFixed(1)}%`
            };
        }

        return {
            isDuplicate: false,
            similarity,
            lengthRatio,
            reason: 'Documentos distintos'
        };
    }

    /**
     * Calcula similaridade cosine entre dois textos
     */
    calculateCosineSimilarity(text1, text2) {
        // Tokeniza
        const words1 = text1.split(/\s+/);
        const words2 = text2.split(/\s+/);

        // Cria vocabulário
        const vocab = new Set([...words1, ...words2]);

        // Cria vetores de frequência
        const vec1 = this.createFrequencyVector(words1, vocab);
        const vec2 = this.createFrequencyVector(words2, vocab);

        // Calcula produto escalar
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (const word of vocab) {
            const freq1 = vec1[word] || 0;
            const freq2 = vec2[word] || 0;

            dotProduct += freq1 * freq2;
            mag1 += freq1 * freq1;
            mag2 += freq2 * freq2;
        }

        // Calcula cosine
        const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);

        if (magnitude === 0) return 0;

        return dotProduct / magnitude;
    }

    /**
     * Cria vetor de frequência de palavras
     */
    createFrequencyVector(words, vocab) {
        const vector = {};

        for (const word of words) {
            if (vocab.has(word)) {
                vector[word] = (vector[word] || 0) + 1;
            }
        }

        return vector;
    }

    /**
     * Seleciona melhor documento de um grupo de duplicatas
     */
    selectBestDocument(docs) {
        if (docs.length === 1) return docs[0];

        // Calcula score para cada documento
        const scored = docs.map(doc => ({
            doc,
            score: this.calculateQualityScore(doc)
        }));

        // Ordena por score (maior = melhor)
        scored.sort((a, b) => b.score - a.score);

        const best = scored[0].doc;

        logger.info(
            AGENTE_NOME,
            `Melhor documento selecionado: ${best.metadata?.originalFilename || best.documentId} ` +
            `(score: ${scored[0].score.toFixed(2)})`
        );

        return best;
    }

    /**
     * Calcula score de qualidade de um documento
     */
    calculateQualityScore(doc) {
        let score = 0;

        // 1. Qualidade OCR (peso 40%)
        const ocrQuality = doc.metadata?.ocrQualityAvg || 0;
        score += (ocrQuality / 100) * 40;

        // 2. Completude - páginas e linhas (peso 30%)
        const pages = doc.metadata?.totalPages || 0;
        const lines = doc.globalLines?.length || 0;
        const completeness = Math.min((pages * 50 + lines) / 200, 1);
        score += completeness * 30;

        // 3. Sinais de versão mais recente (peso 20%)
        const filename = doc.metadata?.originalFilename || '';
        const versionScore = this.detectVersionSignals(filename);
        score += versionScore * 20;

        // 4. Timestamp (peso 10%) - mais recente = melhor
        const timestamp = new Date(doc.metadata?.uploadTimestamp || 0).getTime();
        const recencyScore = timestamp > 0 ? 1 : 0;
        score += recencyScore * 10;

        return score;
    }

    /**
     * Detecta sinais de versão mais recente no filename
     */
    detectVersionSignals(filename) {
        const lower = filename.toLowerCase();

        // Sinais positivos (versão mais recente)
        const positiveSignals = [
            /v\d+/i, // v2, v3, etc
            /versao|versão/i,
            /final/i,
            /atualizado|atualizada/i,
            /revisado|revisada/i,
            /corrigido|corrigida/i,
            /novo|nova/i
        ];

        let score = 0;
        for (const pattern of positiveSignals) {
            if (pattern.test(lower)) {
                score += 0.2;
            }
        }

        // Sinais negativos (versão antiga)
        const negativeSignals = [
            /rascunho/i,
            /draft/i,
            /preliminar/i,
            /antigo|antiga/i
        ];

        for (const pattern of negativeSignals) {
            if (pattern.test(lower)) {
                score -= 0.3;
            }
        }

        return Math.max(0, Math.min(1, score));
    }
}

export default Deduplicator;
