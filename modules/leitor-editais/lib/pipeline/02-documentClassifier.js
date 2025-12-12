/**
 * 📋 ETAPA 2 - DOCUMENT CLASSIFIER (REFATORADO - PACOTE COMPLETO DE CERTAME)
 * 
 * Reconhece e classifica TODO o pacote do certame, não apenas edital.
 * 
 * TIPOS MÍNIMOS:
 * 1. nucleo_certame (edital, instrumento convocatório)
 * 2. tr (termo de referência, projeto básico/executivo)
 * 3. minuta (contrato)
 * 4. planejamento_interno (DFD, notas técnicas, despachos, justificativas)
 * 5. formacao_de_precos (pesquisa mercado, mapa, planilhas, memória cálculo)
 * 6. esclarecimentos_retificacoes (Q&A, atas, comunicados, erratas)
 * 7. fase_competitiva (propostas, lances, chat, decisões)
 * 8. pos_julgamento_execucao (parecer jurídico, adjudicação, homologação, contrato, ARP)
 * 9. anexos_tecnicos (catálogos, laudos, manuais, plantas)
 * 10. planilha (xlsx/csv)
 * 11. documentos_fornecedor_externos (habilitação, propostas, atestados - marcado como externo)
 * 12. outros (fallback)
 * 
 * SISTEMA DE SCORING:
 * - Score bruto = soma dos pesos dos matches
 * - Confidence = min(1, scoreBruto / SCORE_MAX_TIPO)
 * - confidence >= 0.80 → classifica direto
 * - 0.55 <= confidence < 0.80 → classifica + needs_review
 * - < 0.55 → outros
 */

import { getLogger } from '../services/logger.js';

const logger = getLogger();
const AGENTE_NOME = 'DocumentClassifier';

