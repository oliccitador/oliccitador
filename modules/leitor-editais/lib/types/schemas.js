/**
 * 📋 SCHEMAS DE DADOS - LICITADOR BLINDADO
 * 
 * Define todos os schemas JSON para comunicação entre agentes
 * conforme especificado na documentação oficial.
 */

/**
 * Schema de Origem - Citação obrigatória
 * Toda conclusão DEVE incluir origem com documento, página e trecho
 */
export const OrigemSchema = {
    documento: '', // Nome do arquivo fonte
    pagina: 0,     // Número da página
    trecho: '',    // Trecho literal extraído
};

/**
 * Schema de Output - Padrão para todos os agentes
 */
export const AgentOutputSchema = {
    agente: '',           // Nome do agente (ex: "TechnicalValidator")
    status: 'ok',         // 'ok' | 'erro' | 'parcial'
    timestamp: '',        // ISO 8601
    dados: {},            // Dados específicos do agente
    origem: OrigemSchema, // Citação obrigatória
    avisos: [],           // Array de warnings não bloqueantes
};

/**
 * AGENTE 1 - Ingestor Engine (OCR)
 */
export const IngestorOutputSchema = {
    tipo: '', // 'edital' | 'tr' | 'minuta' | 'ata' | 'anexo' | 'planilha'
    texto: '', // Texto completo extraído
    paginas: [], // Array de textos por página
    linhas: [], // Array de linhas individuais
    metadata: {
        totalPaginas: 0,
        tamanhoBytes: 0,
        dataProcessamento: '',
        ocrQuality: 0, // 0-100
    },
};

/**
 * AGENTE 2 - Structure Mapper
 */
export const StructureOutputSchema = {
    modalidade: '', // 'pregao' | 'concorrencia' | 'tomada-precos' | etc
    processo: '', // Número do processo
    orgao: '', // Nome do órgão
    objeto: '', // Descrição do objeto
    datas: {
        publicacao: null, // Date
        abertura: null, // Date
        entregaProposta: null, // Date
        sessaoPublica: null, // Date
    },
    secoes: [
        {
            numero: '',
            titulo: '',
            nivel: 0, // Hierarquia (1, 2, 3...)
            paginaInicio: 0,
            paginaFim: 0,
            conteudo: '',
        },
    ],
    origem: OrigemSchema,
};

/**
 * AGENTE 3 - Item Classifier
 */
export const ItemSchema = {
    item: 0, // Número do item
    descricao: '', // Descrição completa
    unidade: '', // UN, KG, M², etc
    quantidade: 0,
    valorEstimado: 0,
    especificacoes: [], // Array de specs técnicas
    normasTecnicas: [], // ABNT, INMETRO, etc
    marcasReferenciais: [], // Se houver
    classificacao: '', // 'ELEGIVEL' | 'DUVIDA' | 'INCOMPATIVEL'
    motivo: '', // Justificativa da classificação
    cnaeEmpresa: '', // CNAE que se aplica
    origem: OrigemSchema,
};

/**
 * AGENTE 4 - Compliance Checker
 */
export const ComplianceOutputSchema = {
    exigencias: [
        {
            tipo: '', // 'fiscal' | 'contabil' | 'cadastral' | 'juridica'
            descricao: '',
            obrigatoria: true,
            baseLegal: '',
            risco: '', // 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
            status: '', // 'ATENDE' | 'NAO_ATENDE' | 'VERIFICAR'
            acoes: [], // Ações necessárias
            origem: OrigemSchema,
        },
    ],
    checklist: [
        {
            item: '',
            status: false,
            observacao: '',
        },
    ],
    ilegalidades: [
        {
            tipo: '',
            descricao: '',
            fundamentacao: '',
            sugestaoImpugnacao: '',
            origem: OrigemSchema,
        },
    ],
};

/**
 * AGENTE 5 - Technical Validator
 */
export const TechnicalOutputSchema = {
    requisitos: [
        {
            tipo: '', // 'atestado' | 'certidao' | 'comprovacao'
            descricao: '',
            quantidadeMinima: 0,
            percentualExigido: 0,
            proporcional: true,
            pertinente: true,
            analise: '',
            risco: '', // 'BAIXO' | 'MEDIO' | 'ALTO'
            origem: OrigemSchema,
        },
    ],
    abusos: [
        {
            descricao: '',
            fundamentacaoLegal: '',
            recomendacao: '',
            origem: OrigemSchema,
        },
    ],
    gatilhosImpugnacao: [
        {
            motivo: '',
            urgencia: '', // 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
            origem: OrigemSchema,
        },
    ],
};

/**
 * AGENTE 6 - Legal Mind Engine (CRÍTICO)
 */
export const LegalOutputSchema = {
    analiseJuridica: [
        {
            clausula: '',
            paginaEdital: 0,
            trechoLiteral: '',
            interpretacao: '',
            baseLegal: '', // Lei específica
            legalidade: '', // 'LEGAL' | 'QUESTIONAVEL' | 'ILEGAL'
            fundamentacao: '',
            origem: OrigemSchema,
        },
    ],
    ilegalidades: [
        {
            tipo: '',
            descricao: '',
            leisVioladas: [],
            gravidade: '', // 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
            fundamentacao: '',
            minutaSugerida: '',
            origem: OrigemSchema,
        },
    ],
    minutas: {
        impugnacao: {
            disponivel: false,
            conteudo: '',
            fundamentacao: [],
        },
        recurso: {
            disponivel: false,
            conteudo: '',
            fundamentacao: [],
        },
        esclarecimento: {
            disponivel: false,
            conteudo: '',
            fundamentacao: [],
        },
    },
};

