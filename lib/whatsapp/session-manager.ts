/**
 * Session Manager
 * Manages WhatsApp conversation sessions and history
 */

import { createClient } from '@supabase/supabase-js';

export interface SessionMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface WhatsAppSession {
    id: string;
    phone: string;
    context: 'public' | 'operacional';
    userId?: string;
    messages: SessionMessage[];
    metadata: {
        page?: string;
        plan?: string;
        userAgent?: string;
    };
    createdAt: Date;
    lastActivity: Date;
    status: 'active' | 'closed';
}

export class SessionManager {
    private static supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    /**
     * Create a new session
     */
    static async createSession(
        phone: string,
        context: 'public' | 'operacional',
        metadata: { page?: string; plan?: string; userId?: string }
    ): Promise<string> {
        const sessionId = `${phone.replace(/\D/g, '')}_${Date.now()}`;

        const session: WhatsAppSession = {
            id: sessionId,
            phone: phone.replace(/\D/g, ''),
            context,
            userId: metadata.userId,
            messages: [],
            metadata: {
                page: metadata.page,
                plan: metadata.plan
            },
            createdAt: new Date(),
            lastActivity: new Date(),
            status: 'active'
        };

        // Save to Supabase
        const { error } = await this.supabase
            .from('whatsapp_sessions')
            .insert({
                id: session.id,
                phone: session.phone,
                context: session.context,
                user_id: session.userId,
                messages: [],
                metadata: session.metadata,
                created_at: session.createdAt.toISOString(),
                last_activity: session.lastActivity.toISOString(),
                status: session.status
            });

        if (error) {
            console.error('❌ Error creating session:', error);
            throw new Error('Failed to create session');
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Session created: ${sessionId} (${context})`);
        }

        return sessionId;
    }

    /**
     * Get active session by phone
     */
    static async getActiveSession(phone: string): Promise<WhatsAppSession | null> {
        const cleanPhone = phone.replace(/\D/g, '');

        const { data, error } = await this.supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('phone', cleanPhone)
            .eq('status', 'active')
            .order('last_activity', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.id,
            phone: data.phone,
            context: data.context,
            userId: data.user_id,
            messages: data.messages || [],
            metadata: data.metadata || {},
            createdAt: new Date(data.created_at),
            lastActivity: new Date(data.last_activity),
            status: data.status
        };
    }

    /**
     * Save message to session
     */
    static async saveMessage(
        phone: string,
        userMessage: string,
        botReply: string
    ): Promise<void> {
        const session = await this.getActiveSession(phone);

        if (!session) {
            console.warn('⚠️ No active session found for phone:', phone);
            return;
        }

        const newMessages: SessionMessage[] = [
            ...session.messages,
            {
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            },
            {
                role: 'assistant',
                content: botReply,
                timestamp: new Date()
            }
        ];

        const { error } = await this.supabase
            .from('whatsapp_sessions')
            .update({
                messages: newMessages,
                last_activity: new Date().toISOString()
            })
            .eq('id', session.id);

        if (error) {
            console.error('❌ Error saving message:', error);
        }
    }

    /**
     * Get conversation history
     */
    static async getHistory(phone: string, limit: number = 10): Promise<SessionMessage[]> {
        const session = await this.getActiveSession(phone);

        if (!session) {
            return [];
        }

        // Return last N messages
        return session.messages.slice(-limit);
    }

    /**
     * Close session (timeout or manual)
     */
    static async closeSession(sessionId: string): Promise<void> {
        const { error } = await this.supabase
            .from('whatsapp_sessions')
            .update({ status: 'closed' })
            .eq('id', sessionId);

        if (error) {
            console.error('❌ Error closing session:', error);
        }
    }

    /**
     * Cleanup expired sessions (older than 1 hour)
     */
    static async cleanupExpiredSessions(): Promise<void> {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

        const { error } = await this.supabase
            .from('whatsapp_sessions')
            .update({ status: 'closed' })
            .eq('status', 'active')
            .lt('last_activity', oneHourAgo);

        if (error) {
            console.error('❌ Error cleaning up sessions:', error);
        } else if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Expired sessions cleaned up');
        }
    }
}