// Mapa completo de regras por tipo de documento
export const DOC_TYPE_RULES = {
    // 1) NÚCLEO_CERTAME
    nucleo_certame: {
        scoreMax: 16,
        patterns: [
            { re: /\bedital\b/, w: 6 },
            { re: /\binstrumento convocat[oó]rio\b/, w: 6 },
            { re: /\bcondi[cç][oõ]es gerais\b/, w: 2 },
            { re: /\bdisposi[cç][oõ]es preliminares\b/, w: 2 },
            { re: /\bobjeto\b/, w: 1 },
            { re: /\bhabilita[cç][aã]o\b/, w: 1 },
            { re: /\bcrit[eé]rio(s)? de julgamento\b/, w: 2 },
            { re: /\bforma de apresenta[cç][aã]o de proposta\b/, w: 2 },
            { re: /\bsess[aã]o p[uú]blica\b/, w: 2 },
            { re: /\bpreg[aã]o eletr[oô]nico\b|\bconcorr[eê]ncia\b/, w: 2 },
            // PADRÕES FORTES PARA DISPENSA/CONTRATAÇÃO DIRETA
            { re: /\bdispensa eletr[oô]nica\b/, w: 7 },
            { re: /\baviso de dispensa\b/, w: 7 },
            { re: /\bdispensa de licita[cç][aã]o\b/, w: 6 },
            { re: /\bcontrata[cç][aã]o direta\b/, w: 6 },
            { re: /\baviso de contrata[cç][aã]o direta\b/, w: 7 },
            { re: /\btermo de dispensa\b/, w: 7 },
            { re: /\bart\.?\s*75\b.*\blei\s*14\.?133\b/, w: 5 },
            { re: /\blei\s*14\.?133\b.*\bart\.?\s*75\b/, w: 5 },
            // filename boosts
            { re: /\b(edital|instrumento_convocatorio|pe_|pregao|concorrencia|dispensa)\b/, w: 2, scope: "filename" }
        ]
    },

    // 2) TR / PROJETO BÁSICO / EXECUTIVO
    tr: {
        scoreMax: 14,
        patterns: [
            { re: /\btermo de refer[eê]ncia\b/, w: 8 },
            { re: /\btr\b(?!t)/, w: 2 },
            { re: /\bespecifica[cç][oõ]es t[eé]cnicas\b/, w: 3 },
            { re: /\brequisitos t[eé]cnicos\b/, w: 3 },
            { re: /\bdescri[cç][aã]o detalhada\b/, w: 2 },
            { re: /\bcrono?grama\b/, w: 1 },
            { re: /\bmetodologia\b/, w: 1 },
            { re: /\bobriga[cç][oõ]es da contratada\b/, w: 2 },
            { re: /\bobriga[cç][oõ]es da contratante\b/, w: 2 },
            { re: /\bcrit[eé]rios de aceita[cç][aã]o\b/, w: 2 },
            { re: /\bprojeto b[aá]sico\b/, w: 7 },
            { re: /\bprojeto executivo\b/, w: 7 },
            { re: /\bmemorial descritivo\b/, w: 3 },
            { re: /\banexo\b.*\btermo de refer[eê]ncia\b/, w: 3 },
            { re: /\b(termo_de_referencia|tr_|projeto_basico|projeto_executivo)\b/, w: 2, scope: "filename" }
        ]
    },

    // 3) MINUTA / CONTRATO
    minuta: {
        scoreMax: 14,
        patterns: [
            { re: /\bminuta\b/, w: 6 },
            { re: /\bminuta de contrato\b/, w: 8 },
            { re: /\bcontrato administrativo\b/, w: 6 },
            { re: /\bcl[aá]usula(s)?\b/, w: 2 },
            { re: /\bvig[eê]ncia\b/, w: 2 },
            { re: /\bgestor do contrato\b|\bfiscaliza[cç][aã]o\b/, w: 2 },
            { re: /\breajuste\b|\brepactua[cç][aã]o\b|\breequil[ií]brio\b/, w: 2 },
            { re: /\bsan[cç][oõ]es\b|\bmultas\b/, w: 2 },
            { re: /\brescis[aã]o\b|\bextin[cç][aã]o\b/, w: 2 },
            { re: /\b(contrato|minuta_contrato|instrumento_contratual)\b/, w: 2, scope: "filename" }
        ]
    },

    // 4) PLANEJAMENTO_INTERNO
    planejamento_interno: {
        scoreMax: 15,
        patterns: [
            { re: /\bdfd\b|\bdocumento de formaliza[cç][aã]o da demanda\b/, w: 9 },
            { re: /\bestudo t[eé]cnico preliminar\b|\betp\b/, w: 7 },
            { re: /\bmapa de riscos\b/, w: 6 },
            { re: /\bnota t[eé]cnica\b/, w: 5 },
            { re: /\bdespacho\b.*\bautoriza[cç][aã]o\b/, w: 5 },
            { re: /\bestudo de viabilidade\b|\bviabilidade t[eé]cnica\b/, w: 5 },
            { re: /\bjustificativa\b.*\b(escolha|solu[cç][aã]o)\b/, w: 4 },
            { re: /\bjustificativa\b.*\b(parcelamento|n[aã]o parcelamento)\b/, w: 6 },
            { re: /\bjustificativa\b.*\b(lote (u[nú]nico|global)|lote global)\b/, w: 6 },
            { re: /\bjustificativa\b.*\bmarca\b|\bmarca espec[ií]fica\b/, w: 6 },
            { re: /\b(planejamento|dfd|etp|mapa_de_riscos|nota_tecnica)\b/, w: 2, scope: "filename" }
        ]
    },

    // 5) FORMACAO_DE_PRECOS
    formacao_de_precos: {
        scoreMax: 16,
        patterns: [
            { re: /\bpesquisa de pre[cç]os\b|\bpesquisa de mercado\b/, w: 8 },
            { re: /\bmapa de pre[cç]os\b|\bestimativa de pre[cç]os\b|\bvalor estimado\b/, w: 8 },
            { re: /\bmem[oó]ria de c[aá]lculo\b/, w: 5 },
            { re: /\bcomposi[cç][aã]o de custos\b|\bplanilha anal[ií]tica\b/, w: 6 },
            { re: /\bcrit[eé]rio(s)? de aceitabilidade\b/, w: 5 },
            { re: /\binexequ[ií]vel\b|\bcrit[eé]rio(s)? de inexequibilidade\b/, w: 5 },
            { re: /\bjustificativa de pre[cç]os\b/, w: 5 },
            { re: /\bcota[cç][aã]o\b|\bor[cç]amento\b|\bfornecedor(es)?\b/, w: 2 },
            { re: /\bcatmat\b|\bcatser\b/, w: 2 },
            { re: /\b(planilha|custos|pesquisa_preco|mapa_preco|estimativa)\b/, w: 2, scope: "filename" }
        ]
    },

    // 6) ESCLARECIMENTOS_RETIFICACOES
    esclarecimentos_retificacoes: {
        scoreMax: 14,
        patterns: [
            { re: /\besclarecimento(s)?\b/, w: 7 },
            { re: /\bpedido(s)? de esclarecimento(s)?\b/, w: 8 },
            { re: /\bpergunta(s)?\b.*\bresposta(s)?\b/, w: 4 },
            { re: /\bq&a\b|\bfaq\b/, w: 3 },
            { re: /\bretifica[cç][aã]o\b/, w: 8 },
            { re: /\berrata\b/, w: 8 },
            { re: /\bcomunicado\b/, w: 4 },
            { re: /\breabertura\b.*\bprazo\b/, w: 6 },
            { re: /\bimpugna[cç][aã]o\b.*\bresposta\b/, w: 4 },
            { re: /\b(esclarecimento|errata|retificacao|comunicado)\b/, w: 2, scope: "filename" }
        ]
    },

    // 7) FASE_COMPETITIVA
    fase_competitiva: {
        scoreMax: 16,
        patterns: [
            { re: /\bata\b.*\bsess[aã]o\b/, w: 7 },
            { re: /\bsess[aã]o p[uú]blica\b/, w: 6 },
            { re: /\bproposta(s)? inicial(is)?\b/, w: 5 },
            { re: /\bmapa\b.*\blance(s)?\b|\bhist[oó]rico de lances\b/, w: 8 },
            { re: /\bchat\b.*\bsess[aã]o\b|\bchat da sess[aã]o\b/, w: 8 },
            { re: /\bdecis[aã]o\b.*\bpregoeiro\b|\bagente de contrata[cç][aã]o\b/, w: 6 },
            { re: /\brelat[oó]rio(s)?\b.*\bplataforma\b/, w: 5 },
            { re: /\bjulgamento\b.*\bproposta(s)?\b|\binabilita[cç][aã]o\b|\bclassifica[cç][aã]o\b/, w: 4 },
            { re: /\b(ata_sessao|lances|chat|julgamento|resultado)\b/, w: 2, scope: "filename" }
        ]
    },

    // 8) POS_JULGAMENTO_EXECUCAO
    pos_julgamento_execucao: {
        scoreMax: 16,
        patterns: [
            { re: /\bparecer jur[ií]dico\b/, w: 7 },
            { re: /\badjudica[cç][aã]o\b/, w: 7 },
            { re: /\bhomologa[cç][aã]o\b/, w: 7 },
            { re: /\bcontrato assinado\b|\binstrumento contratual\b/, w: 6 },
            { re: /\barp\b|\bata de registro de pre[cç]os\b/, w: 8 },
            { re: /\bordem(ns)? de fornecimento\b|\bautoriza[cç][aã]o de fornecimento\b/, w: 6 },
            { re: /\btermo(s)? aditivo(s)?\b/, w: 6 },
            { re: /\bnota(s)? de empenho\b|\bempenho\b/, w: 6 },
            { re: /\brecebimento\b.*\b(provis[oó]rio|definitivo)\b/, w: 6 },
            { re: /\bfiscaliza[cç][aã]o\b.*\bcontrato\b/, w: 4 },
            { re: /\b(adjudicacao|homologacao|arp|empenho|aditivo|of)\b/, w: 2, scope: "filename" }
        ]
    },

    // 9) ANEXOS_TECNICOS
    anexos_tecnicos: {
        scoreMax: 14,
        patterns: [
            { re: /\bcat[aá]logo(s)?\b/, w: 7 },
            { re: /\blaudo(s)?\b|\bensaio(s)?\b|\bcertificado(s)?\b/, w: 7 },
            { re: /\bmanual\b/, w: 6 },
            { re: /\bdesenho(s)?\b|\bplanta(s)?\b|\besquema(s)?\b/, w: 6 },
            { re: /\bfoto(s)?\b|\bimagem(ns)?\b/, w: 3 },
            { re: /\bnorma(s)?\b.*\b(abnt|nbr|iso)\b/, w: 5 },
            { re: /\bprint(s)?\b.*\bplataforma\b/, w: 4 },
            { re: /\b(anexo_tecnico|catalogo|laudo|manual|planta)\b/, w: 2, scope: "filename" }
        ]
    },

    // 10) PLANILHA (quando extensão ajuda)
    planilha: {
        scoreMax: 8,
        patterns: [
            { re: /\.(xlsx|xls|csv)$/i, w: 10, scope: "filename" },
            { re: /\bplanilha\b/, w: 4 },
            { re: /\bitem\b.*\bquantidade\b.*\bvalor\b/, w: 3 },
            { re: /\bsubtotal\b|\btotal\b/, w: 2 }
        ]
    },

    // 11) DOCUMENTOS_FORNECEDOR_EXTERNOS (marcar como externo)
    documentos_fornecedor_externos: {
        scoreMax: 14,
        patterns: [
            { re: /\bproposta comercial\b|\bproposta de pre[cç]os\b/, w: 7 },
            { re: /\bdeclara[cç][aã]o\b.*\blicitante\b/, w: 4 },
            { re: /\batestado(s)? de capacidade t[eé]cnica\b/, w: 8 },
            { re: /\bcertid[aã]o\b|\bregularidade fiscal\b|\bfgts\b|\bsicaf\b|\bcrc\b/, w: 6 },
            { re: /\bbalan[cç]o patrimonial\b|\b[ií]ndices cont[aá]beis\b/, w: 6 },
            { re: /\b(cnd|cndt|fgts|sicaf|crc|atestado|proposta)\b/i, w: 2, scope: "filename" }
        ]
    },

    // 12) OUTROS (fallback)
    outros: {
        scoreMax: 1,
        patterns: [{ re: /.*/, w: 1 }]
    }
};

