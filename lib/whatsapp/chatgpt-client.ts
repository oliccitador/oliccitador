/**
 * ChatGPT API Client
 * Handles all AI processing for both bots
 */

import OpenAI from 'openai';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class ChatGPTClient {
    private client: OpenAI;

    constructor() {
        const apiKey = process.env.CHATGPT_API_KEY;

        if (!apiKey) {
            throw new Error('CHATGPT_API_KEY not configured');
        }

        this.client = new OpenAI({ apiKey });
    }

    /**
     * Process a chat message with system prompt and history
     */
    async chat(
        systemPrompt: string,
        userMessage: string,
        history: Message[] = []
    ): Promise<string> {
        try {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: userMessage }
            ];

            const response = await this.client.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages,
                temperature: 0.7,
                max_tokens: 500,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            });

            const reply = response.choices[0]?.message?.content;

            if (!reply) {
                throw new Error('Empty response from ChatGPT');
            }

            return reply;
        } catch (error) {
            console.error('❌ ChatGPT error:', error);

            // Fallback response
            return 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes ou entre em contato pelo email: contato@oliccitador.com.br';
        }
    }

    /**
     * Chat with vision (for analyzing images)
     */
    async chatWithVision(
        systemPrompt: string,
        userMessage: string,
        imageUrl: string,
        history: Message[] = []
    ): Promise<string> {
        try {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userMessage },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ];

            const response = await this.client.chat.completions.create({
                model: 'gpt-4-vision-preview',
                messages,
                max_tokens: 500
            });

            const reply = response.choices[0]?.message?.content;

            if (!reply) {
                throw new Error('Empty response from ChatGPT Vision');
            }

            return reply;
        } catch (error) {
            console.error('❌ ChatGPT Vision error:', error);
            return 'Desculpe, não consegui analisar a imagem. Por favor, descreva o problema em texto.';
        }
    }
}
