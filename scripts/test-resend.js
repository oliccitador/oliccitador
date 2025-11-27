const { Resend } = require('resend');

const resend = new Resend('re_PNkjBbDx_7xZd88fCTqQB3SFefu92cs53');

(async function () {
    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'lookswapp@gmail.com',
            subject: 'Teste de Envio Resend',
            html: '<p>Se você recebeu isso, a chave API está funcionando!</p>'
        });

        console.log('Sucesso:', data);
    } catch (error) {
        console.error('Erro:', error);
    }
})();
