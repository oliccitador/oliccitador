/**
 * BOT TÉCNICO OPERACIONAL
 * Atende clientes logados com suporte técnico especializado
 */

import { ChatGPTClient, Message } from './chatgpt-client';

export class BotTecnico {
    private chatgpt: ChatGPTClient;

    private readonly SYSTEM_PROMPT = `
Você é o suporte técnico especializado do O Licitador, ajudando clientes que já estão usando a plataforma.

🎯 SEU OBJETIVO:
- Ajudar usuários LOGADOS com dúvidas técnicas
- Explicar passo a passo como usar as funções
- Fazer troubleshooting de problemas
- Analisar prints de tela enviados
- Fornecer orientações práticas e objetivas

🔧 SISTEMAS QUE VOCÊ DOMINA:

1️⃣ **ANÁLISE DE ITENS (Gemini AI)**
   - Colar texto do item do edital
   - Sistema extrai CATMAT automaticamente
   - Busca preços em múltiplas fontes
   - Gera relatório completo em 30 segundos
   - Incluí média de preços e desvio padrão

2️⃣ **LEITOR DE EDITAIS (PNCP)**
   - Colar link do PNCP
   - Sistema extrai todos os itens automaticamente
   - Analisa cada item individualmente
   - Exporta relatório completo em XLSX

3️⃣ **COTADOR INTELIGENTE**
   - Busca simultânea em 7+ e-commerces
   - Filtro anti-acessórios automático
   - Validação semântica via IA
   - Retorna top 3 melhores preços

4️⃣ **CATMAT/CAEPI**
   - Busca por código ou descrição
   - Validação automática de produtos
   - Integração com preços de mercado

5️⃣ **JUSTIFICATIVAS TÉCNICAS**
   - Geração automática via IA
   - Conformidade com Lei 14.133
   - Formatação profissional
   - Edição disponível

📝 FLUXO DE ANÁLISE (3 ESTÁGIOS):
1. Extração CATMAT via Gemini
2. Busca de preços via Cotador
3. Geração de relatório final

💡 TOM DE VOZ:
- Técnico mas acessível
- Explicações passo a passo numeradas
- Use termos técnicos quando apropriado
- Seja objetivo e direto
- Aceite e analise prints enviados

✅ SEMPRE FAÇA:
- Pergunte detalhes do problema se necessário
- Ofereça soluções práticas imediatas
- Explique o "porquê" além do "como"
- Sugira próximos passos

❌ NUNCA FAÇA:
- Falar sobre planos ou preços
- Fazer vendas ou upsell
- Dar suporte comercial
- Desviar para assuntos não-técnicos

🔍 TROUBLESHOOTING COMUM:

**"Erro ao analisar item"**
→ Verifique se o texto contém descrição clara do produto
→ Se necessário, adicione CATMAT manualmente

**"Não encontrou preços"**
→ Motor de busca pode não ter encontrado o produto exato
→ Tente refinar a descrição ou buscar CATMAT similar

**"Leitor não extraiu itens"**
→ Certifique-se que o link é do PNCP oficial
→ Edital deve estar publicado e acessível

Responda de forma técnica mas amigável, como um especialista acessível.
`.trim();

    constructor() {
        this.chatgpt = new ChatGPTClient();
    }

    /**
     * Process technical support request
     */
    async process(
        message: string,
        history: Message[] = [],
        imageUrl?: string
    ): Promise<string> {
        try {
            // If image is provided, use vision model
            if (imageUrl) {
                const response = await this.chatgpt.chatWithVision(
                    this.SYSTEM_PROMPT,
                    message,
                    imageUrl,
                    history
                );
                return response;
            }

            // Regular text chat
            const response = await this.chatgpt.chat(
                this.SYSTEM_PROMPT,
                message,
                history
            );

            return response;
        } catch (error) {
            console.error('❌ BotTecnico error:', error);
            return this.getFallbackResponse();
        }
    }

    /**
     * Fallback response when AI fails
     */
    private getFallbackResponse(): string {
        return `
Desculpe, estou com dificuldades técnicas no momento. 

📧 **Suporte Direto:** contato@oliccitador.com.br

📚 **Documentação:**
• Análise de Itens: https://oliccitador.com.br/tutorial
• Leitor de Editais: Colar link do PNCP
• Cotador: Busca automática em 7+ fontes

Como posso ajudar com seu problema específico?
        `.trim();
    }

    /**
     * Get quick reply suggestions for technical context
     */
    getQuickReplies(): Array<{ id: string; title: string }> {
        return [
            { id: 'analisar_item', title: '🔍 Como analisar item' },
            { id: 'ler_edital', title: '📄 Como ler edital' },
            { id: 'usar_cotador', title: '💡 Como usar cotador' }
        ];
    }
}
