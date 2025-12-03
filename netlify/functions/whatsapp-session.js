// WhatsApp Session Handler - Netlify Function
// Handles session creation, retrieval, and bot responses via OpenAI

const { createClient } = require('@supabase/supabase-js');

// Dynamic import for ES modules
let getBotResponse;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Lazy load OpenAI service (ES module)
        if (!getBotResponse) {
            const openaiService = await import('../../lib/openai-service.js');
            getBotResponse = openaiService.getBotResponse;
        }

        if (event.httpMethod === 'GET') {
            // Get session
            const phone = event.queryStringParameters?.phone;

            if (!phone) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing phone parameter' })
                };
            }

            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .select('*')
                .eq('phone', phone)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // Return existing session or create new one
            if (!data) {
                const { data: newSession, error: createError } = await supabase
                    .from('whatsapp_sessions')
                    .insert({
                        phone,
                        context: 'public',
                        messages: [],
                        metadata: {},
                        status: 'active',
                        last_message_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (createError) throw createError;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(newSession)
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        if (event.httpMethod === 'POST') {
            // Send message and get bot response
            const body = JSON.parse(event.body || '{}');
            const { phone, context, message } = body;

            if (!phone || !message) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing phone or message' })
                };
            }

            // Get existing session
            const { data: session, error: fetchError } = await supabase
                .from('whatsapp_sessions')
                .select('*')
                .eq('phone', phone)
                .single();

            if (fetchError) throw fetchError;

            // Determine bot type based on context
            const botType = context === 'operacional' ? 'suporte' : 'atendimento';

            console.log(`[WHATSAPP-SESSION] Bot type: ${botType}, Phone: ${phone}`);

            // Get bot response from OpenAI
            const botResponse = await getBotResponse(message, session.messages || [], botType);

            // Update session with new messages
            const updatedMessages = [
                ...(session.messages || []),
                { role: 'user', content: message, timestamp: new Date().toISOString() },
                { role: 'assistant', content: botResponse, timestamp: new Date().toISOString() }
            ];

            const { data: updatedSession, error: updateError } = await supabase
                .from('whatsapp_sessions')
                .update({
                    messages: updatedMessages,
                    last_activity: new Date().toISOString(),
                    last_message_at: new Date().toISOString(),
                    context: context || session.context
                })
                .eq('phone', phone)
                .select()
                .single();

            if (updateError) throw updateError;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedSession)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('[WHATSAPP-SESSION] Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};
