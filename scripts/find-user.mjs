/**
 * Busca rápida de usuário por email
 * 
 * Uso: node scripts/find-user.mjs email@usuario.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

async function findUser(email) {
    console.log(`\n${colors.cyan}🔍 Buscando: ${email}${colors.reset}\n`);

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Buscar usuário
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.log(`${colors.red}❌ Usuário NÃO encontrado no sistema${colors.reset}\n`);
            console.log(`${colors.yellow}💡 Possíveis causas:${colors.reset}`);
            console.log(`   1. Email digitado incorretamente`);
            console.log(`   2. Usuário nunca se cadastrou`);
            console.log(`   3. Conta foi deletada\n`);
            process.exit(1);
        }

        console.log(`${colors.green}✅ Usuário encontrado!${colors.reset}\n`);
        console.log(`${colors.bright}📋 INFORMAÇÕES DA CONTA:${colors.reset}`);
        console.log(`${colors.dim}${'═'.repeat(60)}${colors.reset}`);

        console.log(`Email: ${colors.cyan}${user.email}${colors.reset}`);
        console.log(`User ID: ${colors.dim}${user.id}${colors.reset}`);
        console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log(`Última atualização: ${new Date(user.updated_at).toLocaleString('pt-BR')}`);
        console.log(`Email confirmado: ${user.email_confirmed_at ? `${colors.green}Sim${colors.reset}` : `${colors.red}Não${colors.reset}`}`);

        // Metadata
        if (user.user_metadata) {
            console.log(`\n${colors.bright}🔧 METADATA:${colors.reset}`);
            if (user.user_metadata.password_locked) {
                console.log(`   🔒 ${colors.yellow}Senha BLOQUEADA${colors.reset} (usuário de feedback)`);
            }
            if (user.user_metadata.grant_type) {
                console.log(`   Tipo: ${user.user_metadata.grant_type}`);
            }
            if (user.user_metadata.account_type) {
                console.log(`   Categoria: ${user.user_metadata.account_type}`);
            }
        }

        // Buscar subscription
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (sub) {
            console.log(`\n${colors.bright}💳 SUBSCRIPTION:${colors.reset}`);
            console.log(`   Status: ${sub.status === 'active' ? `${colors.green}ATIVO${colors.reset}` : `${colors.red}${sub.status.toUpperCase()}${colors.reset}`}`);
            console.log(`   Plano: ${sub.plan}`);
            console.log(`   Quota: ${sub.quota_used}/${sub.quota_limit}`);
            console.log(`   Expira: ${new Date(sub.current_period_end).toLocaleString('pt-BR')}`);
        } else {
            console.log(`\n${colors.yellow}⚠️  SEM SUBSCRIPTION ATIVA${colors.reset}`);
        }

        console.log(`\n${colors.dim}${'═'.repeat(60)}${colors.reset}\n`);

        // Diagnóstico de email
        console.log(`${colors.bright}📧 DIAGNÓSTICO DE EMAIL:${colors.reset}\n`);

        if (user.user_metadata?.password_locked) {
            console.log(`${colors.red}🚫 PROBLEMA IDENTIFICADO:${colors.reset}`);
            console.log(`   Este usuário tem senha BLOQUEADA (conta de feedback)`);
            console.log(`   O sistema ${colors.yellow}NÃO ENVIA${colors.reset} email de recuperação para ele.`);
            console.log(`\n${colors.cyan}💡 SOLUÇÃO:${colors.reset}`);
            console.log(`   Senha fixa: ${colors.bright}Feedback2025!${colors.reset}`);
            console.log(`   Envie essa senha manualmente para o usuário.\n`);
        } else if (!user.email_confirmed_at) {
            console.log(`${colors.yellow}⚠️  Email NÃO confirmado${colors.reset}`);
            console.log(`   Isso pode causar problemas no envio de emails.`);
            console.log(`   Supabase pode bloquear envio para emails não verificados.\n`);
        } else if (!sub) {
            console.log(`${colors.yellow}⚠️  Sem subscription ativa${colors.reset}`);
            console.log(`   Usuário existe mas não tem plano ativo.`);
            console.log(`   Ele consegue fazer login mas não pode usar o sistema.\n`);
        } else {
            console.log(`${colors.green}✅ Tudo OK com a conta${colors.reset}`);
            console.log(`   Usuário deveria receber email normalmente.`);
            console.log(`\n${colors.cyan}💡 Possíveis causas de não receber:${colors.reset}`);
            console.log(`   1. Email caiu na caixa de SPAM`);
            console.log(`   2. Filtros do iCloud (comum em @icloud.com)`);
            console.log(`   3. Delay no envio (pode demorar uns minutos)`);
            console.log(`   4. Problema temporário no Resend\n`);
        }

    } catch (error) {
        console.error(`${colors.red}❌ Erro:${colors.reset}`, error.message);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.error(`${colors.red}❌ Uso: node scripts/find-user.mjs email@usuario.com${colors.reset}`);
    process.exit(1);
}

findUser(email);
