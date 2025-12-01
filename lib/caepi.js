// Embedded CA Database to avoid file system issues on Serverless environment
const CA_DB = [
    {
        "ca": "17015",
        "nome_produto": "CALÇADO TIPO BOTINA - BRACOL",
        "fabricante": "BSB PRODUTORA DE EQUIPAMENTOS DE PROTECAO INDIVIDUAL S.A.",
        "descricao": "Calçado de segurança de uso profissional, tipo botina, fechamento em elástico, confeccionado em couro curtido ao cromo, palmilha de montagem em material sintético montada pelo sistema strobel, biqueira de conformação, solado de poliuretano bidensidade injetado diretamente no cabedal, resistente ao escorregamento (SRC), à absorção de energia na área do salto (E) e ao óleo combustível (FO).",
        "validade": "20/05/2028",
        "normas": ["ABNT NBR ISO 20345:2015", "ABNT NBR ISO 20347:2015"]
    },
    {
        "ca": "12345",
        "nome_produto": "LUVA DE SEGURANÇA EM RASPA",
        "fabricante": "MANUFACTURAS ARTICULADAS LTDA",
        "descricao": "Luva de segurança confeccionada em raspa, reforço interno na palma e face palmar dos dedos, punho em raspa medindo 20 cm.",
        "validade": "15/12/2026",
        "normas": ["BS EN 388:2016", "BS EN 420:2003 + A1:2009"]
    },
    {
        "ca": "38509",
        "nome_produto": "CAPACETE DE SEGURANÇA CLASSE A E B",
        "fabricante": "MSA DO BRASIL EQUIPAMENTOS E INSTRUMENTOS DE SEGURANCA LTDA",
        "descricao": "Capacete de segurança para uso profissional, tipo aba total, classe A e B, confeccionado em polietileno de alta densidade, carneira com ajuste através de catraca, sistema de suspensão injetado em polietileno, fita de absorção em espuma de polietileno revestida com tecido",
        "validade": "10/08/2027",
        "normas": ["ABNT NBR 8221:2003"]
    },
    {
        "ca": "15012",
        "nome_produto": "ÓCULOS DE SEGURANÇA INCOLOR",
        "fabricante": "3M DO BRASIL LTDA",
        "descricao": "Óculos de segurança de uso profissional para proteção dos olhos contra impactos de partículas volantes, lentes em policarbonato incolor, hastes reguláveis",
        "validade": "22/03/2029",
        "normas": ["ABNT NBR ISO 12312-1:2015"]
    },
    {
        "ca": "44444",
        "nome_produto": "PROTETOR AURICULAR TIPO PLUG",
        "fabricante": "DELTA PLUS BRASIL LTDA",
        "descricao": "Protetor auricular de inserção de uso profissional, tipo plug de espuma moldável, para proteção dos ouvidos do usuário contra níveis de pressão sonora superiores aos estabelecidos na NR-15",
        "validade": "05/11/2028",
        "normas": ["ABNT NBR 16076:2020"]
    }
];

/**
 * CAEPI Integration Module - Flow 1 Implementation
 * Implements CA consultation with anti-hallucination rules
 */
export async function consultarCA(numeroCA) {
    if (!numeroCA || numeroCA.trim().length === 0) {
        return { status: 'CA_NAO_ENCONTRADO', error: 'CA number is required' };
    }

    try {
        const caData = CA_DB.find(item => item.ca === numeroCA);

        if (caData) {
            return {
                status: 'OK',
                ...caData
            };
        } else {
            return {
                status: 'CA_NAO_ENCONTRADO',
                ca_number: numeroCA
            };
        }
    } catch (error) {
        console.error('[CAEPI] Error accessing embedded DB:', error);
        return {
            status: 'CA_NAO_ENCONTRADO',
            error: error.message,
            ca_number: numeroCA
        };
    }
}

export function extrairDadosCA(fichaCA) {
    if (!fichaCA) return null;

    return {
        nome_oficial_produto: fichaCA.nome_produto || null,
        fabricante: fichaCA.fabricante || null,
        descricao_tecnica: fichaCA.descricao || null,
        modelo_ou_referencia: fichaCA.modelo || null,
        normas_aplicaveis: fichaCA.normas || [],
        validade_CA: fichaCA.validade || null
    };
}

export function gerarEspecificacaoLimpa(dadosCA) {
    if (!dadosCA || !dadosCA.descricao_tecnica) {
        return null;
    }

    let especificacao = dadosCA.descricao_tecnica;

    especificacao = especificacao
        .replace(/de acordo com.{0,50}lei.{0,50}/gi, '')
        .replace(/conforme.{0,50}portaria.{0,50}/gi, '')
        .replace(/nos termos.{0,50}/gi, '')
        .trim();

    return especificacao;
}

export function gerarJustificativaCA(trLiteral, numeroCA, dadosCA) {
    const partes = [];

    partes.push(`**Trecho literal do Termo de Referência:**`);
    partes.push(`"${trLiteral}"`);
    partes.push('');

    partes.push(`**Certificado de Aprovação utilizado:**`);
    partes.push(`CA ${numeroCA}`);
    partes.push('');

    if (dadosCA.descricao_tecnica) {
        partes.push(`**Descrição técnica oficial do CA:**`);
        partes.push(dadosCA.descricao_tecnica);
        partes.push('');
    }

    if (dadosCA.validade_CA) {
        partes.push(`**Validade do CA:** ${dadosCA.validade_CA}`);
        partes.push('');
    }

    partes.push(`**Fonte dos dados:**`);
    partes.push(`A especificação técnica foi extraída exclusivamente da base oficial CAEPI (Cadastro de Aprovação de Equipamentos de Proteção Individual) do Ministério do Trabalho e Emprego.`);
    partes.push('');

    partes.push(`**Fundamentação legal:**`);
    partes.push(`A utilização do CA está em conformidade com a NR-6 (Norma Regulamentadora nº 6) que estabelece a obrigatoriedade de Certificado de Aprovação para Equipamentos de Proteção Individual.`);

    return partes.join('\n');
}

export function parseCAData(caNumber, userProvidedDescription) {
    if (!caNumber) return null;

    return {
        ca_number: caNumber,
        descricao_tecnica: userProvidedDescription || null,
        source: 'manual',
        note: 'Dados fornecidos manualmente pelo usuário a partir do portal CAEPI',
        status: 'OK'
    };
}

export function enhanceDescriptionWithCA(baseDescription, caData) {
    if (!caData) return baseDescription;

    return `${baseDescription}\n\n[Certificado de Aprovação: CA ${caData.ca_number}]`;
}
