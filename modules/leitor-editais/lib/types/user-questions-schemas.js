/**
 * 📋 SCHEMAS DE PERGUNTAS DO USUÁRIO - LICITADOR BLINDADO
 * 
 * Define estruturas para Caixa de Perguntas (checklist + campo livre)
 * com respostas rastreáveis e sugestões de pedido de esclarecimento.
 * 
 * STATUS: PLACEHOLDER - Será integrado após pipeline completo
 */

/**
 * Categorias de perguntas predefinidas
 */
export const QUESTION_CATEGORIES = {
    EQUIVALENCIA_MARCA: 'equivalencia-marca',
    AMOSTRAS: 'amostras',
    HABILITACAO: 'habilitacao',
    CAPACIDADE_TECNICA: 'capacidade-tecnica',
    PRAZOS_ENTREGA: 'prazos-entrega',
    PAGAMENTO: 'pagamento',
    PENALIDADES_GARANTIAS: 'penalidades-garantias',
    ME_EPP: 'me-epp',
    DIVERGENCIAS_EDITAL_TR: 'divergencias-edital-tr',
    ITENS: 'itens',
    OUTROS: 'outros'
};

/**
 * Checklist de perguntas predefinidas por categoria
 */
export const PREDEFINED_QUESTIONS = {
    [QUESTION_CATEGORIES.EQUIVALENCIA_MARCA]: [
        'Há exigência de marca específica?',
        'É permitido oferecer produto equivalente?',
        'Quais são os critérios de equivalência?'
    ],

    [QUESTION_CATEGORIES.AMOSTRAS]: [
        'É obrigatória apresentação de amostra?',
        'Qual o prazo para apresentação de amostra?',
        'Qual o critério de avaliação da amostra?'
    ],

    [QUESTION_CATEGORIES.HABILITACAO]: [
        'Quais documentos são obrigatórios para habilitação?',
        'Há exigência de certidões específicas além das regulares?',
        'Existe prazo para regularização fiscal (ME/EPP)?'
    ],

    [QUESTION_CATEGORIES.CAPACIDADE_TECNICA]: [
        'É exigido atestado de capacidade técnica?',
        'Qual a quantidade/percentual mínimo exigido nos atestados?',
        'Os atestados são proporcionais ao objeto?'
    ],

    [QUESTION_CATEGORIES.PRAZOS_ENTREGA]: [
        'Qual o prazo de entrega dos produtos/serviços?',
        'É permitido entrega parcelada?',
        'Há possibilidade de prorrogação de prazo?'
    ],

    [QUESTION_CATEGORIES.PAGAMENTO]: [
        'Qual a forma de pagamento?',
        'Qual o prazo de pagamento após entrega?',
        'Há retenções fiscais aplicáveis?'
    ],

    [QUESTION_CATEGORIES.PENALIDADES_GARANTIAS]: [
        'Quais são as penalidades previstas?',
        'É exigida garantia contratual? Em qual percentual?',
        'Qual o prazo de garantia dos produtos?'
    ],

    [QUESTION_CATEGORIES.ME_EPP]: [
        'Há tratamento diferenciado para ME/EPP?',
        'Existe reserva de cota?',
        'Há empate ficto (até 10%)?'
    ],

    [QUESTION_CATEGORIES.DIVERGENCIAS_EDITAL_TR]: [
        'Há divergências entre Edital e TR?',
        'Qual documento prevalece em caso de divergência?',
        'As quantidades são compatíveis?'
    ],

    [QUESTION_CATEGORIES.ITENS]: [
        'Quantos itens/lotes há na licitação?',
        'Quais itens a empresa pode participar (considerando CNAE)?',
        'Há itens com valor estimado superior ao de mercado?'
    ]
};

/**
 * Schema de Pergunta do Usuário
 */
export const USER_QUESTION_SCHEMA = {
    id: '', // UUID
    question: '', // Texto da pergunta
    timestamp: '', // ISO 8601
    category: '', // Uma das QUESTION_CATEGORIES
    priority: '', // 'alta' | 'media' | 'baixa'
    mode: '', // 'pre-analise' | 'pos-analise'
    isPredefined: false, // true se veio do checklist
    context: {} // Contexto adicional da pergunta
};

/**
 * Schema de Resposta com Citação Obrigatória
 */
