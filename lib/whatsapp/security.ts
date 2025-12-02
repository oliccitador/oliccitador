/**
 * Security Layer
 * Handles webhook verification, rate limiting, and content filtering
 */

import crypto from 'crypto';

export class SecurityLayer {
    private static messageCache = new Map<string, number[]>();
    private static readonly MAX_MESSAGES_PER_MINUTE = 10;
    private static readonly LOOP_DETECTION_WINDOW = 5; // Last 5 messages

    /**
     * Verify WhatsApp webhook signature
     */
    static verifyWebhookSignature(
        signature: string,
        body: string,
        verifyToken: string
    ): boolean {
        try {
            const hmac = crypto
                .createHmac('sha256', verifyToken)
                .update(body)
                .digest('hex');

            const expectedSignature = `sha256=${hmac}`;

            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );
        } catch (error) {
            console.error('❌ Signature verification error:', error);
            return false;
        }
    }

    /**
     * Rate limiting check
     */
    static async checkRateLimit(phone: string): Promise<boolean> {
        const cleanPhone = phone.replace(/\D/g, '');
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Get or create timestamp array for this phone
        let timestamps = this.messageCache.get(cleanPhone) || [];

        // Remove timestamps older than 1 minute
        timestamps = timestamps.filter(ts => ts > oneMinuteAgo);

        // Check if limit exceeded
        if (timestamps.length >= this.MAX_MESSAGES_PER_MINUTE) {
            if (process.env.NODE_ENV

                !== 'production') {
                console.warn(`⚠️ Rate limit exceeded for ${cleanPhone}`);
            }
            return false;
        }

        // Add current timestamp
        timestamps.push(now);
        this.messageCache.set(cleanPhone, timestamps);

        return true;
    }

    /**
     * Detect message loops (same message repeated)
     */
    static detectLoop(recentMessages: string[], newMessage: string): boolean {
        // Check if new message appears multiple times in recent history
        const occurrences = recentMessages.filter(
            msg => msg.toLowerCase().trim() === newMessage.toLowerCase().trim()
        ).length;

        if (occurrences >= 2) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('⚠️ Loop detected:', newMessage);
            }
            return true;
        }

        return false;
    }

    /**
     * Filter inappropriate content
     */
    static filterMessage(message: string): string {
        // Remove excessive whitespace
        let filtered = message.trim().replace(/\s+/g, ' ');

        // Remove potentially malicious patterns
        filtered = filtered.replace(/<script[^>]*>.*?<\/script>/gi, '');
        filtered = filtered.replace(/javascript:/gi, '');
        filtered = filtered.replace(/on\w+\s*=/gi, '');

        // Limit length
        if (filtered.length > 4000) {
            filtered = filtered.substring(0, 4000) + '...';
        }

        return filtered;
    }

    /**
     * Validate phone number format
     */
    static validatePhone(phone: string): boolean {
        const cleanPhone = phone.replace(/\D/g, '');

        // Brazilian phone: 11-13 digits (with country code)
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            return false;
        }

        return true;
    }

    /**
     * Clean up old cache entries
     */
    static cleanupCache(): void {
        const oneHourAgo = Date.now() - 3600000;

        for (const [phone, timestamps] of this.messageCache.entries()) {
            const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);

            if (recentTimestamps.length === 0) {
                this.messageCache.delete(phone);
            } else {
                this.messageCache.set(phone, recentTimestamps);
            }
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Security cache cleaned');
        }
    }
}
