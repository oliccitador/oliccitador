# 📱 Guia de Individualização do WhatsApp (Vendas vs Suporte)

Este guia descreve como configurar o sistema para usar dois números de WhatsApp independentes, cada um gerenciado por uma IA especializada.

---

## 🏗️ Estrutura Implementada

O sistema já possui a inteligência necessária para diferenciar os canais:

1.  **🤖 Bot de Vendas (Contexto: `public`)**
    *   **Foco:** Planos, benefícios, conversão.
    *   **Ativação:** Quando a mensagem chega no número de Vendas.
2.  **🔧 Bot de Suporte (Contexto: `operacional`)**
    *   **Foco:** Dúvidas técnicas, erros, uso da ferramenta.
    *   **Ativação:** Quando a mensagem chega no número de Suporte.

---

## 🚀 Passos para Configuração

### 1. Obter Identificadores na Meta (Facebook Developers)

Para que o sistema diferencie os números, precisamos do **Phone Number ID** de cada um.

1.  Acesse o [Painel da Meta for Developers](https://developers.facebook.com/).
2.  Vá em **WhatsApp** > **API Setup**.
3.  Localize a seção "Phone numbers".
4.  Copie o **Phone number ID** para o número de Vendas.
5.  Copie o **Phone number ID** para o número de Suporte.

### 2. Configurar Variáveis de Ambiente

Crie ou atualize as seguintes variáveis no arquivo `.env.local` e no painel da Netlify:

```bash
# ID do número de Vendas (Atendimento Comercial)
WHATSAPP_SALES_PHONE_ID="1234567890" 

# ID do número de Suporte (Técnico)
WHATSAPP_SUPPORT_PHONE_ID="0987654321"

# Token de Verificação do Webhook (Você define uma senha segura)
WHATSAPP_WEBHOOK_VERIFY_TOKEN="sua_senha_segura_aqui"
```

### 3. Configurar Webhook na Meta

1.  No painel da Meta, vá em **Configuration**.
2.  Em **Webhook**, clique em **Edit**.
3.  **Callback URL:** `https://oliccitador.com.br/.netlify/functions/whatsapp-webhook`
4.  **Verify Token:** O mesmo que você definiu em `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
5.  Marque o evento **messages** e salve.

---

## 🔗 Atualização dos Links no Frontend

Para garantir que os usuários falem com o bot certo, atualize os links "Fale Conosco":

### 1. Home / Landing Page (Vendas)
O botão de WhatsApp deve direcionar para o número de Vendas.

*   **Arquivo:** `app/page.tsx` (ou componente de Footer/Hero)
*   **Link:** `https://wa.me/55<SEU_NUMERO_VENDAS>`

### 2. Dashboard / Login (Suporte)
O botão de ajuda dentro da área logada deve direcionar para o número de Suporte.

*   **Arquivo:** `app/dashboard/page.tsx` (ou componente de Header Logado)
*   **Link:** `https://wa.me/55<SEU_NUMERO_SUPORTE>`

---

## 🧪 Como Testar

1.  Adicione as variáveis de ambiente localmente.
2.  Use o script de simulação (se houver) ou envie uma mensagem real para cada número (se a API da Meta já estiver ativa).
3.  Verifique nos logs se o sistema identificou o contexto corretamente:
    *   `[WHATSAPP-BOT] Context detected: PUBLIC (Sales)`
    *   `[WHATSAPP-BOT] Context detected: OPERACIONAL (Support)`

---

## ⚠️ Detalhe Importante: Envio da Resposta

O código atual processa a mensagem e gera a resposta da IA (`result.response`). Para que o usuário **receba** essa resposta no WhatsApp, é necessário adicionar a chamada à API `messages` da Meta no final do arquivo `lib/whatsapp-bot.js`.

```javascript
/* Exemplo de implementação futura no whatsapp-bot.js */
await axios.post(`https://graph.facebook.com/v17.0/${businessPhoneId}/messages`, {
    messaging_product: "whatsapp",
    to: fromPhone,
    text: { body: botResponse }
}, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` } });
```
