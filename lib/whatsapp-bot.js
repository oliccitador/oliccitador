/**
 * WhatsApp Bot Logic
 * Centralizes the logic for processing incoming messages and generating responses
 */

const { createClient } = require('@supabase/supabase-js');
const { getBotResponse } = require('./openai-service.js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Process incoming WhatsApp message
 * @param {string} fromPhone - User's phone number
 * @param {string} messageBody - Text message content
 * @param {string} businessPhoneId - ID of the business phone that received the message
 */
async function processWhatsAppMessage(fromPhone, messageBody, businessPhoneId) {
    try {
        console.log(`[WHATSAPP-BOT] Processing message from ${fromPhone} to ${businessPhoneId}`);

        // 1. Determine Context based on Business Phone ID
        let context = 'public'; // default to sales/atendimento

        const SALES_ID = process.env.WHATSAPP_SALES_PHONE_ID;
        const SUPPORT_ID = process.env.WHATSAPP_SUPPORT_PHONE_ID;

        if (businessPhoneId === SUPPORT_ID) {
            context = 'operacional';
            console.log('[WHATSAPP-BOT] Context detected: OPERACIONAL (Support)');
        } else if (businessPhoneId === SALES_ID) {
            context = 'public';
            console.log('[WHATSAPP-BOT] Context detected: PUBLIC (Sales)');
        } else {
            console.warn(`[WHATSAPP-BOT] Unknown business ID ${businessPhoneId}, defaulting to PUBLIC`);
        }

        // 2. Get or Create Session
        let { data: session, error: fetchError } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('phone', fromPhone)
            .single();

        if (!session) {
            console.log('[WHATSAPP-BOT] Creating new session');
            const { data: newSession, error: createError } = await supabase
                .from('whatsapp_sessions')
                .insert({
                    phone: fromPhone,
                    context: context,
                    messages: [],
                    status: 'active',
                    last_message_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;
            session = newSession;
        } else {
            // Update context if it changed (e.g. user messaged the other number)
            if (session.context !== context) {
                console.log(`[WHATSAPP-BOT] Updating context from ${session.context} to ${context}`);
                session.context = context;
            }
        }

        // 3. Generate AI Response
        const botType = context === 'operacional' ? 'suporte' : 'atendimento';
        const botResponse = await getBotResponse(messageBody, session.messages || [], botType);

        // 4. Update Session History
        const updatedMessages = [
            ...(session.messages || []),
            { role: 'user', content: messageBody, timestamp: new Date().toISOString() },
            { role: 'assistant', content: botResponse, timestamp: new Date().toISOString() }
        ];

        await supabase
            .from('whatsapp_sessions')
            .update({
                messages: updatedMessages,
                last_message_at: new Date().toISOString(),
                context: context // Ensure context is persisted
            })
            .eq('id', session.id);

        return {
            response: botResponse,
            context: context
        };

    } catch (error) {
        console.error('[WHATSAPP-BOT] Error processing message:', error);
        throw error;
    }
}

module.exports = { processWhatsAppMessage };