export const USER_ANSWER_SCHEMA = {
    questionId: '', // UUID da pergunta
    question: '', // Repete a pergunta para contexto
    answer: '', // Resposta ou "SEM DADOS NO ARQUIVO"
    found: false, // true se encontrou dados

    // Citações obrigatórias (se found=true)
    citations: [
        {
            document: '', // Nome do arquivo
            documentType: '', // edital | tr | minuta | etc
            page: 0, // Número da página
            lineNumber: 0, // Linha global
            excerpt: '', // Trecho literal
            charStart: 0, // Posição inicial
            charEnd: 0 // Posição final
        }
    ],

    // Minuta de pedido de esclarecimento (se found=false)
    clarificationDraft: {
        available: false,

        // Template jurídico obrigatório:
        // (i) identificação do certame
        certameId: '', // ou "SEM DADOS NO ARQUIVO"
        processo: '',
        orgao: '',

        // (ii) objeto da dúvida
        subject: '',

        // (iii) trecho literal com doc/página
        literalExcerpt: '', // ou "não localizado no edital"
        sourceDocument: '',
        sourcePage: 0,

        // (iv) pergunta objetiva
        objectiveQuestion: '',

        // (v) pedido de confirmação/retificação
        clarificationRequest: '',

        // (vi) fecho respeitoso institucional
        closing: 'Atenciosamente,\n[Nome da Empresa]\n[CNPJ]',

        // Texto completo formatado
        fullDraft: '',

        // Prazo sugerido para envio
        suggestedDeadline: ''
    },

    // Metadados da resposta
    respondedBy: '', // Nome do agente que respondeu
    confidence: 0, // 0-1
    timestamp: '',
    processingTimeMs: 0
};

/**
 * Schema de Contexto Operacional da Empresa
 * (CNAE e Porte vêm da Receita - readonly)
 */
export const USER_CONTEXT_SCHEMA = {
    // Informações da Receita (readonly)
    companyData: {
        cnae: [], // Array de CNAEs
        porte: '', // 'mei' | 'micro' | 'pequena' | 'media' | 'grande'
        razaoSocial: '',
        cnpj: ''
    },

    // Contexto operacional (informado pelo usuário)
    operationalContext: {
        // Estoque
        hasStock: false,
        stockCapacity: '', // 'baixa' | 'media' | 'alta'

        // Alcance logístico
        logisticsReach: {
            localOnly: false,
            regionalOnly: false,
            national: false,
            statesServed: [] // UFs
        },

        // Apetite de risco
        riskAppetite: '', // 'baixo' | 'medio' | 'alto'
        riskFactors: {
            acceptsHighPenalties: false,
            acceptsStrictDeadlines: false,
            acceptsComplexRequirements: false,
            acceptsLowMargin: false
        }
    },

    // Preferências de análise
    analysisPreferences: {
        autoGenerateDrafts: true, // Gerar minutas automaticamente
        includeCitations: true, // Incluir citações nas respostas
        showBlackBox: true, // Mostrar caixa preta completa
        detailLevel: 'high' // 'low' | 'medium' | 'high'
    }
};

/**
 * Schema de Modos de Pergunta
 */
export const QUESTION_MODES = {
    // Pré-Análise: Perguntas genéricas antes de processar documentos
    PRE_ANALISE: {
        mode: 'pre-analise',
        available: true,
        description: 'Perguntas genéricas sobre estrutura e requisitos básicos',
        limitations: 'Respostas podem ser menos precisas sem CORPO_INTEGRADO'
    },

    // Pós-Análise: Perguntas contextualizadas após CORPO_INTEGRADO
    POS_ANALISE: {
        mode: 'pos-analise',
        available: false, // Só ativa após pipeline completo
        description: 'Perguntas contextualizadas com base em análise completa',
        benefits: 'Respostas precisas com citações e contexto completo'
    }
};

/**
 * Template de Pedido de Esclarecimento
 */
export const CLARIFICATION_TEMPLATE = `PEDIDO DE ESCLARECIMENTO

{certameId}
Processo: {processo}
Órgão: {orgao}

Prezado(a) Senhor(a) Pregoeiro(a),

{subject}

{literalExcerpt}

{objectiveQuestion}

{clarificationRequest}

{closing}`;

/**
 * Função helper para gerar minuta de esclarecimento
 */
export function generateClarificationDraft(data) {
    let draft = CLARIFICATION_TEMPLATE;

    // Substitui placeholders
    draft = draft.replace('{certameId}', data.certameId || 'SEM DADOS NO ARQUIVO');
    draft = draft.replace('{processo}', data.processo ? `Processo: ${data.processo}` : '');
    draft = draft.replace('{orgao}', data.orgao ? `Órgão: ${data.orgao}` : '');
    draft = draft.replace('{subject}', data.subject);

    // Trecho literal
    const excerpt = data.literalExcerpt
        ? `Conforme consta no ${data.sourceDocument}, página ${data.sourcePage}:\n"${data.literalExcerpt}"`
        : 'Não foi localizado no edital disposição expressa sobre o tema.';
    draft = draft.replace('{literalExcerpt}', excerpt);

    draft = draft.replace('{objectiveQuestion}', data.objectiveQuestion);
    draft = draft.replace('{clarificationRequest}', data.clarificationRequest);
    draft = draft.replace('{closing}', data.closing);

    return draft.trim();
}

export default {
    QUESTION_CATEGORIES,
    PREDEFINED_QUESTIONS,
    USER_QUESTION_SCHEMA,
    USER_ANSWER_SCHEMA,
    USER_CONTEXT_SCHEMA,
    QUESTION_MODES,
    CLARIFICATION_TEMPLATE,
    generateClarificationDraft
};
