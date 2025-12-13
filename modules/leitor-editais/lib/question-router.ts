/**
 * QuestionRouter - Roteador de perguntas para agentes
 * 
 * Mapeia categorias de perguntas para agentes especialistas
 * e extrai respostas do corpus + resultados já processados
 * 
 * @module lib/question-router
 * @sprint Sprint 3 - Perguntas Pós-Análise
 */

// Mapeamento categoria → agente
const CATEGORY_TO_AGENT: Record<string, string> = {
    // Documentos de habilitação
    'habilitacao': 'AGENT_04',
    'certidoes': 'AGENT_04',
    'documentacao': 'AGENT_04',

    // Capacidade técnica
    'capacidade_tecnica': 'AGENT_05',
    'atestado': 'AGENT_05',
    'equipe_tecnica': 'AGENT_05',
    'amostras': 'AGENT_05',
    'visita_tecnica': 'AGENT_05',
    'normas': 'AGENT_05',

    // Itens e classificação
    'itens': 'AGENT_03',
    'objeto': 'AGENT_03',
    'equivalencia_marca': 'AGENT_03',
    'marca': 'AGENT_03',

    // Divergências
    'divergencias': 'AGENT_07',
    'inconsistencias': 'AGENT_07',

    // Prazos e pagamento
    'prazos': 'AGENT_03',
    'entrega': 'AGENT_03',
    'pagamento': 'AGENT_03',

    // Penalidades e garantias
    'penalidades': 'AGENT_06',
    'garantias': 'AGENT_06',
    'multas': 'AGENT_06',

    // MEI/ME/EPP
    'me_epp': 'AGENT_04',
    'mei': 'AGENT_04',

    // Jurídico
    'juridico': 'AGENT_06',
    'impugnacao': 'AGENT_06',
    'pedido_esclarecimento': 'AGENT_06',

    // Decisão go/no-go
    'go_no_go': 'AGENT_08',
    'decisao': 'AGENT_08',
    'vale_a_pena': 'AGENT_08',
};

export interface Evidence {
    field: string;
    documento: string;
    pagina: number;
    trecho_literal: string;
    linha?: number;
}

export interface QuestionAnswer {
    answerText: string;
    evidence: Evidence[];
    status: 'OK' | 'LOW_CONFIDENCE' | 'NO_DATA';
    answerFormat: 'TEXT' | 'LEGAL_DRAFT';
}

export class QuestionRouter {
    private corpus: any;
    private results: any;
    private context: any;

    constructor(corpus: any, results: any, context?: any) {
        this.corpus = corpus;
        this.results = results;
        this.context = context;
    }

    /**
     * Roteia pergunta para o agente apropriado e extrai resposta
     */
    route(category: string, questionText: string): QuestionAnswer {
        const agentId = CATEGORY_TO_AGENT[category];

        if (!agentId) {
            return this.genericAnswer(questionText);
        }

        // Buscar dados do agente nos resultados
        const agentData = this.results.agents?.[agentId];

        if (!agentData) {
            return {
                answerText: 'Dados do agente não encontrados. Execute a análise antes de fazer perguntas pós-análise.',
                evidence: [],
                status: 'NO_DATA',
                answerFormat: 'TEXT',
            };
        }

        // Roteamento por categoria
        switch (category) {
            case 'habilitacao':
            case 'certidoes':
            case 'documentacao':
                return this.answerHabilitacao(questionText, agentData);

            case 'capacidade_tecnica':
            case 'atestado':
            case 'equipe_tecnica':
            case 'amostras':
                return this.answerCapacidadeTecnica(questionText, agentData);

            case 'itens':
            case 'objeto':
                return this.answerItens(questionText, agentData);

            case 'equivalencia_marca':
            case 'marca':
                return this.answerMarca(questionText, agentData);

            case 'divergencias':
            case 'inconsistencias':
                return this.answerDivergencias(questionText, agentData);

            case 'juridico':
            case 'pedido_esclarecimento':
            case 'impugnacao':
                return this.answerJuridico(questionText, agentData);

            case 'go_no_go':
            case 'decisao':
            case 'vale_a_pena':
                return this.answerGoNoGo(questionText, agentData);

            default:
                return this.genericAnswer(questionText);
        }
    }

