import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Determine the cache root directory
// In Netlify functions (production), /var/task is read-only, so we must use /tmp
// In local development, we can use the project root
const CACHE_DIR = process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join('/tmp', '.cache')
    : path.resolve(process.cwd(), '.cache');

const CACHE_TTL_DAYS = 7;

// Ensure cache directory exists
try {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        console.log(`[CACHE] Created directory at ${CACHE_DIR}`);
    }
} catch (error) {
    console.error(`[CACHE ERROR] Failed to create directory at ${CACHE_DIR}:`, error);
}

/**
 * Generate cache key from description
 */
function getCacheKey(description) {
    return crypto.createHash('md5').update(description.trim().toLowerCase()).digest('hex');
}

/**
 * Get cache file path
 */
function getCacheFilePath(key) {
    return path.join(CACHE_DIR, `${key}.json`);
}

/**
 * Check if cache entry is expired
 */
function isExpired(timestamp) {
    const now = Date.now();
    const age = now - timestamp;
    const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms
    return age > maxAge;
}

/**
 * Get cached result
 * @param {string} description - The description to look up
 * @returns {object|null} - Cached result or null if not found/expired
 */
export async function getCache(description) {
    try {
        const key = getCacheKey(description);
        const filePath = getCacheFilePath(key);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (isExpired(data.timestamp)) {
            // Delete expired cache
            fs.unlinkSync(filePath);
            return null;
        }

        console.log(`[CACHE HIT] Key: ${key}`);
        return data.result;
    } catch (error) {
        console.error('[CACHE ERROR] Failed to read cache:', error);
        return null;
    }
}

/**
 * Save result to cache
 * @param {string} description - The description used as key
 * @param {object} result - The result to cache
 */
export async function setCache(description, result) {
    try {
        const key = getCacheKey(description);
        const filePath = getCacheFilePath(key);

        const data = {
            timestamp: Date.now(),
            description: description.substring(0, 100), // Store first 100 chars for reference
            result
        };

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`[CACHE SET] Key: ${key}`);
    } catch (error) {
        console.error('[CACHE ERROR] Failed to write cache:', error);
    }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache() {
    try {
        if (!fs.existsSync(CACHE_DIR)) return 0;

        const files = fs.readdirSync(CACHE_DIR);
        let cleared = 0;

        files.forEach(file => {
            const filePath = path.join(CACHE_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (isExpired(data.timestamp)) {
                fs.unlinkSync(filePath);
                cleared++;
            }
        });

        console.log(`[CACHE] Cleared ${cleared} expired entries`);
        return cleared;
    } catch (error) {
        console.error('[CACHE ERROR] Failed to clear expired cache:', error);
        return 0;
    }
}
