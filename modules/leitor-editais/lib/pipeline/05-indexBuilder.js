/**
 * 📇 ETAPA 5 - INDEX BUILDER
 * 
 * Responsável por:
 * - Numerar linhas globalmente com char_start/char_end
 * - Detectar hierarquia (capítulos, seções, subitens)
 * - Identificar blocos de texto
 * - Detectar tabelas
 * - Montar estrutura navegável
 * 
 * CRÍTICO para construção do CORPO_INTEGRADO
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENTE_NOME = 'IndexBuilder';

class IndexBuilder {
    constructor() {
        this.hierarchyPatterns = {
            // Capítulos: "CAPÍTULO I", "CAPÍTULO II", etc
            chapter: /^CAP[ÍI]TULO\s+([IVX]+|\d+)/i,

            // Seções: "SEÇÃO I", "1.", "1.1", etc
            section: /^SE[ÇC][ÃA]O\s+([IVX]+|\d+)|^(\d+)\.\s+[A-Z]/i,

            // Artigos: "Art. 1º", "Artigo 1", etc
            article: /^Art\.\s*(\d+)º?|^Artigo\s+(\d+)/i,

            // Itens: "1)", "a)", "I)", etc
            item: /^(\d+|[a-z]|[IVX]+)\)\s+/i,

            // Subitens: "1.1)", "a.1)", etc
            subitem: /^(\d+\.\d+|[a-z]\.\d+)\)\s+/i
        };
    }

    /**
     * Constrói índice global de um documento normalizado
     */
    async build(normalizedDoc) {
        try {
            logger.info(AGENTE_NOME, `Construindo índice para documento ${normalizedDoc.documentId}`);

            const fullText = normalizedDoc.fullTextNormalized;

            // Cria array de linhas globais com posições
            const globalLines = this.buildGlobalLines(
                normalizedDoc.pages,
                normalizedDoc.documentId
            );

            // Detecta estruturas hierárquicas
            const structures = this.detectStructures(globalLines);

            // Detecta tabelas
            const tables = this.detectTables(globalLines);

            logger.info(
                AGENTE_NOME,
                `Índice construído: ${globalLines.length} linhas, ` +
                `${structures.chapters.length} capítulos, ` +
                `${structures.sections.length} seções, ` +
                `${tables.length} tabelas`
            );

            return {
                documentId: normalizedDoc.documentId,
                globalLines,
                structures: {
                    ...structures,
                    tables
                },
                metadata: {
                    totalLines: globalLines.length,
                    totalChars: fullText.length,
                    totalStructures: structures.chapters.length + structures.sections.length,
                    totalTables: tables.length
                },
                status: 'success'
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro ao construir índice', { error: error.message });

            return {
                documentId: normalizedDoc.documentId,
                globalLines: [],
                structures: { chapters: [], sections: [], items: [] },
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Constrói array de linhas globais com char positions
     */
    buildGlobalLines(pages, documentId) {
        const globalLines = [];
        let lineNumber = 1;
        let charPosition = 0;

        for (const page of pages) {
            const lines = page.linesNormalized || page.lines || [];

            for (let localLineIndex = 0; localLineIndex < lines.length; localLineIndex++) {
                const lineText = lines[localLineIndex];
                const charStart = charPosition;
                const charEnd = charPosition + lineText.length;

                globalLines.push({
                    lineNumber,
                    text: lineText,
                    charStart,
                    charEnd,
                    sourceDocId: documentId,
                    sourcePage: page.pageNumber,
                    localLineInPage: localLineIndex + 1
                });

                lineNumber++;
                charPosition = charEnd + 1; // +1 para o '\n'
            }

            // Adiciona quebra de página
            charPosition += 1; // '\n' entre páginas
        }

        return globalLines;
    }

    /**
     * Detecta estruturas hierárquicas (capítulos, seções, artigos)
     */
    detectStructures(globalLines) {
        const structures = {
            chapters: [],
            sections: [],
            articles: [],
            items: [],
            subitems: []
        };

        for (let i = 0; i < globalLines.length; i++) {
            const line = globalLines[i];
            const text = line.text.trim();

            // Detecta capítulos
            if (this.hierarchyPatterns.chapter.test(text)) {
                structures.chapters.push({
                    type: 'chapter',
                    level: 1,
                    number: this.extractNumber(text, this.hierarchyPatterns.chapter),
                    title: text,
                    globalLineStart: line.lineNumber,
                    charStart: line.charStart,
                    content: text
                });
            }

            // Detecta seções
            else if (this.hierarchyPatterns.section.test(text)) {
                structures.sections.push({
                    type: 'section',
                    level: 2,
                    number: this.extractNumber(text, this.hierarchyPatterns.section),
                    title: text,
                    globalLineStart: line.lineNumber,
                    charStart: line.charStart,
                    content: text
                });
            }

            // Detecta artigos
            else if (this.hierarchyPatterns.article.test(text)) {
                structures.articles.push({
                    type: 'article',
                    level: 3,
                    number: this.extractNumber(text, this.hierarchyPatterns.article),
                    title: text,
                    globalLineStart: line.lineNumber,
                    charStart: line.charStart,
                    content: text
                });
            }

            // Detecta subitens
            else if (this.hierarchyPatterns.subitem.test(text)) {
                structures.subitems.push({
                    type: 'subitem',
                    level: 5,
                    number: this.extractNumber(text, this.hierarchyPatterns.subitem),
                    title: text,
                    globalLineStart: line.lineNumber,
                    charStart: line.charStart,
                    content: text
                });
            }

            // Detecta itens
            else if (this.hierarchyPatterns.item.test(text)) {
                structures.items.push({
                    type: 'item',
                    level: 4,
                    number: this.extractNumber(text, this.hierarchyPatterns.item),
                    title: text,
                    globalLineStart: line.lineNumber,
                    charStart: line.charStart,
                    content: text
                });
            }
        }

        // Calcula globalLineEnd para cada estrutura
        this.calculateLineRanges(structures, globalLines.length);

        return structures;
    }

    /**
     * Extrai número de uma estrutura usando regex
     */
    extractNumber(text, pattern) {
        const match = text.match(pattern);
        if (match) {
            // Retorna primeiro grupo capturado não-null
            return match.slice(1).find(g => g !== undefined) || '';
        }
        return '';
    }

    /**
     * Calcula intervalo de linhas para cada estrutura
     */
    calculateLineRanges(structures, totalLines) {
        // Combina todas as estruturas
        const allStructures = [
            ...structures.chapters,
            ...structures.sections,
            ...structures.articles,
            ...structures.items,
            ...structures.subitems
        ];

        // Ordena por linha inicial
        allStructures.sort((a, b) => a.globalLineStart - b.globalLineStart);

        // Calcula linha final de cada estrutura
        for (let i = 0; i < allStructures.length; i++) {
            const current = allStructures[i];
            const next = allStructures[i + 1];

            if (next) {
                current.globalLineEnd = next.globalLineStart - 1;
            } else {
                current.globalLineEnd = totalLines;
            }

            current.charEnd = current.charStart + (current.content?.length || 0);
        }
    }

    /**
     * Detecta tabelas no texto
     */
    detectTables(globalLines) {
        const tables = [];
        let inTable = false;
        let tableStart = null;
        let tableLines = [];

        for (let i = 0; i < globalLines.length; i++) {
            const line = globalLines[i];
            const text = line.text;

            // Heurística para detectar linhas de tabela:
            // - Múltiplos separadores (|, \t, espaços repetidos)
            // - Padrão numérico consistente
            const isTableLine = this.looksLikeTableLine(text);

            if (isTableLine && !inTable) {
                // Início de tabela
                inTable = true;
                tableStart = line.lineNumber;
                tableLines = [line];
            } else if (isTableLine && inTable) {
                // Continuação de tabela
                tableLines.push(line);
            } else if (!isTableLine && inTable) {
                // Fim de tabela
                inTable = false;

                if (tableLines.length >= 2) { // Mínimo 2 linhas para ser tabela
                    tables.push({
                        type: 'table',
                        globalLineStart: tableStart,
                        globalLineEnd: tableLines[tableLines.length - 1].lineNumber,
                        charStart: tableLines[0].charStart,
                        charEnd: tableLines[tableLines.length - 1].charEnd,
                        rowCount: tableLines.length,
                        content: tableLines.map(l => l.text).join('\n')
                    });
                }

                tableLines = [];
            }
        }

        // Tabela que vai até o fim
        if (inTable && tableLines.length >= 2) {
            tables.push({
                type: 'table',
                globalLineStart: tableStart,
                globalLineEnd: tableLines[tableLines.length - 1].lineNumber,
                charStart: tableLines[0].charStart,
                charEnd: tableLines[tableLines.length - 1].charEnd,
                rowCount: tableLines.length,
                content: tableLines.map(l => l.text).join('\n')
            });
        }

        return tables;
    }

    /**
     * Verifica se linha parece ser de tabela
     */
    looksLikeTableLine(text) {
        if (!text || text.trim().length === 0) return false;

        // Conta separadores
        const pipeCount = (text.match(/\|/g) || []).length;
        const tabCount = (text.match(/\t/g) || []).length;
        const multiSpaceCount = (text.match(/\s{2,}/g) || []).length;

        // Se tem muitos separadores, provavelmente é tabela
        if (pipeCount >= 2 || tabCount >= 2 || multiSpaceCount >= 3) {
            return true;
        }

        // Se tem padrão de item + número + unidade + valor
        // Ex: "1 | Cadeira | UN | 50 | R$ 100,00"
        const tablePattern = /^\d+[\s|]\w+[\s|]\w+[\s|]\d+/;
        if (tablePattern.test(text)) {
            return true;
        }

        return false;
    }
}

export default IndexBuilder;
