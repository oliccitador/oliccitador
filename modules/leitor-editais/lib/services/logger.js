/**
 * 📝 SISTEMA DE LOGS - LICITADOR BLINDADO
 * 
 * Sistema centralizado de logs com níveis, timestamps e
 * rastreamento completo de execução dos agentes.
 */

import { ErrorSchema } from '../types/schemas.js';

class Logger {
    constructor() {
        this.logs = [];
        this.level = process.env.LOG_LEVEL || 'info';
        this.enableDebug = process.env.ENABLE_DEBUG_LOGS === 'true';
    }

    /**
     * Níveis de log
     * DEBUG < INFO < WARN < ERROR < CRITICAL
     */
    levels = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        CRITICAL: 4,
    };

    /**
     * Formata timestamp em ISO 8601
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Log de debug (desenvolvimento)
     */
    debug(agente, mensagem, dados = null) {
        if (!this.enableDebug) return;

        this._log('DEBUG', agente, mensagem, dados);
    }

    /**
     * Log de informação
     */
    info(agente, mensagem, dados = null) {
        this._log('INFO', agente, mensagem, dados);
    }

    /**
     * Log de warning (não bloqueia execução)
     */
    warn(agente, mensagem, dados = null) {
        this._log('WARN', agente, mensagem, dados);
    }

    /**
     * Log de erro (pode bloquear execução)
     */
    error(agente, mensagem, dados = null, acao = 'retornar SEM DADOS NO ARQUIVO') {
        const errorLog = {
            tipo: 'erro',
            nivel: 'ERROR',
            agente,
            mensagem,
            acao,
            timestamp: this.getTimestamp(),
            dados: dados || null,
            stack: dados?.stack || null,
        };

        this.logs.push(errorLog);

        // Log no console em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.error(`[ERROR] [${agente}] ${mensagem}`, dados);
        }

        return errorLog;
    }

    /**
     * Log crítico (bloqueia execução)
     */
    critical(agente, mensagem, dados = null, acao = 'interromper execução') {
        const criticalLog = {
            tipo: 'erro',
            nivel: 'CRITICAL',
            agente,
            mensagem,
            acao,
            timestamp: this.getTimestamp(),
            dados: dados || null,
            stack: dados?.stack || null,
        };

        this.logs.push(criticalLog);

        // Log no console sempre
        console.error(`[CRITICAL] [${agente}] ${mensagem}`, dados);

        return criticalLog;
    }

    /**
     * Log interno (private)
     */
    _log(nivel, agente, mensagem, dados) {
        const logEntry = {
            nivel,
            agente,
            mensagem,
            timestamp: this.getTimestamp(),
            dados: dados || null,
        };

        this.logs.push(logEntry);

        // Log no console em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            const emoji = {
                DEBUG: '🔍',
                INFO: 'ℹ️',
                WARN: '⚠️',
                ERROR: '❌',
                CRITICAL: '🚨',
            }[nivel];

            console.log(`${emoji} [${nivel}] [${agente}] ${mensagem}`, dados || '');
        }
    }

    /**
     * Registra início de execução de agente
     */
    startAgent(agente) {
        this.info(agente, `🚀 Iniciando execução`, {
            timestamp: this.getTimestamp(),
        });
    }

    /**
     * Registra fim de execução de agente
     */
    endAgent(agente, status, tempoMs) {
        const emoji = status === 'ok' ? '✅' : status === 'erro' ? '❌' : '⚠️';

        this.info(agente, `${emoji} Execução finalizada`, {
            status,
            tempoMs,
            tempoSegundos: (tempoMs / 1000).toFixed(2),
        });
    }

    /**
     * Registra validação de anti-alucinação
     */
    validateNoHallucination(agente, campo, valor, origem) {
        if (!valor || valor === '') {
            this.warn(
                agente,
                `Campo "${campo}" vazio - usando SEM DADOS NO ARQUIVO`,
                { campo, origem }
            );
            return 'SEM DADOS NO ARQUIVO';
        }

        if (!origem || !origem.documento || !origem.pagina) {
            this.error(
                agente,
                `Campo "${campo}" sem citação de origem válida`,
                { campo, valor, origem },
                'exigir origem válida'
            );
            throw new Error(`VALIDAÇÃO FALHOU: Campo "${campo}" sem origem válida`);
        }

        this.debug(agente, `Validação OK: "${campo}" tem origem válida`, { origem });
        return valor;
    }

    /**
     * Obtém todos os logs
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Obtém apenas erros
     */
    getErrors() {
        return this.logs.filter(log => log.nivel === 'ERROR' || log.nivel === 'CRITICAL');
    }

    /**
     * Obtém estatísticas de execução
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            critical: 0,
        };

        this.logs.forEach(log => {
            const nivel = log.nivel.toLowerCase();
            if (stats[nivel] !== undefined) {
                stats[nivel]++;
            }
        });

        return stats;
    }

    /**
     * Limpa logs (usar com cuidado)
     */
    clear() {
        this.logs = [];
        this.info('Logger', 'Logs limpos');
    }

    /**
     * Exporta logs para JSON
     */
    exportJSON() {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Exporta logs para formato de caixa preta
     */
    exportBlackBox() {
        return {
            totalLogs: this.logs.length,
            stats: this.getStats(),
            errors: this.getErrors(),
            timeline: this.logs.map(log => ({
                timestamp: log.timestamp,
                nivel: log.nivel,
                agente: log.agente,
                mensagem: log.mensagem,
            })),
            fullLogs: this.logs,
        };
    }
}

// Singleton instance
let loggerInstance = null;

export function getLogger() {
    if (!loggerInstance) {
        loggerInstance = new Logger();
    }
    return loggerInstance;
}

export function createLogger() {
    return new Logger();
}

export default {
    getLogger,
    createLogger,
};
