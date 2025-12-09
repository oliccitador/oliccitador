/**
 * Script para bloquear/desativar acesso de um usuário
 * 
 * Uso: node scripts/revoke-access.mjs email@usuario.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function revokeAccess(email) {
    console.log(`🚫 Bloqueando acesso para: ${email}\n`);

    if (!email || !email.includes('@')) {
        console.error('❌ Email inválido!');
        process.exit(1);
    }

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        console.log('⏳ Procurando usuário...');

        // Buscar usuário
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUsers?.users?.find((u) => u.email === email);

        if (!user) {
            console.error('❌ Usuário não encontrado!');
            process.exit(1);
        }

        console.log(`✅ Usuário encontrado: ${user.id}`);

        // Desativar subscription
        console.log('🔒 Desativando subscription...');
        const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status: 'cancelled',
                quota_limit: 0,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (subError) {
            console.warn('⚠️ Erro ao desativar subscription:', subError.message);
        } else {
            console.log('✅ Subscription desativada');
        }

        // Deletar sessões ativas (força logout)
        console.log('🔐 Removendo sessões ativas...');
        try {
            await supabaseAdmin.auth.admin.signOut(user.id);
            console.log('✅ Sessões removidas');
        } catch (signOutError) {
            console.warn('⚠️ Erro ao remover sessões:', signOutError.message);
        }

        console.log('\n✅ Acesso bloqueado com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   Email: ${email}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Status: Bloqueado`);
        console.log(`   Quota: 0`);
        console.log('\n💡 O usuário não conseguirá mais fazer análises.');

    } catch (error) {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.error('❌ Uso: node scripts/revoke-access.mjs email@usuario.com');
    process.exit(1);
}

revokeAccess(email);
