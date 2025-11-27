import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Get current month key (YYYY-MM)
 */
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get log file path for current month
 */
function getLogFilePath() {
    const month = getCurrentMonth();
    return path.join(LOGS_DIR, `usage-${month}.json`);
}

/**
 * Load usage log for current month
 */
function loadLog() {
    try {
        const filePath = getLogFilePath();
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return { month: getCurrentMonth(), requests: [] };
    } catch (error) {
        console.error('[USAGE TRACKER] Failed to load log:', error);
        return { month: getCurrentMonth(), requests: [] };
    }
}

/**
 * Save usage log
 */
function saveLog(log) {
    try {
        const filePath = getLogFilePath();
        fs.writeFileSync(filePath, JSON.stringify(log, null, 2));
    } catch (error) {
        console.error('[USAGE TRACKER] Failed to save log:', error);
    }
}

/**
 * Track API usage
 * @param {object} params - Usage parameters
 */
export function trackUsage({ ip, description, cached, inputTokens, outputTokens, plan }) {
    try {
        const log = loadLog();

        // Estimate costs (based on Gemini 2.5 Flash pricing)
        const INPUT_COST_PER_MILLION = 0.30; // USD
        const OUTPUT_COST_PER_MILLION = 2.50; // USD
        const BRL_RATE = 5.00; // USD to BRL conversion

        const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
        const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
        const totalCostUSD = inputCost + outputCost;
        const totalCostBRL = totalCostUSD * BRL_RATE;

        const entry = {
            timestamp: new Date().toISOString(),
            ip,
            description: description.substring(0, 100), // First 100 chars
            cached,
            plan,
            tokens: {
                input: inputTokens,
                output: outputTokens,
                total: inputTokens + outputTokens
            },
            cost: {
                usd: parseFloat(totalCostUSD.toFixed(6)),
                brl: parseFloat(totalCostBRL.toFixed(4))
            }
        };

        log.requests.push(entry);
        saveLog(log);

        console.log(`[USAGE TRACKER] Logged request - Cached: ${cached}, Cost: R$ ${totalCostBRL.toFixed(4)}`);
    } catch (error) {
        console.error('[USAGE TRACKER] Failed to track usage:', error);
    }
}

/**
 * Get usage statistics for current month
 */
export function getMonthlyStats() {
    try {
        const log = loadLog();

        const totalRequests = log.requests.length;
        const cachedRequests = log.requests.filter(r => r.cached).length;
        const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests * 100).toFixed(2) : 0;

        const totalCostUSD = log.requests.reduce((sum, r) => sum + r.cost.usd, 0);
        const totalCostBRL = log.requests.reduce((sum, r) => sum + r.cost.brl, 0);

        const totalTokens = log.requests.reduce((sum, r) => sum + r.tokens.total, 0);

        return {
            month: log.month,
            totalRequests,
            cachedRequests,
            cacheHitRate: parseFloat(cacheHitRate),
            totalCost: {
                usd: parseFloat(totalCostUSD.toFixed(4)),
                brl: parseFloat(totalCostBRL.toFixed(2))
            },
            totalTokens,
            averageCostPerRequest: {
                usd: totalRequests > 0 ? parseFloat((totalCostUSD / totalRequests).toFixed(6)) : 0,
                brl: totalRequests > 0 ? parseFloat((totalCostBRL / totalRequests).toFixed(4)) : 0
            }
        };
    } catch (error) {
        console.error('[USAGE TRACKER] Failed to get stats:', error);
        return null;
    }
}
