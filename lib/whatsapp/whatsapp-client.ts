/**
 * WhatsApp Cloud API Client
 * Handles all communication with Meta's WhatsApp Business API
 */

interface WhatsAppMessage {
    messaging_product: 'whatsapp';
    to: string;
    type: 'text' | 'interactive';
    text?: { body: string };
    interactive?: {
        type: 'button';
        body: { text: string };
        action: {
            buttons: Array<{
                type: 'reply';
                reply: { id: string; title: string };
            }>;
        };
    };
}

export class WhatsAppClient {
    private readonly baseUrl = 'https://graph.facebook.com/v18.0';
    private readonly phoneNumberId: string;
    private readonly accessToken: string;

    constructor() {
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';

        if (!this.phoneNumberId || !this.accessToken) {
            console.error('❌ WhatsApp credentials not configured');
        }
    }

    /**
     * Send a simple text message
     */
    async sendMessage(to: string, text: string): Promise<boolean> {
        try {
            const message: WhatsAppMessage = {
                messaging_product: 'whatsapp',
                to: to.replace(/\D/g, ''), // Remove non-digits
                type: 'text',
                text: { body: text }
            };

            const response = await fetch(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                }
            );

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ WhatsApp API error:', error);
                return false;
            }

            const data = await response.json();
            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ Message sent:', data);
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to send WhatsApp message:', error);
            return false;
        }
    }

    /**
     * Send message with quick reply buttons
     */
    async sendQuickReplies(
        to: string,
        text: string,
        buttons: Array<{ id: string; title: string }>
    ): Promise<boolean> {
        try {
            // WhatsApp allows max 3 buttons
            const limitedButtons = buttons.slice(0, 3);

            const message: WhatsAppMessage = {
                messaging_product: 'whatsapp',
                to: to.replace(/\D/g, ''),
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text },
                    action: {
                        buttons: limitedButtons.map(btn => ({
                            type: 'reply',
                            reply: {
                                id: btn.id,
                                title: btn.title.substring(0, 20) // Max 20 chars
                            }
                        }))
                    }
                }
            };

            const response = await fetch(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                }
            );

            return response.ok;
        } catch (error) {
            console.error('❌ Failed to send quick replies:', error);
            return false;
        }
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        status: 'read',
                        message_id: messageId
                    })
                }
            );

            return response.ok;
        } catch (error) {
            console.error('❌ Failed to mark as read:', error);
            return false;
        }
    }
}