/**
 * AGENTE 7 - Divergence Scanner
 */
export const DivergenceSchema = {
    tipo: '', // 'quantidade' | 'descricao' | 'prazo' | 'especificacao'
    item: 0,
    campo: '',
    valorEdital: '',
    valorTR: '',
    impacto: '', // 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
    recomendacao: '',
    origemEdital: OrigemSchema,
    origemTR: OrigemSchema,
};

export const DivergenceOutputSchema = {
    totalDivergencias: 0,
    divergencias: [],
    resumo: {
        quantidade: 0,
        descricao: 0,
        prazo: 0,
        especificacao: 0,
    },
    impactoGeral: '', // 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
};

/**
 * AGENTE 8 - Decision Core
 */
export const DecisionOutputSchema = {
    decisao: '', // 'PARTICIPAR' | 'NAO_PARTICIPAR'
    confianca: 0, // 0-100
    analiseRiscos: {
        tecnico: { nivel: '', peso: 0, detalhes: '' },
        juridico: { nivel: '', peso: 0, detalhes: '' },
        financeiro: { nivel: '', peso: 0, detalhes: '' },
        operacional: { nivel: '', peso: 0, detalhes: '' },
        compliance: { nivel: '', peso: 0, detalhes: '' },
    },
    pontosCriticos: [],
    pontosPositivos: [],
    recomendacoes: [],
    justificativa: '',
    acoes: [
        {
            tipo: '',
            descricao: '',
            prazo: '',
            prioridade: '',
        },
    ],
};

/**
 * AGENTE 9 - Report Synthesizer
 */
export const ReportOutputSchema = {
    htmlContent: '',
    pdfUrl: '',
    anexoIUrl: '',
    minutasUrls: {
        impugnacao: '',
        recurso: '',
        esclarecimento: '',
    },
    metadata: {
        dataGeracao: '',
        totalPaginas: 0,
        tamanhoKB: 0,
    },
};

/**
 * Schema de Erro - Padrão para todos os agentes
 */
export const ErrorSchema = {
    tipo: 'erro',
    agente: '',
    mensagem: '',
    acao: '', // O que foi feito (ex: "retornar SEM DADOS NO ARQUIVO")
    timestamp: '',
    stack: '', // Stack trace se disponível
};

/**
 * Schema Final - Output do Orquestrador
 */
export const FinalOutputSchema = {
    status: '', // 'sucesso' | 'parcial' | 'erro'
    execucaoId: '',
    timestamp: '',
    tempoTotal: 0, // em segundos

    // Outputs de cada agente
    ingestor: IngestorOutputSchema,
    structure: StructureOutputSchema,
    items: [],
    compliance: ComplianceOutputSchema,
    technical: TechnicalOutputSchema,
    legal: LegalOutputSchema,
    divergences: DivergenceOutputSchema,
    decision: DecisionOutputSchema,
    report: ReportOutputSchema,

    // Metadados e logs
    metadados: {
        totalDocumentos: 0,
        totalItens: 0,
        totalDivergencias: 0,
        totalIlegalidades: 0,
    },

    logs: [], // Array de ErrorSchema

    // Caixa preta - tudo que foi encontrado
    caixaPreta: {},
};

/**
 * Constantes de valores padronizados
 */
export const CONSTANTS = {
    TIPOS_DOCUMENTO: ['edital', 'tr', 'minuta', 'ata', 'anexo', 'planilha'],
    MODALIDADES: ['pregao', 'concorrencia', 'tomada-precos', 'convite', 'concurso', 'leilao', 'dialogo-competitivo', 'rdc'],
    CLASSIFICACOES: ['ELEGIVEL', 'DUVIDA', 'INCOMPATIVEL'],
    NIVEIS_RISCO: ['BAIXO', 'MEDIO', 'ALTO', 'CRITICO'],
    DECISOES: ['PARTICIPAR', 'NAO_PARTICIPAR'],
    STATUS: ['ok', 'erro', 'parcial'],

    // Base Legal Obrigatória
    LEIS_BASE: [
        'Lei 14.133/2021',
        'Lei 8.666/1993',
        'Lei 10.520/2002',
        'Lei 12.462/2011',
        'Lei 13.303/2016',
        'LC 123/2006',
    ],
};

export default {
    OrigemSchema,
    AgentOutputSchema,
    IngestorOutputSchema,
    StructureOutputSchema,
    ItemSchema,
    ComplianceOutputSchema,
    TechnicalOutputSchema,
    LegalOutputSchema,
    DivergenceSchema,
    DivergenceOutputSchema,
    DecisionOutputSchema,
    ReportOutputSchema,
    ErrorSchema,
    FinalOutputSchema,
    CONSTANTS,
};
