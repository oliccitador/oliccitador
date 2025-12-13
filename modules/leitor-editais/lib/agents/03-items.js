/**
 * 🏷️ AGENTE 3 - ITEM CLASSIFIER (Conforme DEV DOC 3/8)
 * 
 * Responsável por:
 * - Identificar itens/lotes do CORPO_INTEGRADO
 * - Transcrever descrição literal, unidade, quantidade
 * - Detectar marca/norma/serviço acoplado
 * - Classificar por perfil empresa: ELEGÍVEL/DÚVIDA/INCOMPATÍVEL
 * - RASTREABILIDADE COMPLETA de todos os achados
 * 
 * ENTRADA: CORPO_INTEGRADO + companyProfile (opcional)
 * SAÍDA: Envelope padrão com evidências completas
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENT_ID = 'AGENT_03';

class ItemClassifier {
    constructor() {
        this.cnaeCategoryHeuristics = this.loadCNAEHeuristics();
    }

    /**
     * Processa CORPO_INTEGRADO e extrai/classifica itens
     * @param {Object} corpoIntegrado - CORPO_INTEGRADO do pipeline
     * @param {Object} companyProfile - { cnaes: [], porte: 'ME|EPP|DEMAIS' }
     * @returns {Object} Envelope padrão DEV DOC 3/8
     */
    async process(corpoIntegrado, companyProfile = null) {
        const startTime = Date.now();

        try {
            logger.startAgent(AGENT_ID);
            logger.info(AGENT_ID, 'Extraindo e classificando itens');

            if (!corpoIntegrado || !corpoIntegrado.textoCompleto) {
                throw new Error('CORPO_INTEGRADO inválido');
            }

            // Extrai itens do corpus
            const { items, evidence } = await this.extractItems(corpoIntegrado);

            // Classifica se companyProfile fornecido
            if (companyProfile && companyProfile.cnaes) {
                this.classifyItems(items, companyProfile, evidence);
            }

            // Calcula resumo
            const resumo = this.calculateSummary(items);

            // Gera alerts se necessário
            const alerts = this.generateAlerts(items, companyProfile);

            // Quality flags
            const quality_flags = {
                needs_review: items.length === 0,
                low_ocr_quality: false, // Herda do pipeline se necessário
                missing_sections: items.length === 0 ? ['ITENS'] : []
            };

            const runTime = Date.now() - startTime;

            logger.info(AGENT_ID, `${items.length} itens extraídos em ${runTime}ms`);

            return {
                agent_id: AGENT_ID,
                status: items.length > 0 ? 'ok' : 'partial',
                dados: {
                    itens: items,
                    resumo
                },
                alerts,
                evidence,
                metadata: {
                    run_ms: runTime,
                    items_found: items.length,
                    sections_hit: this.getSectionsHit(corpoIntegrado),
                    confidence: items.length > 0 ? 0.9 : 0.5
                },
                quality_flags
            };

        } catch (error) {
            logger.error(AGENT_ID, 'Erro na execução', { error: error.message });

            return {
                agent_id: AGENT_ID,
                status: 'fail',
                dados: {
                    itens: [],
                    resumo: {
                        total_itens: 0,
                        elegiveis: 0,
                        duvida: 0,
                        incompativeis: 0
                    }
                },
                alerts: [{
                    type: 'error',
                    message: error.message,
                    severity: 'high'
                }],
                evidence: [],
                metadata: {
                    run_ms: Date.now() - startTime,
                    items_found: 0,
                    sections_hit: [],
                    confidence: 0.0
                },
                quality_flags: {
                    needs_review: true,
                    low_ocr_quality: false,
                    missing_sections: ['ITENS']
                }
            };
        }
    }

    /**
     * Extrai itens do CORPO_INTEGRADO
     */
    async extractItems(corpoIntegrado) {
        const items = [];
        const evidence = [];

        // Regex patterns para detectar itens
        const itemPatterns = [
            { pattern: /ITEM\s+(\d{1,3})\s*[-:.]?\s*([^\n]{10,300})/gi, type: 'ITEM' },
            { pattern: /^\s*(\d+\.\d+)\s+[-–]?\s*([^\n]{10,300})/gm, type: 'HIERARCHICAL' },
            { pattern: /\|\s*(\d+)\s*\|([^\|]{10,200})\|/g, type: 'TABLE' }
        ];

        const lines = corpoIntegrado.globalLines;
        const processed = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const text = line.text;

            for (const { pattern, type } of itemPatterns) {
                pattern.lastIndex = 0;
                const matches = text.matchAll(pattern);

                for (const match of matches) {
                    const numero = match[1];
                    const descricao = (match[2] || '').trim();

                    const key = `${numero}-${descricao.substring(0, 30)}`;
                    if (processed.has(key) || descricao.length < 10) continue;

                    processed.add(key);

                    // Contexto completo (próximas 3 linhas)
                    const contextLines = lines.slice(i, Math.min(i + 4, lines.length));
                    const fullContext = contextLines.map(l => l.text).join(' ');

                    // Extrai metadados
                    const quantidade = this.extractQuantidade(fullContext) || "SEM DADOS NO ARQUIVO";
                    const unidade = this.extractUnidade(fullContext) || "SEM DADOS NO ARQUIVO";

                    // Detecta flags técnicas
                    const tem_marca = this.detectMarca(fullContext);
                    const tem_norma = this.detectNorma(fullContext);
                    const tem_servico = this.detectServico(fullContext);

                    // Monta item conforme contrato DEV DOC 3/8
                    const item = {
                        item_numero: numero,
                        descricao_literal: descricao,
                        unidade,
                        quantidade,
                        tem_marca,
                        tem_norma,
                        tem_servico,
                        classificacao: "SEM PERFIL EMPRESA", // Será preenchido depois
                        motivo: "SEM DADOS NO ARQUIVO",
                        origens: []
                    };

                    // Evidência completa
                    const lineRange = contextLines.map(l => l.globalLine);
                    const charRange = [contextLines[0].charStart, contextLines[contextLines.length - 1].charEnd];

                    const itemEvidence = {
                        field: `item_${numero}`,
                        documento: line.sourceDocName,
                        doc_id: line.docId || 'unknown',
                        doc_type: this.detectDocType(corpoIntegrado, line.sourceDocName),
                        pagina: line.sourcePage,
                        line_range: [lineRange[0], lineRange[lineRange.length - 1]],
                        char_range: charRange,
                        segment_hash: line.segmentHash || 'unknown',
                        trecho_literal: fullContext.substring(0, 200),
                        confidence: 0.9,
                        notes: `Item extraído via pattern ${type}`
                    };

                    item.origens.push(itemEvidence);
                    evidence.push(itemEvidence);
                    items.push(item);
                }
            }
        }

        // Fallback: pipeline pre_analise
        if (items.length === 0 && corpoIntegrado.preAnalise) {
            const detected = corpoIntegrado.preAnalise.itens_detectados || 0;
            if (detected > 0) {
                logger.warn(AGENT_ID, `Pipeline detectou ${detected} itens mas extração regex falhou`);
            }
        }

        return { items, evidence };
    }

    /**
     * Classifica itens por perfil da empresa
     */
    classifyItems(items, companyProfile, evidence) {
        const cnaes = companyProfile.cnaes || [];

        for (const item of items) {
            const category = this.detectCategory(item.descricao_literal);
            const fit = this.checkCNAEFit(category, cnaes);

            if (fit === 'MATCH') {
                item.classificacao = 'ELEGIVEL';
                item.motivo = `Categoria '${category}' compatível com CNAE da empresa`;
            } else if (fit === 'PARTIAL') {
                item.classificacao = 'DUVIDA';
                item.motivo = `Categoria '${category}' parcialmente compatível - requer análise`;
            } else {
                item.classificacao = 'INCOMPATIVEL';
                item.motivo = `Categoria '${category}' fora do escopo dos CNAEs da empresa`;
            }

            // Flags técnicas afetam classificação
            if (item.tem_marca) {
                item.classificacao = 'DUVIDA';
                item.motivo += ' + MARCA ESPECIFICADA (verificar equivalência)';
            }

            if (item.tem_norma) {
                item.motivo += ' + NORMA TÉCNICA EXIGIDA';
            }
        }
    }

    /**
     * Detecta categoria do item
     */
    detectCategory(text) {
        const normalized = text.toLowerCase();

        const categories = {
            'moveis': /\b(mesa|cadeira|armario|estante|movel|mobiliario)\b/,
            'informatica': /\b(computador|notebook|impressora|servidor|switch|monitor)\b/,
            'construcao': /\b(obra|reforma|pintura|construcao|alvenaria)\b/,
            'servicos': /\b(manutencao|limpeza|vigilancia|consultoria)\b/,
            'veiculos': /\b(veiculo|carro|caminhao|onibus)\b/,
            'material_escritorio': /\b(papel|caneta|grampeador|pasta)\b/,
            'equipamentos': /\b(equipamento|maquina|aparelho|ferramenta)\b/,
            'alimentos': /\b(alimentacao|comida|refeicao|merenda)\b/,
            'medicamentos': /\b(medicamento|remedio|farmacia)\b/
        };

        for (const [cat, pattern] of Object.entries(categories)) {
            if (pattern.test(normalized)) return cat;
        }

        return 'outros';
    }

    /**
     * Verifica fit com CNAEs
     */
    checkCNAEFit(category, cnaes) {
        const mapping = {
            'moveis': ['3101', '3102', '4754'],
            'informatica': ['2610', '2621', '4751', '4752'],
            'construcao': ['4120', '4211', '4213'],
            'material_escritorio': ['4761'],
            'veiculos': ['4511', '4520']
        };

        const validCNAEs = mapping[category] || [];
        if (validCNAEs.length === 0) return 'NONE';

        for (const cnae of cnaes) {
            const digits = cnae.replace(/\D/g, '').substring(0, 4);
            for (const valid of validCNAEs) {
                if (digits.startsWith(valid)) return 'MATCH';
            }
        }

        return 'NONE';
    }

    /**
     * Detecta marca no texto
     */
    detectMarca(text) {
        const patterns = [
            /\bmarca\s+[\w\s]+/i,
            /\bmodelo\s+[\w\s]+/i,
            /\b[A-Z]{2,}[\w\s]*(?:TM|®|©)/,
            /\bfabricante\s+[\w\s]+/i
        ];

        return patterns.some(p => p.test(text));
    }

    /**
     * Detecta norma técnica
     */
    detectNorma(text) {
        const patterns = [
            /\b(?:ABNT|NBR|ISO|IEC|ASTM|DIN)\s*[\d-]+/i,
            /\bnorma\s+t[eé]cnica/i
        ];

        return patterns.some(p => p.test(text));
    }

    /**
     * Detecta serviço acoplado
     */
    detectServico(text) {
        const keywords = /\b(instalacao|manutencao|treinamento|assistencia|suporte|garantia estendida)\b/i;
        return keywords.test(text);
    }

    /**
     * Extrai quantidade
     */
    extractQuantidade(text) {
        const patterns = [
            /quantidade[:\s]+(\d+)/i,
            /qtd\.?[:\s]+(\d+)/i,
            /(\d+)\s+unidades?/i
        ];

        for (const p of patterns) {
            const m = text.match(p);
            if (m) return m[1];
        }
        return null;
    }

    /**
     * Extrai unidade
     */
    extractUnidade(text) {
        const units = ['unidade', 'un', 'peça', 'pç', 'conjunto', 'metro', 'litro', 'kg'];
        const normalized = text.toLowerCase();

        for (const unit of units) {
            if (normalized.includes(unit)) return unit;
        }
        return null;
    }

    /**
     * Calcula resumo conforme DEV DOC 3/8
     */
    calculateSummary(items) {
        return {
            total_itens: items.length,
            elegiveis: items.filter(i => i.classificacao === 'ELEGIVEL').length,
            duvida: items.filter(i => i.classificacao === 'DUVIDA').length,
            incompativeis: items.filter(i => i.classificacao === 'INCOMPATIVEL').length
        };
    }

    /**
     * Gera alerts
     */
    generateAlerts(items, companyProfile) {
        const alerts = [];

        if (items.length === 0) {
            alerts.push({
                type: 'warning',
                message: 'Nenhum item detectado automaticamente',
                severity: 'medium',
                action_suggested: 'REVISAR_MANUALMENTE'
            });
        }

        const marcas = items.filter(i => i.tem_marca);
        if (marcas.length > 0) {
            alerts.push({
                type: 'attention',
                message: `${marcas.length} itens com MARCA especificada`,
                severity: 'medium',
                action_suggested: 'VERIFICAR_EQUIVALENCIA'
            });
        }

        return alerts;
    }

    /**
     * Detecta tipo do documento
     */
    detectDocType(corpoIntegrado, docName) {
        const seg = corpoIntegrado.segments.find(s => s.documentName === docName);
        return seg?.documentType || 'unknown';
    }

    /**
     * Seções atingidas
     */
    getSectionsHit(corpoIntegrado) {
        const sections = [];
        for (const seg of corpoIntegrado.segments) {
            if (seg.structures) {
                if (seg.structures.chapters) sections.push('chapters');
                if (seg.structures.sections) sections.push('sections');
                if (seg.structures.articles) sections.push('articles');
            }
        }
        return [...new Set(sections)];
    }

    /**
     * Load heuristics (placeholder)
     */
    loadCNAEHeuristics() {
        return {};
    }
}

export default ItemClassifier;
