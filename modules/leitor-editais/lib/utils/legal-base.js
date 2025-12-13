/**
 * ⚖️ BASE LEGAL - LICITADOR BLINDADO
 * 
 * Fundamentação legal obrigatória conforme documentação oficial.
 * Todas as análises devem estar em conformidade com este conjunto normativo.
 */

export const LEIS_BASE = {
    /**
     * Lei 14.133/2021 - Nova Lei de Licitações e Contratos
     */
    LEI_14133_2021: {
        codigo: 'Lei 14.133/2021',
        nome: 'Nova Lei de Licitações e Contratos Administrativos',
        vigencia: '2023-04-01', // Vigência plena
        url: 'http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm',
        artigosChave: {
            art3: 'Princípios das licitações',
            art6: 'Modalidades de licitação',
            art13: 'Contratação direta',
            art17: 'Exigências de habilitação',
            art18: 'Critérios de julgamento',
            art40: 'Tipos de licitação',
            art67: 'Microempresas e EPP',
        },
    },

    /**
     * Lei 8.666/1993 - Lei de Licitações (ainda aplicável em transição)
     */
    LEI_8666_1993: {
        codigo: 'Lei 8.666/1993',
        nome: 'Lei Geral de Licitações e Contratos (REVOGADA)',
        status: 'Revogada pela Lei 14.133/2021',
        aplicacao: 'Contratos anteriores a 01/04/2023',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/l8666cons.htm',
    },

    /**
     * Lei 10.520/2002 - Lei do Pregão
     */
    LEI_10520_2002: {
        codigo: 'Lei 10.520/2002',
        nome: 'Lei do Pregão',
        vigencia: 'Vigente',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/2002/l10520.htm',
        artigosChave: {
            art3: 'Fases do pregão',
            art4: 'Critérios de julgamento',
        },
    },

    /**
     * Lei 12.462/2011 - Regime Diferenciado de Contratações (RDC)
     */
    LEI_12462_2011: {
        codigo: 'Lei 12.462/2011',
        nome: 'Regime Diferenciado de Contratações Públicas (RDC)',
        vigencia: 'Vigente',
        url: 'http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12462.htm',
        aplicacao: 'Obras e serviços de engenharia específicos',
    },

    /**
     * Lei 13.303/2016 - Lei das Estatais
     */
    LEI_13303_2016: {
        codigo: 'Lei 13.303/2016',
        nome: 'Lei das Estatais',
        vigencia: 'Vigente',
        url: 'http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13303.htm',
        aplicacao: 'Empresas públicas e sociedades de economia mista',
    },

    /**
     * LC 123/2006 - Estatuto da Microempresa e EPP
     */
    LC_123_2006: {
        codigo: 'LC 123/2006',
        nome: 'Estatuto Nacional da Microempresa e Empresa de Pequeno Porte',
        vigencia: 'Vigente',
        url: 'http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
        artigosChave: {
            art42: 'Requisitos de habilitação',
            art43: 'Comprovação de regularidade fiscal',
            art44: 'Preferência de contratação',
            art47: 'Licitações exclusivas para ME/EPP',
            art48: 'Empate ficto (até 10%)',
        },
    },
};

/**
 * Jurisprudência aplicável - TCU (Tribunal de Contas da União)
 */
export const JURISPRUDENCIA_TCU = [
    {
        tipo: 'Súmula',
        numero: 'Súmula TCU 177',
        texto: 'A definição precisa e suficiente do objeto licitado constitui regra indispensável da competição.',
        aplicacao: 'Especificação de objeto',
    },
    {
        tipo: 'Súmula',
        numero: 'Súmula TCU 252',
        texto: 'Nas licitações, a exigência de atestado deve ser proporcional e pertinente às características do objeto.',
        aplicacao: 'Capacidade técnica',
    },
    {
        tipo: 'Súmula',
        numero: 'Súmula TCU 263',
        texto: 'Para defesa de decisões do TCU é admissível a juntada de documentos apenas até as contrarrazões de recurso.',
        aplicacao: 'Recursos administrativos',
    },
    {
        tipo: 'Acórdão',
        numero: 'Acórdão 2622/2013',
        texto: 'Vedação à exigência de comprovação de experiência anterior através de quantitativos mínimos irreais.',
        aplicacao: 'Capacidade técnica - proporção',
    },
    {
        tipo: 'Acórdão',
        numero: 'Acórdão 1793/2011',
        texto: 'Exigência de marca ou modelo caracteriza direcionamento de licitação.',
        aplicacao: 'Especificação de objeto',
    },
];

