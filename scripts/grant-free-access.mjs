/**
 * Script para liberar acesso gratuito (Plano Básico) para usuários de feedback
 * SENHA FIXA: Feedback2025! (NÃO PODE SER ALTERADA)
 * 
 * Uso: node scripts/grant-free-access.mjs email@usuario.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' });

const PLAN_CONFIG = {
    basico: { name: 'Básico', quota: 50 }
};

// SENHA FIXA PARA TODOS OS USUÁRIOS DE FEEDBACK
const FIXED_FEEDBACK_PASSWORD = 'Feedback2025!';

async function grantFreeAccess(email) {
    console.log(`🎁 Liberando acesso gratuito (Plano Básico) para: ${email}\n`);

    // Validação básica de email
    if (!email || !email.includes('@')) {
        console.error('❌ Email inválido!');
        process.exit(1);
    }

    try {
        // Inicializar cliente
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        console.log('⏳ Verificando se usuário já existe...');

        // Verificar se já existe
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === email);

        let userId;
        let isNewUser = false;

        if (existingUser) {
            userId = existingUser.id;
            console.log(`✅ Usuário já existe: ${userId}`);
            console.log('📝 Atualizando plano...');
        } else {
            isNewUser = true;
            console.log('👤 Criando novo usuário de FEEDBACK...');
            console.log(`🔐 Senha pré-estabelecida: ${FIXED_FEEDBACK_PASSWORD}`);

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: FIXED_FEEDBACK_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    plan: 'basico',
                    created_via: 'admin_grant',
                    grant_type: 'feedback_user',
                    password_locked: true, // FLAG: Senha não pode ser alterada
                    account_type: 'teste_feedback'
                }
            });

            if (createError) {
                console.error('❌ Erro ao criar usuário:', createError.message);
                process.exit(1);
            }

            userId = newUser.user.id;
            console.log(`✅ Usuário criado: ${userId}`);
        }

        // Criar/Atualizar subscription
        console.log('💳 Configurando subscription...');
        const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userId,
                plan: 'basico',
                quota_limit: PLAN_CONFIG.basico.quota,
                quota_used: 0,
                status: 'active',
                updated_at: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
            }, {
                onConflict: 'user_id'
            });

        if (subError) {
            console.error('❌ Erro ao criar subscription:', subError.message);
            process.exit(1);
        }

        console.log('✅ Subscription ativada (Plano Básico - 50 análises/mês)');

        // Email NÃO é enviado - usuário de feedback tem senha fixa
        console.log('\n⚠️  Email NÃO enviado (usuário de feedback com senha fixa)');

        console.log('\n✨ Processo concluído com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   Email: ${email}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Plano: Básico (50 análises/mês)`);
        console.log(`   Validade: 1 ano`);
        console.log(`   Status: Ativo`);
        console.log(`   Tipo: ⚠️  USUÁRIO DE FEEDBACK`);

        if (isNewUser) {
            console.log(`\n🔑 CREDENCIAIS DE ACESSO:`);
            console.log(`   📧 Email: ${email}`);
            console.log(`   🔐 Senha: ${FIXED_FEEDBACK_PASSWORD}`);
            console.log(`   🔒 SENHA BLOQUEADA (não pode ser alterada pelo usuário)`);
            console.log(`\n💡 Envie essas credenciais ao testador/feedback user`);
        }

    } catch (error) {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    }
}

// Executar
const email = process.argv[2];
if (!email) {
    console.error('❌ Uso: node scripts/grant-free-access.mjs email@usuario.com');
    process.exit(1);
}

grantFreeAccess(email);
