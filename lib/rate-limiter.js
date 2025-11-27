// In-memory rate limiting (resets on server restart)
// For production, use Redis or database

const PLANS = {
    basico: { limit: 50, name: 'Básico' },
    pro: { limit: 150, name: 'Pro' },
    premium: { limit: 500, name: 'Premium' }
};

// Store: { ip: { count: number, resetDate: string, plan: string } }
const requestCounts = new Map();

/**
 * Get current month key (YYYY-MM)
 */
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get user's plan (default: basico)
 * In production, this would query a database based on user ID
 */
function getUserPlan(ip) {
    // TODO: Implement actual plan lookup from database
    // For now, everyone gets 'basico' plan
    return 'basico';
}

/**
 * Check if request is allowed
 * @param {string} ip - Client IP address
 * @returns {object} - { allowed: boolean, remaining: number, limit: number, plan: string }
 */
export function checkRateLimit(ip) {
    const currentMonth = getCurrentMonth();
    const plan = getUserPlan(ip);
    const planConfig = PLANS[plan];

    // Get or create user data
    let userData = requestCounts.get(ip);

    // Reset if new month
    if (!userData || userData.resetDate !== currentMonth) {
        userData = {
            count: 0,
            resetDate: currentMonth,
            plan
        };
        requestCounts.set(ip, userData);
    }

    const allowed = userData.count < planConfig.limit;
    const remaining = Math.max(0, planConfig.limit - userData.count);

    return {
        allowed,
        remaining,
        limit: planConfig.limit,
        plan: planConfig.name,
        resetDate: `${currentMonth}-01` // First day of next month
    };
}

/**
 * Increment request count for IP
 * @param {string} ip - Client IP address
 */
export function incrementCount(ip) {
    const currentMonth = getCurrentMonth();
    let userData = requestCounts.get(ip);

    if (!userData || userData.resetDate !== currentMonth) {
        userData = {
            count: 1,
            resetDate: currentMonth,
            plan: getUserPlan(ip)
        };
    } else {
        userData.count++;
    }

    requestCounts.set(ip, userData);
    console.log(`[RATE LIMIT] IP: ${ip}, Count: ${userData.count}/${PLANS[userData.plan].limit}`);
}

/**
 * Get usage stats for IP
 * @param {string} ip - Client IP address
 * @returns {object} - Usage statistics
 */
export function getUsageStats(ip) {
    const userData = requestCounts.get(ip);
    const plan = getUserPlan(ip);
    const planConfig = PLANS[plan];

    if (!userData) {
        return {
            used: 0,
            limit: planConfig.limit,
            remaining: planConfig.limit,
            plan: planConfig.name
        };
    }

    return {
        used: userData.count,
        limit: planConfig.limit,
        remaining: Math.max(0, planConfig.limit - userData.count),
        plan: planConfig.name
    };
}
