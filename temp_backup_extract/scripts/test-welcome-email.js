/**
 * Test script for welcome email functionality
 * Tests the Resend integration and email template
 */

const { Resend } = require('resend');

async function testWelcomeEmail() {
    console.log('🧪 Starting Welcome Email Test...\n');

    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br';

    if (!apiKey) {
        console.error('❌ ERROR: RESEND_API_KEY not found in environment variables');
        console.log('Please set it in your .env.local file or run:');
        console.log('export RESEND_API_KEY=your_key_here');
        process.exit(1);
    }

    console.log('✅ Environment variables loaded');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   API Key: ${apiKey.substring(0, 10)}...`);

    // Initialize Resend
    const resend = new Resend(apiKey);

    // Test email address (change this to your email for testing)
    const testEmail = process.argv[2] || 'teste@exemplo.com';
    const planName = 'Básico';
    const mockActionUrl = `${baseUrl}/definir-senha?token=mock_test_token_123`;

    console.log(`\n📧 Sending test email to: ${testEmail}`);
    console.log(`   Plan: ${planName}`);
    console.log(`   Action URL: ${mockActionUrl}`);

    // Inline email template (same as in lib/email-templates.ts)
    const getWelcomeEmailTemplate = (plan, actionUrl, isNewUser) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao O Licitador</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f4;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 Bem-vindo ao O Licitador!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${isNewUser ? `
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Sua conta foi criada com sucesso!</h2>
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Obrigado por escolher o plano <strong>${plan}</strong>. Estamos muito felizes em tê-lo conosco!
                            </p>
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Para começar a usar sua conta, você precisa definir sua senha. Clique no botão abaixo para criar sua senha de acesso:
                            </p>
                            ` : `
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">Pagamento Confirmado!</h2>
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Seu pagamento para o plano <strong>${plan}</strong> foi confirmado com sucesso!
                            </p>
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Sua assinatura está ativa e você já pode fazer login para começar a usar o sistema.
                            </p>
                            `}
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 4px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                        <a href="${actionUrl}" style="display: inline-block; padding: 16px 36px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                            ${isNewUser ? '🔐 Definir Minha Senha' : '🚀 Acessar Minha Conta'}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                                Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
                                <a href="${actionUrl}" style="color: #667eea; word-break: break-all;">${actionUrl}</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                                © 2024 O Licitador. Todos os direitos reservados.
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                Este é um e-mail automático. Por favor, não responda.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    };

    try {
        const htmlContent = getWelcomeEmailTemplate(planName, mockActionUrl, true);

        console.log('\n📝 Email template generated');
        console.log(`   Template length: ${htmlContent.length} characters`);

        // Send email
        console.log('\n📤 Sending email via Resend...');
        const { data, error } = await resend.emails.send({
            from: 'O Licitador <contato@oliccitador.com.br>',
            to: testEmail,
            subject: 'Bem-vindo ao O Licitador! Defina sua senha',
            html: htmlContent
        });

        if (error) {
            console.error('\n❌ ERROR sending email:');
            console.error(error);
            process.exit(1);
        }

        console.log('\n✅ Email sent successfully!');
        console.log(`   Email ID: ${data.id}`);
        console.log('\n📬 Check your inbox at:', testEmail);
        console.log('   (If using a test domain, check the Resend dashboard for email preview)');

    } catch (error) {
        console.error('\n❌ ERROR during test:');
        console.error(error);
        process.exit(1);
    }
}

// Run test
testWelcomeEmail();
