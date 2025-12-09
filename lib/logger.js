/**
 * Server-Side Logger
 * 
 * Sistema de logging seguro que:
 * - Só funciona no servidor (nunca expõe logs no cliente)
 * - Desabilitado automaticamente em produção
 * - Formatação colorida para dev
 * - Zero impacto de segurança
 */

const IS_SERVER = typeof window === 'undefined';
const IS_DEV = process.env.NODE_ENV !== 'production';

// ANSI colors (só funciona no terminal do servidor)
const colors = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Log genérico - Só imprime no servidor + dev mode
 */
export function log(tag, ...args) {
    if (!IS_SERVER || !IS_DEV) return;
    console.log(`${colors.blue}[${tag}]${colors.reset}`, ...args);
}

/**
 * Log de debug - Cinza claro
 */
export function debug(tag, ...args) {
    if (!IS_SERVER || !IS_DEV) return;
    console.log(`${colors.dim}[DEBUG:${tag}]${colors.reset}${colors.dim}`, ...args, colors.reset);
}

/**
 * Log de sucesso - Verde
 */
export function success(tag, ...args) {
    if (!IS_SERVER || !IS_DEV) return;
    console.log(`${colors.green}[✓ ${tag}]${colors.reset}`, ...args);
}

/**
 * Log de aviso - Amarelo
 */
export function warn(tag, ...args) {
    if (!IS_SERVER || !IS_DEV) return;
    console.warn(`${colors.yellow}[⚠ ${tag}]${colors.reset}`, ...args);
}

/**
 * Log de erro - Vermelho (SEMPRE ativo, mesmo em prod para debugging crítico)
 */
export function error(tag, ...args) {
    if (!IS_SERVER) return; // Nunca no cliente
    console.error(`${colors.red}[✗ ${tag}]${colors.reset}`, ...args);
}

/**
 * Log de informação - Ciano
 */
export function info(tag, ...args) {
    if (!IS_SERVER || !IS_DEV) return;
    console.info(`${colors.cyan}[ℹ ${tag}]${colors.reset}`, ...args);
}

// Export default com todos os métodos
const logger = {
    log,
    debug,
    success,
    warn,
    error,
    info
};

export default logger;
