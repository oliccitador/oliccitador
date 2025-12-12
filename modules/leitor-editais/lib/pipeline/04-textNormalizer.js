/**
 * 🧹 ETAPA 4 - TEXT NORMALIZER
 * 
 * Responsável por:
 * - Remover ruídos visuais e textuais
 * - Remover cabeçalhos e rodapés repetidos
 * - Padronizar acentuação, quebras de linha, espaçamento
 * - Normalizar estrutura de listas e numeração
 * - Limpar artefatos de escaneamento
 */

import { getLogger } from '../services/logger.js';
import { PIPELINE_CONSTANTS } from '../types/pipeline-schemas.js';

const logger = getLogger();
const AGENTE_NOME = 'TextNormalizer';

class TextNormalizer {
    constructor() {
        this.maxRepeatedChars = PIPELINE_CONSTANTS.MAX_REPEATED_CHARS || 3;
    }

    /**
     * Normaliza todas as páginas de um documento
     */
    async normalize(ocrResult) {
        try {
            logger.info(AGENTE_NOME, `Normalizando documento ${ocrResult.documentId}`);

            // Detecta cabeçalhos e rodapés repetidos
            const repeatedPatterns = this.detectRepeatedPatterns(ocrResult.pages);

            // Normaliza cada página
            const normalizedPages = ocrResult.pages.map((page, index) => {
                const normalized = this.normalizePage(page, repeatedPatterns);

                return {
                    ...page,
                    textNormalized: normalized.text,
                    linesNormalized: normalized.lines,
                    removedPatterns: normalized.removedPatterns
                };
            });

            // Concatena texto normalizado completo
            const fullTextNormalized = normalizedPages
                .map(p => p.textNormalized)
                .join('\n\n');

            logger.info(
                AGENTE_NOME,
                `Normalização concluída - ${normalizedPages.length} página(s)`
            );

            return {
                documentId: ocrResult.documentId,
                pages: normalizedPages,
                fullTextNormalized,
                repeatedPatternsRemoved: repeatedPatterns,
                status: 'success'
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro na normalização', { error: error.message });

            return {
                ...ocrResult,
                fullTextNormalized: ocrResult.fullTextRaw,
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Detecta padrões repetidos (cabeçalhos/rodapés)
     */
    detectRepeatedPatterns(pages) {
        if (pages.length < 3) {
            return []; // Precisa de pelo menos 3 páginas para detectar padrões
        }

        const patterns = [];

        // Analisa primeiras linhas (possíveis cabeçalhos)
        const firstLines = pages.map(p => p.lines[0] || '').filter(l => l.trim().length > 0);
        const headerPattern = this.findCommonPattern(firstLines);

        if (headerPattern) {
            patterns.push({
                type: 'header',
                pattern: headerPattern,
                occurrences: firstLines.filter(l => this.matchesPattern(l, headerPattern)).length
            });
        }

        // Analisa últimas linhas (possíveis rodapés)
        const lastLines = pages.map(p => p.lines[p.lines.length - 1] || '').filter(l => l.trim().length > 0);
        const footerPattern = this.findCommonPattern(lastLines);

        if (footerPattern) {
            patterns.push({
                type: 'footer',
                pattern: footerPattern,
                occurrences: lastLines.filter(l => this.matchesPattern(l, footerPattern)).length
            });
        }

        // Detecta numeração de páginas
        const pageNumberPattern = this.detectPageNumbers(pages);
        if (pageNumberPattern) {
            patterns.push(pageNumberPattern);
        }

        logger.info(AGENTE_NOME, `Detectados ${patterns.length} padrão(ões) repetido(s)`);

        return patterns;
    }

    /**
     * Encontra padrão comum em array de strings
     */
    findCommonPattern(strings) {
        if (strings.length < 3) return null;

        // Agrupa strings similares
        const groups = {};

        strings.forEach(str => {
            const normalized = str.trim().toLowerCase();

            if (normalized.length > 5) {
                if (!groups[normalized]) {
                    groups[normalized] = 0;
                }
                groups[normalized]++;
            }
        });

        // Encontra padrão mais frequente
        const entries = Object.entries(groups);
        if (entries.length === 0) return null;

        entries.sort((a, b) => b[1] - a[1]);
        const [pattern, count] = entries[0];

        // Considera padrão se aparece em pelo menos 50% das páginas
        if (count >= strings.length * 0.5) {
            return pattern;
        }

        return null;
    }

    /**
     * Verifica se linha corresponde ao padrão
     */
    matchesPattern(line, pattern) {
        const normalized = line.trim().toLowerCase();
        return normalized === pattern || normalized.includes(pattern);
    }

    /**
     * Detecta numeração de páginas
     */
    detectPageNumbers(pages) {
        // Padrões comuns: "Página 1", "Pág. 1", "1/10", "1 de 10", etc.
        const patterns = [
            /p[aá]gina\s*\d+/i,
            /p[aá]g\.\s*\d+/i,
            /\d+\s*\/\s*\d+/,
            /\d+\s+de\s+\d+/i
        ];

        let detectedPattern = null;
        let maxOccurrences = 0;

        for (const pattern of patterns) {
            let occurrences = 0;

            pages.forEach(page => {
                const text = page.textRaw || '';
                if (pattern.test(text)) {
                    occurrences++;
                }
            });

            if (occurrences > maxOccurrences && occurrences >= pages.length * 0.5) {
                maxOccurrences = occurrences;
                detectedPattern = pattern;
            }
        }

        if (detectedPattern) {
            return {
                type: 'page-number',
                pattern: detectedPattern.source,
                occurrences: maxOccurrences
            };
        }

        return null;
    }

    /**
     * Normaliza uma página individual
     */
    normalizePage(page, repeatedPatterns) {
        let text = page.textRaw || '';
        const removedPatterns = [];

        // Remove padrões repetidos
        for (const patternInfo of repeatedPatterns) {
            if (patternInfo.type === 'header' || patternInfo.type === 'footer') {
                const before = text.length;
                text = text.replace(new RegExp(this.escapeRegex(patternInfo.pattern), 'gi'), '');

                if (text.length < before) {
                    removedPatterns.push(patternInfo.type);
                }
            } else if (patternInfo.type === 'page-number') {
                const before = text.length;
                text = text.replace(new RegExp(patternInfo.pattern, 'gi'), '');

                if (text.length < before) {
                    removedPatterns.push('page-number');
                }
            }
        }

        // Aplica normalizações gerais
        text = this.normalizeText(text);

        // Cria array de linhas normalizadas
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        return {
            text,
            lines,
            removedPatterns
        };
    }

    /**
     * Normaliza texto (espaçamento, acentos, caracteres, etc)
     */
    normalizeText(text) {
        if (!text) return '';

        // 1. Remove caracteres null e de controle
        text = text.replace(/[\x00-\x1F\x7F]/g, '');

        // 2. Normaliza quebras de linha
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 3. Remove quebras de linha excessivas (máximo 2 seguidas)
        text = text.replace(/\n{3,}/g, '\n\n');

        // 4. Normaliza tabs e espaços
        text = text.replace(/\t/g, '    '); // Tab → 4 espaços
        text = text.replace(/[ \u00A0]{2,}/g, ' '); // Múltiplos espaços → 1 espaço

        // 5. Remove espaços no início e fim de cada linha
        text = text.split('\n').map(line => line.trim()).join('\n');

        // 6. Normaliza acentuação (NFD → NFC)
        text = text.normalize('NFC');

        // 7. Remove caracteres repetidos excessivos (ex: "aaaaa" → "aaa")
        text = text.replace(/(.)\1{3,}/g, (match, char) => {
            return char.repeat(this.maxRepeatedChars);
        });

        // 8. Normaliza pontuação
        text = text.replace(/\s+([.,;:!?])/g, '$1'); // Remove espaço antes de pontuação
        text = text.replace(/([.,;:!?])([^\s])/g, '$1 $2'); // Adiciona espaço depois de pontuação

        // 9. Normaliza aspas e travessões
        text = text.replace(/[""]/g, '"');
        text = text.replace(/['']/g, "'");
        text = text.replace(/—/g, '-');

        // 10. Remove artefatos comuns de OCR
        const artifacts = [
            /\|\s*/g, // Barras verticais soltas
            /_{3,}/g, // Underscores repetidos
            /={3,}/g, // Igual repetidos
            /\*{3,}/g, // Asteriscos repetidos
        ];

        for (const artifact of artifacts) {
            text = text.replace(artifact, '');
        }

        // 11. Normaliza listas e numeração
        text = this.normalizeLists(text);

        // 12. Remove linhas muito curtas (provável ruído)
        const lines = text.split('\n');
        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            // Mantém linhas vazias, numeração e linhas com mais de 2 caracteres
            return trimmed.length === 0 ||
                /^\d+[\.)]\s*$/.test(trimmed) ||
                trimmed.length > 2;
        });
        text = filteredLines.join('\n');

        return text.trim();
    }

    /**
     * Normaliza listas e numeração
     */
    normalizeLists(text) {
        // Padroniza numeração de itens
        // "1 )" → "1)"
        // "1." → "1."
        // "a )" → "a)"

        text = text.replace(/(\d+|[a-z])\s+\)/g, '$1)');
        text = text.replace(/(\d+|[a-z])\s+\./g, '$1.');

        // Normaliza bullets
        text = text.replace(/[•◦▪▫]/g, '•');

        return text;
    }

    /**
     * Escapa caracteres especiais de regex
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export default TextNormalizer;
