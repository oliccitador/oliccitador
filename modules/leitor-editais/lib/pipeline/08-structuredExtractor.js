/**
 * 📑 ETAPA 8 - STRUCTURED EXTRACTOR (Pré-Análise)
 * 
 * Responsável por:
 * - Extrair metadados básicos (órgão, processo, datas)
 * - Detectar itens/lotes automaticamente
 * - Identificar seções importantes
 * 
 * REGRA: NÃO INTERPRETA - apenas estrutura para os agentes
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENTE_NOME = 'StructuredExtractor';

class StructuredExtractor {
    constructor() {
        this.patterns = {
            processo: /processo\s*n[º°]?\s*(\d+[\.\-\/]\d+[\.\-\/]?\d*)/i,
            orgao: /(?:órgão|orgao|entidade)[\s:]*([^\n]{10,100})/i,
            modalidade: /(pregão|concorrência|tomada de preços|convite|concurso|leilão|diálogo competitivo)/i,

            datas: {
                abertura: /(?:abertura|sessão pública)[\s:]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
                entrega: /(?:entrega|envio).*(?:proposta|documentos)[\s:]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i
            },

            item: /^\s*(?:item|lote)\s*n?[º°]?\s*(\d+)[\s\-:]+(.+)/im
        };
    }

    /**
     * Extrai estruturas básicas do CORPO_INTEGRADO
     */
    async extract(corpoIntegrado) {
        try {
            logger.info(AGENTE_NOME, 'Extraindo estruturas pré-análise');

            const texto = corpoIntegrado.textoCompleto;

            // Extrai metadados
            const metadados = {
                orgao: this.extractPattern(texto, this.patterns.orgao) || 'SEM DADOS NO ARQUIVO',
                processo: this.extractPattern(texto, this.patterns.processo) || 'SEM DADOS NO ARQUIVO',
                modalidade: this.extractPattern(texto, this.patterns.modalidade) || 'SEM DADOS NO ARQUIVO',

                datas: {
                    abertura: this.extractDate(texto, this.patterns.datas.abertura),
                    entrega: this.extractDate(texto, this.patterns.datas.entrega)
                }
            };

            // Detecta itens/lotes
            const itens = this.detectItems(corpoIntegrado);

            // Identifica seções importantes
            const secoesImportantes = this.identifyImportantSections(corpoIntegrado);

            logger.info(
                AGENTE_NOME,
                `Extraídos: ${itens.length} itens, ${secoesImportantes.length} seções importantes`
            );

            return {
                metadados,
                itens,
                secoesImportantes,
                status: 'success'
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro na extração estruturada', { error: error.message });

            return {
                metadados: {},
                itens: [],
                secoesImportantes: [],
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Extrai padrão usando regex
     */
    extractPattern(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }

    /**
     * Extrai e parse data
     */
    extractDate(text, pattern) {
        const dateStr = this.extractPattern(text, pattern);

        if (!dateStr) return null;

        try {
            // Converte DD/MM/YYYY ou DD-MM-YYYY para ISO
            const parts = dateStr.split(/[\/-]/);
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
                const year = parseInt(parts[2]);

                const fullYear = year < 100 ? 2000 + year : year;

                return new Date(fullYear, month, day).toISOString();
            }
        } catch (error) {
            logger.warn(AGENTE_NOME, `Erro ao parsear data: ${dateStr}`);
        }

        return null;
    }

    /**
     * Detecta itens/lotes do edital
     */
    detectItems(corpoIntegrado) {
        const items = [];
        const texto = corpoIntegrado.textoCompleto;

        // Busca por padrões de item
        const itemRegex = /(?:^|\n)\s*(?:item|lote)\s*n?[º°]?\s*(\d+)[\s\-:]+([^\n]{10,200})/gi;
        let match;

        while ((match = itemRegex.exec(texto)) !== null) {
            const itemNum = parseInt(match[1]);
            const descricao = match[2].trim();

            // Encontra linha global correspondente
            const charPos = match.index;
            const line = corpoIntegrado.globalLines.find(l =>
                l.charStart <= charPos && l.charEnd >= charPos
            );

            items.push({
                numero: itemNum,
                descricao,
                globalLine: line?.lineNumber || 0,
                charStart: match.index,
                charEnd: match.index + match[0].length
            });
        }

        return items;
    }

    /**
     * Identifica seções importantes do edital
     */
    identifyImportantSections(corpoIntegrado) {
        const sections = [];
        const importantKeywords = [
            'habilitação',
            'capacidade técnica',
            'atestado',
            'prazo',
            'entrega',
            'pagamento',
            'penalidades',
            'garantia',
            'recursos',
            'impugnação'
        ];

        for (const segment of corpoIntegrado.segments) {
            const structures = segment.structures || {};
            const allStructures = [
                ...(structures.chapters || []),
                ...(structures.sections || []),
                ...(structures.articles || [])
            ];

            for (const struct of allStructures) {
                const title = struct.title || '';

                for (const keyword of importantKeywords) {
                    if (title.toLowerCase().includes(keyword)) {
                        sections.push({
                            keyword,
                            title,
                            type: struct.type,
                            globalLineStart: struct.globalLineStart,
                            document: segment.documentName
                        });
                        break;
                    }
                }
            }
        }

        return sections;
    }
}

export default StructuredExtractor;
