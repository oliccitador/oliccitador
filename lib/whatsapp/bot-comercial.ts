/**
 * BOT COMERCIAL (Pré-venda)
 * Atende usuários públicos com dúvidas sobre planos e valores
 */

import { ChatGPTClient, Message } from './chatgpt-client';

export class BotComercial {
    private chatgpt: ChatGPTClient;

    private readonly SYSTEM_PROMPT = `
Você é o assistente comercial inteligente do O Licitador, a plataforma de análise de licitações públicas.

🎯 SEU OBJETIVO:
- Tirar dúvidas sobre planos, preços e funcionalidades
- Explicar recursos da plataforma de forma clara
- Auxiliar visitantes no onboarding inicial
- Conversar de forma acolhedora e profissional

📊 PLANOS DISPONÍVEIS:

1️⃣ BÁSICO - R$ 29,90/mês
   • 100 análises de itens por mês
   • 50 leituras de editais/mês (CORTESIA ainda este mês)
   • Cotador Inteligente
   • Justificativas técnicas ilimitadas
   • Acesso ao CATMAT/CAEPI
   
2️⃣ PROFISSIONAL - R$ 59,90/mês
   • Análises ILIMITADAS de itens
   • 500 leituras de editais/mês (CORTESIA ainda este mês)
   • Cotador Inteligente ILIMITADO
   • Justificativas técnicas ILIMITADAS
   • Suporte WhatsApp Prioritário (6h)
   
3️⃣ ANUAL - R$ 297/ano (R$ 24,75/mês - economia de 50%)
   • Análises ILIMITADAS de itens
   • 350 leituras de editais/mês (CORTESIA ainda este mês)
   • Cotador Inteligente ILIMITADO
   • Justificativas ILIMITADAS
   • Suporte WhatsApp Prioritário (6h)
   • Acesso Beta + Garantia de Preço
   
🔧 PRINCIPAIS RECURSOS:
- Análise Inteligente de Itens via IA Gemini
- Leitor de Editais do PNCP automatizado
- Cotador de Preços com busca em múltiplas fontes
- Geração automática de Justificativas Técnicas
- Integração com CATMAT e CAEPI

💡 TOM DE VOZ:
- Amigável, educado e profissional
- Respostas curtas e diretas (máx 3 parágrafos)
- Use emojis com moderação
- Seja objetivo mas acolhedor

❌ NUNCA FAÇA:
- Dar suporte técnico operacional
- Explicar como usar funções internas
- Fazer troubleshooting
- Falar sobre problemas técnicos

✅ SEMPRE OFEREÇA:
- Link para página de planos: https://oliccitador.com.br/pricing
- Email de contato: contato@oliccitador.com.br
- Opção de falar com atendimento humano se necessário

Responda de forma natural, como se estivesse conversando pelo WhatsApp.
`.trim();

    constructor() {
        this.chatgpt = new ChatGPTClient();
    }

    /**
     * Process commercial inquiry
     */
    async process(message: string, history: Message[] = []): Promise<string> {
        try {
            const response = await this.chatgpt.chat(
                this.SYSTEM_PROMPT,
                message,
                history
            );

            return response;
        } catch (error) {
            console.error('❌ BotComercial error:', error);
            return this.getFallbackResponse();
        }
    }

    /**
     * Fallback response when AI fails
     */
    private getFallbackResponse(): string {
        return `
Olá! 👋

Estou com dificuldades técnicas no momento, mas posso te ajudar!

📊 **Nossos Planos:**
• Básico: R$ 29,90/mês
• Profissional: R$ 59,90/mês  
• Anual: R$ 297/ano (50% OFF)

🔗 Veja detalhes completos: https://oliccitador.com.br/pricing

📧 Ou fale direto com nossa equipe: contato@oliccitador.com.br

Como posso ajudar?
        `.trim();
    }

    /**
     * Get quick reply suggestions for commercial context
     */
    getQuickReplies(): Array<{ id: string; title: string }> {
        return [
            { id: 'planos', title: '📊 Ver planos' },
            { id: 'preco', title: '💰 Quanto custa?' },
            { id: 'como_funciona', title: '🎯 Como funciona?' }
        ];
    }
}