    /**
     * Resposta genérica (busca textual no corpus)
     */
    private genericAnswer(questionText: string): QuestionAnswer {
        return {
            answerText: `Sua pergunta "${questionText}" não pôde ser categorizada automaticamente. Por favor, reformule ou especifique a categoria.`,
            evidence: [],
            status: 'NO_DATA',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Extrai resposta sobre habilitação
     */
    private answerHabilitacao(question: string, agentData: any): QuestionAnswer {
        const { exigencias_habilitacao, compliance_status } = agentData;

        if (!exigencias_habilitacao || exigencias_habilitacao.length === 0) {
            return {
                answerText: 'SEM DADOS: Nenhuma exigência de habilitação foi identificada no edital.',
                evidence: [],
                status: 'NO_DATA',
                answerFormat: 'TEXT',
            };
        }

        // Extrair evidências
        const evidence: Evidence[] = exigencias_habilitacao.slice(0, 3).map((item: any) => ({
            field: item.tipo || 'habilitacao',
            documento: item.metadata?.documento || 'Edital',
            pagina: item.metadata?.pagina || 0,
            trecho_literal: item.texto || item.descricao || '',
        }));

        // Sintetizar resposta
        const lista = exigencias_habilitacao
            .map((item: any) => `- ${item.tipo || 'Documento'}: ${item.descricao || item.texto}`)
            .join('\n');

        const answerText = `**Exigências de Habilitação Identificadas:**\n\n${lista}\n\n**Status de Compliance:** ${compliance_status || 'A avaliar'}`;

        return {
            answerText,
            evidence,
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Extrai resposta sobre capacidade técnica
     */
    private answerCapacidadeTecnica(question: string, agentData: any): QuestionAnswer {
        const { exigencias_tecnicas, amostras, visita_tecnica } = agentData;

        if (!exigencias_tecnicas || exigencias_tecnicas.length === 0) {
            return {
                answerText: 'SEM DADOS: Nenhuma exigência técnica foi identificada no edital.',
                evidence: [],
                status: 'NO_DATA',
                answerFormat: 'TEXT',
            };
        }

        const evidence: Evidence[] = exigencias_tecnicas.slice(0, 3).map((item: any) => ({
            field: 'capacidade_tecnica',
            documento: item.metadata?.documento || 'Edital',
            pagina: item.metadata?.pagina || 0,
            trecho_literal: item.descricao || item.texto || '',
        }));

        const lista = exigencias_tecnicas
            .map((item: any) => `- ${item.descricao || item.texto}`)
            .join('\n');

        let answerText = `**Exigências Técnicas:**\n\n${lista}`;

        if (amostras) {
            answerText += `\n\n**Amostras:** ${amostras.exigida ? 'SIM' : 'NÃO'}`;
        }

        if (visita_tecnica) {
            answerText += `\n\n**Visita Técnica:** ${visita_tecnica.obrigatoria ? 'SIM' : 'NÃO'}`;
        }

        return {
            answerText,
            evidence,
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Extrai resposta sobre itens/objeto
     */
    private answerItens(question: string, agentData: any): QuestionAnswer {
        const { itens, resumo_quantitativo } = agentData;

        if (!itens || itens.length === 0) {
            return {
                answerText: 'SEM DADOS: Nenhum item foi identificado no edital.',
                evidence: [],
                status: 'NO_DATA',
                answerFormat: 'TEXT',
            };
        }

        const evidence: Evidence[] = itens.slice(0, 3).map((item: any) => ({
            field: 'item',
            documento: 'Edital',
            pagina: item.metadata?.pagina || 0,
            trecho_literal: item.descricao || '',
        }));

        const lista = itens
            .map((item: any, idx: number) => `${idx + 1}. ${item.descricao} - Qtd: ${item.quantidade} - Unidade: ${item.unidade}`)
            .join('\n');

        const answerText = `**Itens do Edital (${itens.length} total):**\n\n${lista}\n\n${resumo_quantitativo || ''}`;

        return {
            answerText,
            evidence,
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Extrai resposta sobre marca/equivalência
     */
    private answerMarca(question: string, agentData: any): QuestionAnswer {
        const { exigencias_marca } = agentData;

        if (!exigencias_marca) {
            return {
                answerText: 'SEM DADOS: Nenhuma exigência de marca ou equivalência foi identificada.',
                evidence: [],
                status: 'NO_DATA',
                answerFormat: 'TEXT',
            };
        }

        const answerText = `**Marca/Equivalência:**\n\n${JSON.stringify(exigencias_marca, null, 2)}`;

        return {
            answerText,
            evidence: [],
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Extrai resposta sobre divergências
     */
    private answerDivergencias(question: string, agentData: any): QuestionAnswer {
        const { divergencias, total } = agentData;

        if (!divergencias || divergencias.length === 0) {
            return {
                answerText: 'NENHUMA DIVERGÊNCIA IDENTIFICADA entre Edital e Termo de Referência.',
                evidence: [],
                status: 'OK',
                answerFormat: 'TEXT',
            };
        }

        const evidence: Evidence[] = divergencias.slice(0, 3).map((div: any) => ({
            field: 'divergencia',
            documento: 'Edital vs TR',
            pagina: 0,
            trecho_literal: div.descricao || div.tipo || '',
        }));

        const lista = divergencias
            .map((div: any, idx: number) => `${idx + 1}. [${div.severidade || 'MEDIA'}] ${div.descricao}`)
            .join('\n');

        const answerText = `**⚠️ DIVERGÊNCIAS IDENTIFICADAS (${total || divergencias.length}):**\n\n${lista}`;

        return {
            answerText,
            evidence,
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Extrai resposta jurídica (pode gerar template de Pedido de Esclarecimento)
     */
    private answerJuridico(question: string, agentData: any): QuestionAnswer {
        if (question.toLowerCase().includes('pedido') || question.toLowerCase().includes('esclarecimento')) {
            return this.generateLegalDraft(question, agentData);
        }

        return {
            answerText: 'Para gerar um Pedido de Esclarecimento, inclua a palavra "pedido" ou "esclarecimento" na pergunta.',
            evidence: [],
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }

    /**
     * Gera template de Pedido de Esclarecimento
     */
    private generateLegalDraft(question: string, agentData: any): QuestionAnswer {
        const template = `
**PEDIDO DE ESCLARECIMENTO**

**Identificação do Certame:**
[Número do Pregão / Processo] - SEM DADOS (anexar edital)

**Objeto da Dúvida:**
${question}

**Trecho do Edital:**
[Documento/Página/Linha] - SEM DADOS

**Pergunta:**
${question}

**Pedido:**
Solicito esclarecimento oficial sobre a questão acima, nos termos do art. 24 da Lei 14.133/2021.

**Fecho:**
[Razão Social da Empresa]
[CNPJ]
[Data]
    `.trim();

        return {
            answerText: template,
            evidence: [],
            status: 'OK',
            answerFormat: 'LEGAL_DRAFT',
        };
    }

    /**
     * Extrai resposta sobre decisão go/no-go
     */
    private answerGoNoGo(question: string, agentData: any): QuestionAnswer {
        const { decisao_final, recomendacao, riscos, score_aderencia } = agentData;

        if (!decisao_final) {
            return {
                answerText: 'SEM DADOS: Análise de decisão não disponível.',
                evidence: [],
                status: 'NO_DATA',
                answerFormat: 'TEXT',
            };
        }

        const answerText = `
**DECISÃO: ${decisao_final}**

**Recomendação:**
${recomendacao || 'Avaliar caso a caso'}

**Score de Aderência:** ${score_aderencia || 'N/A'}

**Riscos Identificados:**
${riscos?.map((r: any) => `- ${r}`).join('\n') || 'Nenhum risco crítico'}
    `.trim();

        return {
            answerText,
            evidence: [],
            status: 'OK',
            answerFormat: 'TEXT',
        };
    }
}
