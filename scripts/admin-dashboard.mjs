#!/usr/bin/env node

/**
 * 📊 PAINEL ADMINISTRATIVO - O Licitador
 * 
 * Dashboard completo para gerenciar e monitorar usuários
 * 
 * Uso: node scripts/admin-dashboard.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

// ANSI Colors para o terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let supabaseAdmin;

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function getStatusBadge(status) {
    switch (status?.toLowerCase()) {
        case 'active':
            return `${colors.bgGreen}${colors.white} ATIVO ${colors.reset}`;
        case 'cancelled':
            return `${colors.bgRed}${colors.white} BLOQ ${colors.reset}`;
        case 'expired':
            return `${colors.bgYellow}${colors.white} EXPIR ${colors.reset}`;
        default:
            return `${colors.dim} INDF ${colors.reset}`;
    }
}

function getPlanBadge(plan) {
    const plans = {
        basico: `${colors.bgBlue}${colors.white} BÁSICO ${colors.reset}`,
        pro: `${colors.bgMagenta}${colors.white} PRO ${colors.reset}`,
        premium: `${colors.bgYellow}${colors.white} PREMIUM ${colors.reset}`
    };
    return plans[plan?.toLowerCase()] || `${colors.dim} SEM PLANO ${colors.reset}`;
}

function getQuotaBar(used, limit) {
    const percentage = (used / limit) * 100;
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);

    let color = colors.green;
    if (percentage > 80) color = colors.red;
    else if (percentage > 50) color = colors.yellow;

    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    return `${color}${bar}${colors.reset} ${used}/${limit} (${percentage.toFixed(0)}%)`;
}

async function initSupabase() {
    supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

async function getAllUsersWithSubscriptions() {
    // Busca usuários
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();

    // Busca subscriptions
    const { data: subscriptions } = await supabaseAdmin
        .from('subscriptions')
        .select('*');

    // Combinar dados
    return users.users.map(user => {
        const sub = subscriptions?.find(s => s.user_id === user.id);
        return {
            ...user,
            subscription: sub || null
        };
    });
}

async function showMainMenu() {
    console.clear();
    console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         ${colors.bright}📊 PAINEL ADMINISTRATIVO - O LICITADOR${colors.reset}${colors.cyan}          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}Menu Principal:${colors.reset}

  ${colors.green}1.${colors.reset} 👥 Listar TODOS os usuários
  ${colors.green}2.${colors.reset} 💚 Listar usuários ATIVOS
  ${colors.green}3.${colors.reset} 🚫 Listar usuários BLOQUEADOS
  ${colors.green}4.${colors.reset} 🔍 Buscar usuário por email
  ${colors.green}5.${colors.reset} 📈 Estatísticas gerais
  ${colors.green}6.${colors.reset} 📊 Ranking de uso
  ${colors.green}7.${colors.reset} 📄 Exportar relatório CSV
  ${colors.red}0.${colors.reset} ❌ Sair

${colors.dim}═══════════════════════════════════════════════════════════════${colors.reset}
`);
}

async function listAllUsers() {
    console.log(`\n${colors.cyan}${colors.bright}📋 LISTA COMPLETA DE USUÁRIOS${colors.reset}\n`);

    const users = await getAllUsersWithSubscriptions();

    if (users.length === 0) {
        console.log(`${colors.yellow}⚠️  Nenhum usuário encontrado${colors.reset}\n`);
        return;
    }

    console.log(`${colors.dim}Total: ${users.length} usuários${colors.reset}\n`);

    users.forEach((user, index) => {
        const sub = user.subscription;
        console.log(`${colors.bright}${index + 1}. ${user.email}${colors.reset}`);
        console.log(`   ID: ${colors.dim}${user.id}${colors.reset}`);
        console.log(`   Status: ${getStatusBadge(sub?.status)}`);
        console.log(`   Plano: ${getPlanBadge(sub?.plan)}`);

        if (sub) {
            console.log(`   Quota: ${getQuotaBar(sub.quota_used || 0, sub.quota_limit || 0)}`);
            console.log(`   Válido até: ${colors.cyan}${formatDate(sub.current_period_end)}${colors.reset}`);
        } else {
            console.log(`   ${colors.red}⚠️  Sem subscription ativa${colors.reset}`);
        }

        console.log(`   Criado em: ${colors.dim}${formatDate(user.created_at)}${colors.reset}`);
        console.log('');
    });
}

async function listActiveUsers() {
    console.log(`\n${colors.green}${colors.bright}💚 USUÁRIOS ATIVOS${colors.reset}\n`);

    const users = await getAllUsersWithSubscriptions();
    const activeUsers = users.filter(u => u.subscription?.status === 'active');

    if (activeUsers.length === 0) {
        console.log(`${colors.yellow}⚠️  Nenhum usuário ativo${colors.reset}\n`);
        return;
    }

    console.log(`${colors.dim}Total: ${activeUsers.length} usuários ativos${colors.reset}\n`);

    activeUsers.forEach((user, index) => {
        const sub = user.subscription;
        const percentUsed = ((sub.quota_used / sub.quota_limit) * 100).toFixed(0);

        console.log(`${colors.bright}${index + 1}. ${user.email}${colors.reset} ${getPlanBadge(sub.plan)}`);
        console.log(`   Uso: ${getQuotaBar(sub.quota_used, sub.quota_limit)}`);
        console.log(`   Expira: ${colors.cyan}${formatDate(sub.current_period_end)}${colors.reset}`);
        console.log('');
    });
}

async function listBlockedUsers() {
    console.log(`\n${colors.red}${colors.bright}🚫 USUÁRIOS BLOQUEADOS${colors.reset}\n`);

    const users = await getAllUsersWithSubscriptions();
    const blockedUsers = users.filter(u => u.subscription?.status === 'cancelled');

    if (blockedUsers.length === 0) {
        console.log(`${colors.yellow}⚠️  Nenhum usuário bloqueado${colors.reset}\n`);
        return;
    }

    console.log(`${colors.dim}Total: ${blockedUsers.length} usuários bloqueados${colors.reset}\n`);

    blockedUsers.forEach((user, index) => {
        console.log(`${colors.bright}${index + 1}. ${user.email}${colors.reset}`);
        console.log(`   ID: ${colors.dim}${user.id}${colors.reset}`);
        console.log(`   Bloqueado em: ${colors.red}${formatDate(user.subscription?.updated_at)}${colors.reset}`);
        console.log('');
    });
}

async function searchUserByEmail() {
    return new Promise((resolve) => {
        rl.question(`\n${colors.cyan}📧 Digite o email: ${colors.reset}`, async (email) => {
            if (!email) {
                console.log(`${colors.red}❌ Email não pode ser vazio${colors.reset}`);
                resolve();
                return;
            }

            const users = await getAllUsersWithSubscriptions();
            const user = users.find(u => u.email.toLowerCase().includes(email.toLowerCase()));

            if (!user) {
                console.log(`${colors.red}❌ Usuário não encontrado${colors.reset}\n`);
                resolve();
                return;
            }

            const sub = user.subscription;

            console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);
            console.log(`${colors.cyan}${colors.bright}           DETALHES DO USUÁRIO${colors.reset}`);
            console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

            console.log(`${colors.bright}Email:${colors.reset} ${user.email}`);
            console.log(`${colors.bright}ID:${colors.reset} ${colors.dim}${user.id}${colors.reset}`);
            console.log(`${colors.bright}Criado em:${colors.reset} ${formatDate(user.created_at)}`);
            console.log(`${colors.bright}Última atualização:${colors.reset} ${formatDate(user.updated_at)}`);
            console.log(`${colors.bright}Email confirmado:${colors.reset} ${user.email_confirmed_at ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);

            if (sub) {
                console.log(`\n${colors.bright}📊 SUBSCRIPTION:${colors.reset}`);
                console.log(`  Status: ${getStatusBadge(sub.status)}`);
                console.log(`  Plano: ${getPlanBadge(sub.plan)}`);
                console.log(`  Quota: ${getQuotaBar(sub.quota_used || 0, sub.quota_limit || 0)}`);
                console.log(`  Período atual termina: ${colors.cyan}${formatDate(sub.current_period_end)}${colors.reset}`);
                console.log(`  Última atualização: ${formatDate(sub.updated_at)}`);
            } else {
                console.log(`\n${colors.red}⚠️  SEM SUBSCRIPTION ATIVA${colors.reset}`);
            }

            console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
            resolve();
        });
    });
}

async function showStatistics() {
    console.log(`\n${colors.magenta}${colors.bright}📈 ESTATÍSTICAS GERAIS${colors.reset}\n`);

    const users = await getAllUsersWithSubscriptions();
    const activeUsers = users.filter(u => u.subscription?.status === 'active');
    const blockedUsers = users.filter(u => u.subscription?.status === 'cancelled');
    const usersWithoutSub = users.filter(u => !u.subscription);

    const totalQuotaUsed = users.reduce((sum, u) => sum + (u.subscription?.quota_used || 0), 0);
    const totalQuotaLimit = users.reduce((sum, u) => sum + (u.subscription?.quota_limit || 0), 0);

    const planCounts = {
        basico: users.filter(u => u.subscription?.plan === 'basico').length,
        pro: users.filter(u => u.subscription?.plan === 'pro').length,
        premium: users.filter(u => u.subscription?.plan === 'premium').length
    };

    console.log(`${colors.bright}👥 Total de usuários:${colors.reset} ${colors.cyan}${users.length}${colors.reset}`);
    console.log(`${colors.green}   ├─ Ativos:${colors.reset} ${activeUsers.length}`);
    console.log(`${colors.red}   ├─ Bloqueados:${colors.reset} ${blockedUsers.length}`);
    console.log(`${colors.yellow}   └─ Sem subscription:${colors.reset} ${usersWithoutSub.length}`);

    console.log(`\n${colors.bright}📊 Por Plano:${colors.reset}`);
    console.log(`   ├─ Básico: ${planCounts.basico}`);
    console.log(`   ├─ Pro: ${planCounts.pro}`);
    console.log(`   └─ Premium: ${planCounts.premium}`);

    console.log(`\n${colors.bright}💎 Uso de Quota Total:${colors.reset}`);
    console.log(`   ${getQuotaBar(totalQuotaUsed, totalQuotaLimit)}`);

    const avgUsage = activeUsers.length > 0
        ? (activeUsers.reduce((sum, u) => sum + ((u.subscription?.quota_used || 0) / (u.subscription?.quota_limit || 1) * 100), 0) / activeUsers.length).toFixed(1)
        : 0;

    console.log(`\n${colors.bright}📈 Média de uso (ativos):${colors.reset} ${colors.cyan}${avgUsage}%${colors.reset}`);
    console.log('');
}

async function showRanking() {
    console.log(`\n${colors.yellow}${colors.bright}🏆 RANKING DE USO (Top 10)${colors.reset}\n`);

    const users = await getAllUsersWithSubscriptions();
    const rankedUsers = users
        .filter(u => u.subscription?.status === 'active')
        .sort((a, b) => (b.subscription?.quota_used || 0) - (a.subscription?.quota_used || 0))
        .slice(0, 10);

    if (rankedUsers.length === 0) {
        console.log(`${colors.yellow}⚠️  Nenhum usuário ativo para ranking${colors.reset}\n`);
        return;
    }

    rankedUsers.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const sub = user.subscription;

        console.log(`${medal} ${colors.bright}${user.email}${colors.reset}`);
        console.log(`   ${getQuotaBar(sub.quota_used, sub.quota_limit)}`);
        console.log('');
    });
}

async function exportCSV() {
    console.log(`\n${colors.blue}${colors.bright}📄 EXPORTANDO RELATÓRIO...${colors.reset}\n`);

    const users = await getAllUsersWithSubscriptions();

    let csv = 'Email,User ID,Status,Plano,Quota Usada,Quota Limite,% Uso,Criado Em,Expira Em\n';

    users.forEach(user => {
        const sub = user.subscription;
        const percentUsed = sub ? ((sub.quota_used / sub.quota_limit) * 100).toFixed(1) : '0';

        csv += `"${user.email}",`;
        csv += `"${user.id}",`;
        csv += `"${sub?.status || 'sem_subscription'}",`;
        csv += `"${sub?.plan || 'nenhum'}",`;
        csv += `${sub?.quota_used || 0},`;
        csv += `${sub?.quota_limit || 0},`;
        csv += `${percentUsed},`;
        csv += `"${formatDate(user.created_at)}",`;
        csv += `"${formatDate(sub?.current_period_end)}"`;
        csv += '\n';
    });

    const filename = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
    const fs = await import('fs');
    fs.writeFileSync(filename, csv, 'utf-8');

    console.log(`${colors.green}✅ Relatório exportado: ${colors.cyan}${filename}${colors.reset}`);
    console.log(`${colors.dim}   Total: ${users.length} usuários${colors.reset}\n`);
}

async function promptContinue() {
    return new Promise((resolve) => {
        rl.question(`\n${colors.dim}Pressione ENTER para voltar ao menu...${colors.reset}`, () => {
            resolve();
        });
    });
}

async function mainLoop() {
    while (true) {
        await showMainMenu();

        const choice = await new Promise((resolve) => {
            rl.question(`${colors.bright}Escolha uma opção: ${colors.reset}`, resolve);
        });

        switch (choice.trim()) {
            case '1':
                await listAllUsers();
                await promptContinue();
                break;
            case '2':
                await listActiveUsers();
                await promptContinue();
                break;
            case '3':
                await listBlockedUsers();
                await promptContinue();
                break;
            case '4':
                await searchUserByEmail();
                await promptContinue();
                break;
            case '5':
                await showStatistics();
                await promptContinue();
                break;
            case '6':
                await showRanking();
                await promptContinue();
                break;
            case '7':
                await exportCSV();
                await promptContinue();
                break;
            case '0':
                console.log(`\n${colors.cyan}👋 Até logo!${colors.reset}\n`);
                rl.close();
                process.exit(0);
            default:
                console.log(`\n${colors.red}❌ Opção inválida${colors.reset}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Iniciar
(async () => {
    console.clear();
    console.log(`${colors.cyan}${colors.bright}Inicializando painel...${colors.reset}`);

    try {
        await initSupabase();
        console.log(`${colors.green}✅ Conectado ao Supabase${colors.reset}\n`);
        await new Promise(resolve => setTimeout(resolve, 500));
        await mainLoop();
    } catch (error) {
        console.error(`${colors.red}❌ Erro fatal:${colors.reset}`, error.message);
        rl.close();
        process.exit(1);
    }
})();
