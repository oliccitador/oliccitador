/**
 * Gera link de recuperação de senha manual
 * 
 * Uso: node scripts/generate-recovery-link.mjs email@usuario.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m'
};

async function generateRecoveryLink(email) {
    console.log(`\n${colors.cyan}🔐 Gerando link de recuperação para: ${email}${colors.reset}\n`);

    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Buscar usuário
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.log(`${colors.yellow}❌ Usuário não encontrado${colors.reset}\n`);
            process.exit(1);
        }

        // Verificar se senha está bloqueada
        if (user.user_metadata?.password_locked) {
            console.log(`${colors.yellow}🔒 ATENÇÃO: Este usuário tem senha BLOQUEADA${colors.reset}`);
            console.log(`   Tipo: Usuário de feedback`);
            console.log(`   Senha fixa: ${colors.bright}Feedback2025!${colors.reset}`);
            console.log(`\n   Envie essa senha manualmente para o usuário.\n`);
            process.exit(0);
        }

        // Gerar link de recuperação
        console.log('⏳ Gerando link...\n');

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/definir-senha`
            }
        });

        if (error) {
            console.error(`❌ Erro ao gerar link:`, error.message);
            process.exit(1);
        }

        if (!data?.properties?.action_link) {
            console.error(`❌ Link não foi gerado`);
            process.exit(1);
        }

        console.log(`${colors.green}✅ Link gerado com sucesso!${colors.reset}\n`);
        console.log(`${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
        console.log(`📧 ${colors.cyan}Email:${colors.reset} ${email}`);
        console.log(`⏰ ${colors.cyan}Validade:${colors.reset} 24 horas`);
        console.log(`${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

        console.log(`${colors.bright}🔗 LINK DE RECUPERAÇÃO:${colors.reset}\n`);
        console.log(`${colors.green}${data.properties.action_link}${colors.reset}\n`);

        console.log(`${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
        console.log(`${colors.yellow}💡 INSTRUÇÕES:${colors.reset}`);
        console.log(`   1. Copie o link acima`);
        console.log(`   2. Envie para o usuário via WhatsApp, SMS ou email pessoal`);
        console.log(`   3. O link expira em 24 horas`);
        console.log(`   4. Pode ser usado apenas UMA VEZ\n`);

    } catch (error) {
        console.error(`❌ Erro:`, error.message);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.error(`❌ Uso: node scripts/generate-recovery-link.mjs email@usuario.com`);
    process.exit(1);
}

generateRecoveryLink(email);
