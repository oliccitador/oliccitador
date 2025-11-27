export const getWelcomeEmailTemplate = (planName: string, actionUrl: string, isNewUser: boolean) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #22d3ee; text-decoration: none; }
        .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        h1 { color: #ffffff; margin-top: 0; font-size: 24px; }
        p { line-height: 1.6; color: #cbd5e1; }
        .btn { display: inline-block; background-color: #0891b2; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; transition: background-color 0.2s; }
        .btn:hover { background-color: #06b6d4; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; }
        .highlight { color: #22d3ee; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://oliccitador.com.br" class="logo">O Licitador</a>
        </div>
        <div class="card">
            <h1>${isNewUser ? '🎉 Bem-vindo ao O Licitador!' : '✅ Pagamento Confirmado!'}</h1>
            <p>Olá,</p>
            <p>Temos uma ótima notícia: seu pagamento foi processado com sucesso e sua assinatura do plano <span class="highlight">${planName}</span> já está ativa!</p>
            
            ${isNewUser
        ? `<p>Como você é um novo usuário, criamos uma conta para você. Clique no botão abaixo para definir sua senha e começar a usar agora mesmo:</p>
                   <div style="text-align: center;">
                       <a href="${actionUrl}" class="btn">Definir Senha e Acessar</a>
                   </div>`
        : `<p>Sua conta foi atualizada automaticamente. Você já pode acessar o sistema e aproveitar seus novos limites.</p>
                   <div style="text-align: center;">
                       <a href="https://oliccitador.com.br/dashboard" class="btn">Acessar Painel</a>
                   </div>`
    }
            
            <p style="margin-top: 30px; font-size: 14px; border-top: 1px solid #334155; padding-top: 20px;">
                Se tiver qualquer dúvida, responda a este e-mail ou entre em contato com nosso suporte.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 O Licitador. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
`;
