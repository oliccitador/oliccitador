/**
 * WhatsApp Webhook Handler
 * Receives messages from Meta's WhatsApp Cloud API
 */

import { NextResponse } from 'next/server';
import { WhatsAppOrchestrator } from '../../../lib/whatsapp/orchestrator.ts';
import { WhatsAppClient } from '../../../lib/whatsapp/whatsapp-client.ts';
import { SessionManager } from '../../../lib/whatsapp/session-manager.ts';

export const dynamic = 'force-dynamic';

const orchestrator = new WhatsAppOrchestrator();
const whatsappClient = new WhatsAppClient();

/**
 * GET - Webhook verification (required by Meta)
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Webhook verified');
        }
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST - Receive incoming messages
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // WhatsApp sends various notification types
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        // Only process messages
        if (!value || !value.messages) {
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        const message = value.messages[0];
        const from = message.from; // Phone number
        const messageId = message.id;
        const messageType = message.type;

        if (process.env.NODE_ENV !== 'production') {
            console.log('📱 Incoming message:', { from, type: messageType });
        }

        // Get message content based on type
        let messageText = '';
        let imageUrl: string | undefined;

        if (messageType === 'text') {
            messageText = message.text.body;
        } else if (messageType === 'image') {
            // Handle image messages (for technical bot)
            imageUrl = message.image?.id; // Would need to download from Meta
            messageText = message.image?.caption || 'Imagem enviada';
        } else if (messageType === 'interactive') {
            // Handle button/quick reply responses
            messageText = message.interactive?.button_reply?.title ||
                message.interactive?.list_reply?.title ||
                'Resposta rápida';
        } else {
            // Unsupported message type
            await whatsappClient.sendMessage(
                from,
                'Desculpe, este tipo de mensagem não é suportado. Por favor, envie texto ou imagens.'
            );
            return NextResponse.json({ status: 'unsupported_type' }, { status: 200 });
        }

        // Mark message as read
        await whatsappClient.markAsRead(messageId);

        // Get or create session to determine context
        let session = await SessionManager.getActiveSession(from);

        if (!session) {
            // No active session - default to public context
            // In real implementation, this would be set when user clicks support button
            await SessionManager.createSession(from, 'public', {});
            session = await SessionManager.getActiveSession(from);
        }

        if (!session) {
            throw new Error('Failed to create session');
        }

        // Process message with orchestrator
        const context = session.context;
        const response = await orchestrator.processMessage(
            from,
            messageText,
            context,
            imageUrl
        );

        // Send response
        await whatsappClient.sendMessage(from, response);

        // Optionally send quick replies
        if (session.messages.length === 0) {
            // First message - send quick replies
            const quickReplies = orchestrator.getQuickReplies(context);
            await whatsappClient.sendQuickReplies(
                from,
                'Como posso ajudar?',
                quickReplies
            );
        }

        return NextResponse.json({ status: 'processed' }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
