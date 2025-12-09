#!/usr/bin/env node

/**
 * 📊 VISUALIZAÇÃO RÁPIDA - Estatísticas
 * 
 * Mostra snapshot do sistema sem necessidade de interação
 * 
 * Uso: node scripts/quick-stats.mjs
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

async function getStats() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const { data: subscriptions } = await supabaseAdmin.from('subscriptions').select('*');

    const combined = users.users.map(user => ({
        ...user,
        subscription: subscriptions?.find(s => s.user_id === user.id)
    }));

    const activeUsers = combined.filter(u => u.subscription?.status === 'active');
    const blockedUsers = combined.filter(u => u.subscription?.status === 'cancelled');

    const totalQuotaUsed = combined.reduce((sum, u) => sum + (u.subscription?.quota_used || 0), 0);
    const totalQuotaLimit = combined.reduce((sum, u) => sum + (u.subscription?.quota_limit || 0), 0);

    const planCounts = {
        basico: combined.filter(u => u.subscription?.plan === 'basico').length,
        pro: combined.filter(u => u.subscription?.plan === 'pro').length,
        premium: combined.filter(u => u.subscription?.plan === 'premium').length
    };

    console.clear();
    console.log(`
${colors.cyan}${colors.bright}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         📊 O LICITADOR - ESTATÍSTICAS RÁPIDAS                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}👥 USUÁRIOS:${colors.reset}
   Total: ${colors.cyan}${combined.length}${colors.reset}
   ${colors.green}✓${colors.reset} Ativos: ${activeUsers.length}
   ${colors.red}✗${colors.reset} Bloqueados: ${blockedUsers.length}

${colors.bright}📊 PLANOS:${colors.reset}
   Básico: ${planCounts.basico}
   Pro: ${planCounts.pro}
   Premium: ${planCounts.premium}

${colors.bright}💎 USO TOTAL DE QUOTA:${colors.reset}
   Usado: ${totalQuotaUsed} de ${totalQuotaLimit} (${((totalQuotaUsed / totalQuotaLimit) * 100).toFixed(1)}%)

${colors.bright}📈 ÚLTIMOS 5 USUÁRIOS CADASTRADOS:${colors.reset}
`);

    combined.slice(-5).reverse().forEach((u, i) => {
        const status = u.subscription?.status === 'active' ? `${colors.green}ATIVO${colors.reset}` : `${colors.red}INATIVO${colors.reset}`;
        console.log(`   ${i + 1}. ${colors.bright}${u.email}${colors.reset} - ${status}`);
    });

    console.log(`
${colors.dim}═══════════════════════════════════════════════════════════════
Para dashboard completo: node scripts/admin-dashboard.mjs${colors.reset}
`);
}

getStats().catch(err => {
    console.error(`${colors.red}Erro:${colors.reset}`, err.message);
    process.exit(1);
});
