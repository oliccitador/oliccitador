/**
 * Script to manually send password reset email for testing
 * Usage: node scripts/manual-password-reset.js email@example.com
 */

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

async function sendPasswordReset() {
    const email = process.argv[2] || 'beatriznunesmelo07@gmail.com';

    console.log(`🔐 Enviando link de redefinição de senha para: ${email}\n`);

    // Initialize Supabase Admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcqusrvpyfirnzsoctvt.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
        process.exit(1);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Check if user exists
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);

        if (!existingUser) {
            console.log('⚠️  User not found. Creating new user...');

            const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true
            });

            if (createError) {
                console.error('❌ Error creating user:', createError);
                process.exit(1);
            }

            console.log(`✅ User created: ${newUser.user.id}`);
        } else {
            console.log(`✅ User exists: ${existingUser.id}`);
        }

        // Generate recovery link
        console.log('\n📧 Generating recovery link...');
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: 'https://oliccitador.com.br/definir-senha'
            }
        });

        if (linkError) {
            console.error('❌ Error generating link:', linkError);
            process.exit(1);
        }

        const actionUrl = linkData?.properties?.action_link;
        console.log(`✅ Recovery link generated:`);
        console.log(`   ${actionUrl}\n`);

        // Send email via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) {
            console.error('❌ RESEND_API_KEY not found');
            console.log('\n⚠️  Link was generated but email was not sent.');
            console.log('You can manually copy the link above and send it to the user.');
            process.exit(0);
        }

        const resend = new Resend(resendKey);

        console.log('📤 Sending email via Resend...');
        const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>🔐 Redefinir Senha - O Licitador</h2>
    <p>Clique no botão abaixo para definir sua senha:</p>
    <p><a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #06b6d4; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Definir Minha Senha</a></p>
    <p style="color: #666; font-size: 12px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
    <p style="color: #666; font-size: 12px; word-break: break-all;">${actionUrl}</p>
</body>
</html>
        `;

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'O Licitador <contato@oliccitador.com.br>',
            to: email,
            subject: 'Redefinir Senha - O Licitador',
            html: emailHtml
        });

        if (emailError) {
            console.error('❌ Error sending email:', emailError);
            console.log('\n⚠️  Link was generated but email failed to send.');
            console.log('You can manually copy the link above and send it to the user.');
            process.exit(1);
        }

        console.log(`✅ Email sent successfully!`);
        console.log(`   Email ID: ${emailData.id}`);
        console.log(`\n✅ Done! Check inbox at ${email}`);

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

sendPasswordReset();
