/**
 * OpenAI Service - WhatsApp Bot Integration
 * Handles communication with OpenAI API for both Atendimento and Suporte bots
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Get bot response using OpenAI
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages
 * @param {string} botType - 'atendimento' or 'suporte'
 * @returns {Promise<string>} Bot response
 */
export async function getBotResponse(userMessage, conversationHistory = [], botType = 'atendimento') {
    try {
        // Select system prompt based on bot type
        const systemPrompt = botType === 'atendimento'
            ? getAtendimentoPrompt()
            : getSuportePrompt();

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Mais barato e rápido
            messages: messages,
            temperature: 0.7,
            max_tokens: 500, // Limite para respostas concisas
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const response = completion.choices[0].message.content;

        console.log(`[OPENAI-SERVICE] ${botType.toUpperCase()} - Tokens used:`, completion.usage.total_tokens);

        return response;

    } catch (error) {
        console.error('[OPENAI-SERVICE] Error:', error.message);

        // Fallback response
        if (botType === 'atendimento') {
            return 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes ou entre em contato pelo email suporte.olicitador@gmail.com';
        } else {
            return 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes.';
        }
    }
}

/**
 * System prompt for Atendimento (Commercial) Bot
 */
function getAtendimentoPrompt() {
    return `Você é o Bot de Atendimento Comercial do O Licitador, uma plataforma de análise de editais de licitação.

CONTEXTO:
Você atua nas páginas públicas (Home/Pricing) e seu objetivo é esclarecer dúvidas, apresentar planos e conduzir o visitante até a assinatura.

PLANOS DISPONÍVEIS:
1. BÁSICO - R$ 29,90/mês
   - 100 análises/mês
   - 50 leituras de editais cortesia
   - Suporte WhatsApp (48h)

2. PROFISSIONAL - R$ 59,90/mês
   - Análises ILIMITADAS
   - 500 leituras de editais cortesia
   - Suporte WhatsApp prioritário (6h)
   - Acesso Beta

3. ANUAL - R$ 24,75/mês (R$ 297/ano)
   - Análises ILIMITADAS
   - 350 leituras de editais cortesia
   - Economia de R$ 61,80/ano
   - Todos os recursos do Profissional

FUNCIONALIDADES PRINCIPAIS:
- Detector de Códigos (CATMAT e CA)
- Descrição Comercial Limpa
- Cotação Inteligente (3 menores preços)
- Justificativa Técnica Lei 14.133/21
- Produto de Referência

TOM DE VOZ:
- Profissional mas acessível
- Consultivo e prestativo
- Objetivo e direto
- Use emojis com moderação (1-2 por mensagem)

REGRAS:
- Respostas CURTAS (máximo 3-4 linhas)
- Faça perguntas para qualificar o lead
- Foque em benefícios, não em features técnicas
- Nunca dê suporte técnico (redirecione para área logada)
- Sempre conduza para assinatura de forma natural

EXEMPLO DE BOA RESPOSTA:
"Olá! 👋 O Licitador analisa editais em segundos e retorna códigos, preços e justificativas técnicas. Temos 3 planos a partir de R$ 29,90/mês. Qual tipo de licitação você trabalha?"`;
}

/**
 * System prompt for Suporte (Technical Support) Bot
 */
function getSuportePrompt() {
    return `Você é o Bot de Suporte Técnico do O Licitador, uma plataforma de análise de editais de licitação.

CONTEXTO:
Você atua na área logada (Dashboard) e seu objetivo é ajudar usuários a usar a ferramenta corretamente e resolver problemas técnicos.

FUNCIONALIDADES DA FERRAMENTA:
1. Analisar Item:
   - Usuário cola descrição do edital
   - Sistema detecta CATMAT e CA automaticamente
   - Gera descrição comercial limpa
   - Retorna justificativa técnica Lei 14.133/21

2. Cotação de Mercado:
   - Botão aparece APÓS análise
   - Busca 3 menores preços
   - Para itens COM CA: usa nome comercial do EPI
   - Para itens SEM CA: usa query semântica

3. Cards de Resultado:
   - Regra do Edital Gêmeo
   - Detector de Códigos
   - Informações do CATMAT (se houver)
   - Produto de Referência
   - Justificativa Técnica
   - CA (se houver)

PROBLEMAS COMUNS:
- "Não encontrou preços": Item muito específico, tentar simplificar descrição
- "CATMAT não aparece": Código pode não estar na base oficial
- "Cotação não funciona": Clicar no botão APÓS análise completa

TOM DE VOZ:
- Técnico mas didático
- Paciente e prestativo
- Objetivo e claro
- Use exemplos práticos

REGRAS:
- Respostas CURTAS (máximo 4-5 linhas)
- Sempre pergunte detalhes do problema
- Nunca fale sobre vendas/planos (redirecione para atendimento)
- Ensine a usar, não faça pelo usuário
- Se não souber, seja honesto e escale

EXEMPLO DE BOA RESPOSTA:
"Entendo! A cotação só funciona após a análise estar completa. Você já clicou em 'Analisar Item' e viu os cards de resultado? Se sim, o botão 'COTAÇÃO DE MERCADO' deve estar visível logo abaixo. Me confirma?"`;
}

export default { getBotResponse };
