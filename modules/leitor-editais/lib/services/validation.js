/**
 * ✅ SERVIÇO DE VALIDAÇÃO - LICITADOR BLINDADO
 * 
 * Validações centralizadas para garantir integridade dos dados
 * e conformidade com regras anti-alucinação.
 */

import { CONSTANTS } from '../types/schemas.js';
import { getLogger } from './logger.js';

const logger = getLogger();

/**
 * Valida se um valor não está vazio
 */
export function validateNotEmpty(valor, campo, agente) {
    if (!valor || valor === '' || valor === null || valor === undefined) {
        logger.warn(agente, `Campo "${campo}" vazio`, { campo });
        return false;
    }
    return true;
}

/**
 * Valida se origem está completa e válida
 * REGRA CRÍTICA: Toda conclusão DEVE ter origem com documento, página e trecho
 */
export function validateOrigem(origem, agente, campo = 'desconhecido') {
    if (!origem) {
        logger.error(
            agente,
            `Campo "${campo}" sem origem`,
            { campo },
            'exigir origem válida'
        );
        return false;
    }

    if (!origem.documento || origem.documento === '') {
        logger.error(
            agente,
            `Origem sem documento em campo "${campo}"`,
            { campo, origem },
            'exigir documento válido'
        );
        return false;
    }

    if (origem.pagina === null || origem.pagina === undefined || origem.pagina < 0) {
        logger.error(
            agente,
            `Origem sem página válida em campo "${campo}"`,
            { campo, origem },
            'exigir página válida'
        );
        return false;
    }

    if (!origem.trecho || origem.trecho === '') {
        logger.error(
            agente,
            `Origem sem trecho literal em campo "${campo}"`,
            { campo, origem },
            'exigir trecho válido'
        );
        return false;
    }

    logger.debug(agente, `Origem válida para campo "${campo}"`, { origem });
    return true;
}

/**
 * Cria origem padrão quando não há dados
 */
export function createEmptyOrigem() {
    return {
        documento: 'SEM DADOS NO ARQUIVO',
        pagina: 0,
        trecho: 'SEM DADOS NO ARQUIVO',
    };
}

/**
 * Valida se tipo de documento é reconhecido
 */
export function validateTipoDocumento(tipo, agente) {
    if (!CONSTANTS.TIPOS_DOCUMENTO.includes(tipo)) {
        logger.warn(
            agente,
            `Tipo de documento não reconhecido: "${tipo}"`,
            { tipo, tiposValidos: CONSTANTS.TIPOS_DOCUMENTO }
        );
        return false;
    }
    return true;
}

/**
 * Valida se modalidade é reconhecida
 */
export function validateModalidade(modalidade, agente) {
    if (!CONSTANTS.MODALIDADES.includes(modalidade)) {
        logger.warn(
            agente,
            `Modalidade não reconhecida: "${modalidade}"`,
            { modalidade, modalidadesValidas: CONSTANTS.MODALIDADES }
        );
        return false;
    }
    return true;
}

/**
 * Valida se classificação de item é válida
 */
export function validateClassificacao(classificacao, agente) {
    if (!CONSTANTS.CLASSIFICACOES.includes(classificacao)) {
        logger.error(
            agente,
            `Classificação inválida: "${classificacao}"`,
            { classificacao, classificacoesValidas: CONSTANTS.CLASSIFICACOES },
            'usar classificação válida'
        );
        return false;
    }
    return true;
}

/**
 * Valida se nível de risco é válido
 */
export function validateNivelRisco(nivel, agente) {
    if (!CONSTANTS.NIVEIS_RISCO.includes(nivel)) {
        logger.error(
            agente,
            `Nível de risco inválido: "${nivel}"`,
            { nivel, niveisValidos: CONSTANTS.NIVEIS_RISCO },
            'usar nível válido'
        );
        return false;
    }
    return true;
}

/**
 * Valida se decisão é válida
 */
export function validateDecisao(decisao, agente) {
    if (!CONSTANTS.DECISOES.includes(decisao)) {
        logger.error(
            agente,
            `Decisão inválida: "${decisao}"`,
            { decisao, decisoesValidas: CONSTANTS.DECISOES },
            'usar decisão válida'
        );
        return false;
    }
    return true;
}

/**
 * Valida estrutura de data
 */
