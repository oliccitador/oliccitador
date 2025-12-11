/**
 * Netlify Function: WhatsApp Webhook Validation
 * Handles GET requests from Meta to verify webhook endpoint
 */

exports.handler = async (event, context) => {
    // Only handle GET requests (webhook verification)
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Extract query parameters
        const params = event.queryStringParameters || {};
        const mode = params['hub.mode'];
        const token = params['hub.verify_token'];
        const challenge = params['hub.challenge'];

        // Get verify token from environment
        const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

        console.log('Webhook verification attempt:', {
            mode,
            tokenMatch: token === verifyToken,
            hasChallenge: !!challenge
        });

        // Verify the request
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ Webhook verified successfully');

            // Return challenge as plain text with 200 status
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: challenge
            };
        }

        // Verification failed
        console.warn('❌ Webhook verification failed:', {
            mode,
            tokenProvided: !!token,
            expectedToken: !!verifyToken
        });

        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Forbidden: Invalid verification token' })
        };

    } catch (error) {
        console.error('❌ Webhook verification error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