/**
 * Princípios das Licitações (Lei 14.133/2021, Art. 5º)
 */
export const PRINCIPIOS_LICITACAO = [
    {
        nome: 'Interesse Público',
        descricao: 'Atendimento ao interesse coletivo e finalidade pública',
    },
    {
        nome: 'Legalidade',
        descricao: 'Estrita observância das normas legais',
    },
    {
        nome: 'Impessoalidade',
        descricao: 'Tratamento igualitário a todos os licitantes',
    },
    {
        nome: 'Moralidade',
        descricao: 'Atuação ética e de boa-fé',
    },
    {
        nome: 'Publicidade',
        descricao: 'Transparência dos atos administrativos',
    },
    {
        nome: 'Eficiência',
        descricao: 'Busca da melhor relação custo-benefício',
    },
    {
        nome: 'Competitividade',
        descricao: 'Ampla competição entre licitantes',
    },
    {
        nome: 'Isonomia',
        descricao: 'Igualdade de condições entre licitantes',
    },
    {
        nome: 'Julgamento Objetivo',
        descricao: 'Critérios objetivos no julgamento de propostas',
    },
];

/**
 * Modalidades de Licitação (Lei 14.133/2021)
 */
export const MODALIDADES = {
    'pregao-eletronico': {
        codigo: 'pregao-eletronico',
        nome: 'Pregão Eletrônico',
        descricao: 'Para aquisição de bens e serviços comuns (meio eletrônico)',
        baseLegal: 'Lei 14.133/2021, Art. 6º, I + Lei 10.520/2002',
    },
    'pregao-presencial': {
        codigo: 'pregao-presencial',
        nome: 'Pregão Presencial',
        descricao: 'Para aquisição de bens e serviços comuns (presencial)',
        baseLegal: 'Lei 14.133/2021, Art. 6º, I + Lei 10.520/2002',
    },
    'pregao': {
        codigo: 'pregao',
        nome: 'Pregão',
        descricao: 'Para aquisição de bens e serviços comuns',
        baseLegal: 'Lei 14.133/2021, Art. 6º, I + Lei 10.520/2002',
    },
    'concorrencia': {
        codigo: 'concorrencia',
        nome: 'Concorrência',
        descricao: 'Para obras, serviços e compras de grande vulto',
        baseLegal: 'Lei 14.133/2021, Art. 6º, II',
    },
    'concurso': {
        codigo: 'concurso',
        nome: 'Concurso',
        descricao: 'Para trabalhos técnicos, científicos ou artísticos',
        baseLegal: 'Lei 14.133/2021, Art. 6º, III',
    },
    'leilao': {
        codigo: 'leilao',
        nome: 'Leilão',
        descricao: 'Para venda de bens',
        baseLegal: 'Lei 14.133/2021, Art. 6º, IV',
    },
    'dialogo-competitivo': {
        codigo: 'dialogo-competitivo',
        nome: 'Diálogo Competitivo',
        descricao: 'Para contratações inovadoras',
        baseLegal: 'Lei 14.133/2021, Art. 6º, V',
    },
    'dispensa-eletronica': {
        codigo: 'dispensa-eletronica',
        nome: 'Dispensa Eletrônica',
        descricao: 'Contratação direta para valores até R$ 50k (bens) ou R$ 100k (obras/serviços)',
        baseLegal: 'Lei 14.133/2021, Art. 75, II',
    },
    'dispensa': {
        codigo: 'dispensa',
        nome: 'Dispensa de Licitação',
        descricao: 'Contratação direta nos casos previstos em lei',
        baseLegal: 'Lei 14.133/2021, Art. 75',
    },
    'inexigibilidade': {
        codigo: 'inexigibilidade',
        nome: 'Inexigibilidade de Licitação',
        descricao: 'Quando há inviabilidade de competição',
        baseLegal: 'Lei 14.133/2021, Art. 74',
    },
    'tomada-precos': {
        codigo: 'tomada-precos',
        nome: 'Tomada de Preços',
        descricao: 'Modalidade da Lei 8.666/93 (revogada)',
        baseLegal: 'Lei 8.666/1993, Art. 22 (REVOGADA)',
    },
    'convite': {
        codigo: 'convite',
        nome: 'Convite',
        descricao: 'Modalidade da Lei 8.666/93 (revogada)',
        baseLegal: 'Lei 8.666/1993, Art. 22 (REVOGADA)',
    },
};