export function validateData(data, campo, agente) {
    if (!data) {
        logger.debug(agente, `Campo de data "${campo}" vazio`);
        return null;
    }

    try {
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) {
            logger.warn(
                agente,
                `Data inválida em campo "${campo}": "${data}"`,
                { campo, data }
            );
            return null;
        }
        return dataObj;
    } catch (error) {
        logger.error(
            agente,
            `Erro ao validar data em campo "${campo}"`,
            { campo, data, error: error.message },
            'retornar null'
        );
        return null;
    }
}

/**
 * Valida CNAE
 */
export function validateCNAE(cnae, agente) {
    // Formato: XXXX-X/XX
    const cnaeRegex = /^\d{4}-\d{1}\/\d{2}$/;

    if (!cnae || !cnaeRegex.test(cnae)) {
        logger.warn(
            agente,
            `CNAE em formato inválido: "${cnae}"`,
            { cnae, formatoEsperado: 'XXXX-X/XX' }
        );
        return false;
    }

    return true;
}

/**
 * Valida número de processo
 */
export function validateNumeroProcesso(numero, agente) {
    if (!numero || numero === '') {
        logger.warn(agente, 'Número de processo vazio');
        return false;
    }

    // Aceita diversos formatos comuns
    return true;
}

/**
 * Valida se output de agente está conforme schema
 */
export function validateAgentOutput(output, agente) {
    if (!output) {
        logger.error(agente, 'Output vazio ou null', {}, 'retornar erro');
        return false;
    }

    if (!output.agente && !output.agent_id) {
        logger.error(agente, 'Output sem identificação de agente', {}, 'adicionar campo agente');
        return false;
    }

    if (!output.status || !CONSTANTS.STATUS.includes(output.status)) {
        logger.error(
            agente,
            'Output sem status válido',
            { status: output.status },
            'adicionar status válido'
        );
        return false;
    }

    if (!output.timestamp) {
        logger.warn(agente, 'Output sem timestamp', {});
    }

    logger.debug(agente, 'Output validado com sucesso');
    return true;
}

/**
 * Sanitiza texto extraído (remove caracteres problemáticos)
 */
export function sanitizeText(text) {
    if (!text) return '';

    return text
        .replace(/\r\n/g, '\n') // Normaliza quebras de linha
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ') // Substitui tabs por espaços
        .replace(/\u0000/g, '') // Remove null characters
        .trim();
}

/**
 * Valida tamanho de arquivo
 */
export function validateFileSize(sizeBytes, maxSizeMB = 50) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (sizeBytes > maxSizeBytes) {
        logger.error(
            'FileValidator',
            `Arquivo muito grande: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB`,
            { sizeBytes, maxSizeMB },
            'rejeitar arquivo'
        );
        return false;
    }

    return true;
}

/**
 * Valida extensão de arquivo
 */
export function validateFileExtension(filename, allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'png']) {
    const ext = filename.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
        logger.error(
            'FileValidator',
            `Extensão não permitida: .${ext}`,
            { filename, allowedExtensions },
            'rejeitar arquivo'
        );
        return false;
    }

    return true;
}

/**
 * Aplica regra de "SEM DADOS NO ARQUIVO" quando necessário
 */
export function applySemDados(valor, agente, campo) {
    if (!validateNotEmpty(valor, campo, agente)) {
        logger.info(
            agente,
            `Aplicando "SEM DADOS NO ARQUIVO" em campo "${campo}"`,
            { campo }
        );
        return 'SEM DADOS NO ARQUIVO';
    }
    return valor;
}

/**
 * Wrapper para validação completa de dado com origem
 */
export function validateDadoComOrigem(valor, origem, campo, agente) {
    // Valida valor
    if (!validateNotEmpty(valor, campo, agente)) {
        return {
            valido: false,
            valor: 'SEM DADOS NO ARQUIVO',
            origem: createEmptyOrigem(),
        };
    }

    // Valida origem
    if (!validateOrigem(origem, agente, campo)) {
        return {
            valido: false,
            valor,
            origem: createEmptyOrigem(),
            erro: 'Origem inválida ou incompleta',
        };
    }

    return {
        valido: true,
        valor,
        origem,
    };
}

export default {
    validateNotEmpty,
    validateOrigem,
    createEmptyOrigem,
    validateTipoDocumento,
    validateModalidade,
    validateClassificacao,
    validateNivelRisco,
    validateDecisao,
    validateData,
    validateCNAE,
    validateNumeroProcesso,
    validateAgentOutput,
    sanitizeText,
    validateFileSize,
    validateFileExtension,
    applySemDados,
    validateDadoComOrigem,
};
