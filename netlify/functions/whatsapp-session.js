// WhatsApp Session Handler - Netlify Function
// Handles session creation and retrieval

const { createClient } = require('@supabase/supabase-js');

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
                .gte('last_message_at', new Date(Date.now() - 3600000).toISOString())
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data || { phone, messages: [], context: 'public' })
            };
        }

        if (event.httpMethod === 'POST') {
            // Create/update session
            const body = JSON.parse(event.body || '{}');
            const { phone, context, message } = body;

            if (!phone) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing phone' })
                };
            }

            const sessionData = {
                phone,
                context: context || 'public',
                messages: message ? [{ role: 'user', content: message, timestamp: new Date().toISOString() }] : [],
                last_message_at: new Date().toISOString(),
                metadata: {}
            };

            const { data, error } = await supabase
                .from('whatsapp_sessions')
                .upsert(sessionData, { onConflict: 'phone' })
                .select()
                .single();

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Session handler error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};