/**
 * Critérios de Habilitação (Lei 14.133/2021, Art. 62 a 70)
 */
export const CRITERIOS_HABILITACAO = {
    JURIDICA: [
        'Registro comercial',
        'Ato constitutivo ou estatuto',
        'Comprovação de representação legal',
    ],
    FISCAL: [
        'Regularidade com Fazenda Federal',
        'Regularidade com Fazenda Estadual',
        'Regularidade com Fazenda Municipal',
        'Regularidade com FGTS',
        'Regularidade trabalhista (CNDT)',
    ],
    ECONOMICO_FINANCEIRA: [
        'Certidão negativa falência/recuperação judicial',
        'Balanço patrimonial',
        'Comprovação de patrimônio líquido',
    ],
    TECNICA: [
        'Atestados de capacidade técnica',
        'Comprovação de qualificação técnica',
        'Registro em conselho profissional',
    ],
};

/**
 * Ilegalidades Comuns em Licitações
 */
export const ILEGALIDADES_COMUNS = [
    {
        tipo: 'Especificação',
        descricao: 'Exigência de marca ou modelo específico',
        baseLegal: 'Lei 14.133/2021, Art. 40, §1º',
        gravidade: 'ALTA',
    },
    {
        tipo: 'Capacidade Técnica',
        descricao: 'Exigência de quantitativos desproporcionais',
        baseLegal: 'Súmula TCU 252',
        gravidade: 'ALTA',
    },
    {
        tipo: 'Habilitação',
        descricao: 'Exigências não previstas em lei',
        baseLegal: 'Lei 14.133/2021, Art. 63',
        gravidade: 'MEDIA',
    },
    {
        tipo: 'Prazos',
        descricao: 'Prazo insuficiente para elaboração de proposta',
        baseLegal: 'Lei 14.133/2021, Art. 54 a 57',
        gravidade: 'MEDIA',
    },
    {
        tipo: 'Critério de Julgamento',
        descricao: 'Critério subjetivo sem parâmetros objetivos',
        baseLegal: 'Lei 14.133/2021, Art. 33',
        gravidade: 'ALTA',
    },
];

/**
 * Valida se uma base legal é reconhecida
 */
export function validarBaseLegal(baseLegal) {
    const leisValidas = Object.values(LEIS_BASE).map(lei => lei.codigo);
    return leisValidas.includes(baseLegal);
}

/**
 * Obtém informações de uma lei específica
 */
export function getInfoLei(codigoLei) {
    for (const [key, lei] of Object.entries(LEIS_BASE)) {
        if (lei.codigo === codigoLei) {
            return lei;
        }
    }
    return null;
}

/**
 * Busca jurisprudência relacionada a um tema
 */
export function buscarJurisprudencia(tema) {
    return JURISPRUDENCIA_TCU.filter(
        j => j.aplicacao.toLowerCase().includes(tema.toLowerCase())
    );
}

export default {
    LEIS_BASE,
    JURISPRUDENCIA_TCU,
    PRINCIPIOS_LICITACAO,
    MODALIDADES,
    CRITERIOS_HABILITACAO,
    ILEGALIDADES_COMUNS,
    validarBaseLegal,
    getInfoLei,
    buscarJurisprudencia,
};