class DocumentClassifier {
    constructor() {
        this.rules = DOC_TYPE_RULES;
        this.confidenceThresholds = {
            direct: 0.80,      // >= 0.80: classifica direto
            review: 0.55,      // 0.55-0.80: needs_review
            fallback: 0.55     // < 0.55: outros
        };
    }

    /**
     * Classifica um documento baseado no texto e nome do arquivo
     */
    async classify(documentText, filename) {
        try {
            logger.info(AGENTE_NOME, `Classificando: ${filename}`);

            // Normaliza texto (lowercase + remove acentos)
            const normalizedText = this.normalizeText(documentText);
            const normalizedFilename = this.normalizeText(filename);

            // Extrai extension
            const extension = filename.split('.').pop().toLowerCase();

            // Usa primeiras 3 páginas (aproximadamente) ou até 10k chars
            const textHead = normalizedText.substring(0, 10000);

            // Calcula scores para todos os tipos
            const scores = {};
            for (const [typeKey, typeRules] of Object.entries(this.rules)) {
                scores[typeKey] = this.scoreDocType(
                    textHead,
                    normalizedFilename,
                    typeRules,
                    extension,
                    documentText.length
                );
            }

            // Encontra vencedor
            const winner = this.findWinnerType(scores, extension, textHead);

            // Determina flags
            const flags = {
                needs_review: winner.confidence >= this.confidenceThresholds.review &&
                    winner.confidence < this.confidenceThresholds.direct,
                external_supplier_doc: winner.type === 'documentos_fornecedor_externos',
                low_ocr_quality: documentText.length < 300
            };

            logger.info(
                AGENTE_NOME,
                `Classificado como: ${winner.type} (confidence: ${(winner.confidence * 100).toFixed(0)}%)`
            );

            return {
                type: winner.type,
                confidence: winner.confidence,
                matched: winner.matched,
                flags,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error(AGENTE_NOME, 'Erro na classificação', { error: error.message });

            return {
                type: 'outros',
                confidence: 0.5,
                matched: [],
                flags: { needs_review: true, external_supplier_doc: false, low_ocr_quality: false },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calcula score de um tipo de documento
     */
    scoreDocType(text, filename, rules, extension, textLength) {
        let score = 0;
        const matched = [];

        for (const pattern of rules.patterns) {
            const haystack = (pattern.scope === "filename") ? filename : text;

            if (pattern.re.test(haystack)) {
                score += pattern.w;
                matched.push({
                    pattern: pattern.re.source.substring(0, 50),
                    weight: pattern.w
                });
            }
        }

        // PENALIDADES E BOOSTS

        // Boost para planilhas
        if ((extension === 'xlsx' || extension === 'xls' || extension === 'csv')) {
            if (rules === this.rules.planilha || rules === this.rules.formacao_de_precos) {
                score += 3;
                matched.push({ pattern: 'excel/csv boost', weight: 3 });
            }
        }

        // Penalidade para texto muito curto (OCR ruim)
        if (textLength < 300) {
            // Não penaliza score, mas será detectado em flags
        }

        // Boost para "ata"+="sessão"
        if (text.includes('ata') && text.includes('sessao') && rules === this.rules.fase_competitiva) {
            score += 2;
            matched.push({ pattern: 'ata+sessão boost', weight: 2 });
        }

        let confidence = Math.min(1.0, score / rules.scoreMax);

        // Penalidade de confidence para texto curto
        if (textLength < 300) {
            confidence = Math.max(0, confidence - 0.15);
        }

        return { score, confidence, matched };
    }

    /**
     * Encontra o vencedor com heurísticas de desempate
     */
    findWinnerType(scores, extension, text) {
        // Ordena por confidence
        const sorted = Object.entries(scores)
            .map(([type, result]) => ({ type, ...result }))
            .sort((a, b) => b.confidence - a.confidence);

        const top = sorted[0];
        const second = sorted[1];

        // HEURÍSTICAS DE DESEMPATE

        // DESEMPATE ESPECIAL: Dispensa/Contratação Direta → nucleo_certame
        // Exceto se 'justificativa de preços' dominar (formacao_de_precos)
        const hasDispensaPattern = text.includes('dispensa eletronica') ||
            text.includes('aviso de dispensa') ||
            text.includes('contratacao direta') ||
            text.includes('termo de dispensa') ||
            (text.includes('art') && text.includes('75') && text.includes('lei 14'));

        const hasJustificativaPrecos = text.includes('justificativa de precos') ||
            text.includes('justificativa de pre');

        if (hasDispensaPattern && !hasJustificativaPrecos) {
            // Força nucleo_certame se tiver qualquer menção a dispensa
            const nucleoCertame = sorted.find(s => s.type === 'nucleo_certame');
            if (nucleoCertame && nucleoCertame.confidence >= 0.50) {
                return nucleoCertame;
            }
        }

        // Se empate entre primeiros dois
        if (second && Math.abs(top.confidence - second.confidence) < 0.05) {
            // Regras de desempate

            // Retificação/errata/esclarecimento
            if (second.type === 'esclarecimentos_retificacoes' &&
                (text.includes('retificacao') || text.includes('errata') || text.includes('esclarecimento'))) {
                return second;
            }

            // Excel/CSV → planilha
            if ((extension === 'xlsx' || extension === 'xls' || extension === 'csv') &&
                second.type === 'planilha') {
                return second;
            }

            // Minuta de contrato
            if (second.type === 'minuta' && text.includes('minuta de contrato')) {
                return second;
            }

            // DFD/ETP/Mapa riscos
            if (second.type === 'planejamento_interno' &&
                (text.includes('dfd') || text.includes('etp') || text.includes('mapa de riscos'))) {
                return second;
            }

            // Ata + sessão/lances/chat
            if (second.type === 'fase_competitiva' &&
                text.includes('ata') && (text.includes('sessao') || text.includes('lances') || text.includes('chat'))) {
                return second;
            }

            // Homologação/adjudicação/ARP/empenho
            if (second.type === 'pos_julgamento_execucao' &&
                (text.includes('homologacao') || text.includes('adjudicacao') ||
                    text.includes('arp') || text.includes('empenho') || text.includes('aditivo'))) {
                return second;
            }
        }

        // Se confidence muito baixa, vai para "outros"
        if (top.confidence < this.confidenceThresholds.fallback) {
            return {
                type: 'outros',
                confidence: top.confidence,
                matched: top.matched
            };
        }

        return top;
    }

    /**
     * Normaliza texto (lowercase + remove acentos)
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    }
}

export default DocumentClassifier;
