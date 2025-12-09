/**
 * Netlify Function: WhatsApp Webhook Validation
 * Handles GET requests from Meta to verify webhook endpoint
 */

const { processWhatsAppMessage } = require('../../lib/whatsapp-bot.js');

exports.handler = async (event, context) => {
    // 1. GET Request: Webhook Verification
    if (event.httpMethod === 'GET') {
        try {
            const params = event.queryStringParameters || {};
            const mode = params['hub.mode'];
            const token = params['hub.verify_token'];
            const challenge = params['hub.challenge'];
            const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

            if (mode === 'subscribe' && token === verifyToken) {
                console.log('✅ Webhook verified successfully');
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'text/plain' },
                    body: challenge
                };
            }

            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Forbidden' })
            };
        } catch (error) {
            console.error('❌ Verification error:', error);
            return { statusCode: 500, body: JSON.stringify({ error: 'Internal Error' }) };
        }
    }

    // 2. POST Request: Incoming Messages
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body || '{}');

            // Check if this is a WhatsApp status update or message
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value) {
                return { statusCode: 200, body: 'No value' }; // Acknowledge anyway
            }

            // We are only interested in messages, not statuses
            if (value.messages?.[0]) {
                const message = value.messages[0];
                const businessPhoneId = value.metadata?.phone_number_id;
                const fromPhone = message.from;
                const messageBody = message.text?.body;

                if (fromPhone && messageBody) {
                    console.log(`📩 Message received from ${fromPhone}`);

                    // Process message with Bot Logic
                    const result = await processWhatsAppMessage(fromPhone, messageBody, businessPhoneId);

                    // TODO: Here we would send the 'result.response' back to the user via WhatsApp API.
                    // For now, we connect the logic but sending back is skipped until API setup.
                    console.log('🤖 Bot generated response:', result.response.substring(0, 50) + '...');
                }
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ status: 'processed' })
            };

        } catch (error) {
            console.error('❌ Webhook processing error:', error);
            return { statusCode: 500, body: JSON.stringify({ error: 'Internal Error' }) };
        }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
