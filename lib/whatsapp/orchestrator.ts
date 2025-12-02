/**
 * WhatsApp Orchestrator
 * Central intelligence that routes messages to the correct bot based on screen context
 */

import { BotComercial } from './bot-comercial';
import { BotTecnico } from './bot-tecnico';
import { SessionManager, SessionMessage } from './session-manager';
import { SecurityLayer } from './security';

export class WhatsAppOrchestrator {
    private botComercial: BotComercial;
    private botTecnico: BotTecnico;

    constructor() {
        this.botComercial = new BotComercial();
        this.botTecnico = new BotTecnico();
    }

    /**
     * Process incoming message and route to correct bot
     * CRITICAL: Bot selection is EXCLUSIVELY based on context, never on message content
     */
    async processMessage(
        phone: string,
        message: string,
        context: 'public' | 'operacional',
        imageUrl?: string
    ): Promise<string> {
        try {
            // 1. Security checks
            if (!SecurityLayer.validatePhone(phone)) {
                throw new Error('Invalid phone number');
            }

            const cleanMessage = SecurityLayer.filterMessage(message);

            // 2. Rate limiting
            const withinLimit = await SecurityLayer.checkRateLimit(phone);
            if (!withinLimit) {
                return 'Você está enviando mensagens muito rapidamente. Por favor, aguarde um momento e tente novamente.';
            }

            // 3. Get conversation history
            const history = await SessionManager.getHistory(phone);

            // 4. Loop detection
            const recentMessages = history
                .filter(msg => msg.role === 'user')
                .slice(-5)
                .map(msg => msg.content);

            if (SecurityLayer.detectLoop(recentMessages, cleanMessage)) {
                return 'Parece que você está repetindo a mesma pergunta. Posso ajudar de outra forma? Se preferir, entre em contato pelo email: contato@oliccitador.com.br';
            }

            // 5. Select bot based on CONTEXT ONLY (immutable rule)
            const bot = context === 'public' ? this.botComercial : this.botTecnico;

            if (process.env.NODE_ENV !== 'production') {
                console.log(`🤖 Routing to: ${context === 'public' ? 'BOT COMERCIAL' : 'BOT TÉCNICO'}`);
            }

            // 6. Process with selected bot
            const chatHistory = history.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await bot.process(cleanMessage, chatHistory, imageUrl);

            // 7. Save to session
            await SessionManager.saveMessage(phone, cleanMessage, response);

            return response;

        } catch (error) {
            console.error('❌ Orchestrator error:', error);
            return this.getErrorResponse();
        }
    }

    /**
     * Get quick reply suggestions based on context
     */
    getQuickReplies(context: 'public' | 'operacional'): Array<{ id: string; title: string }> {
        const bot = context === 'public' ? this.botComercial : this.botTecnico;
        return bot.getQuickReplies();
    }

    /**
     * Error fallback response
     */
    private getErrorResponse(): string {
        return `
Desculpe, ocorreu um erro ao processar sua mensagem.

📧 **Contato Direto:**
contato@oliccitador.com.br

Por favor, tente novamente em instantes.
        `.trim();
    }
}
