// Script de Triangulação Completa: BACKUP vs LOCAL vs GITHUB
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BACKUP_DIR = path.join(process.cwd(), 'temp_backup_extract');
const LOCAL_DIR = process.cwd();

// Arquivos principais dos 23 módulos para comparar
const ARQUIVOS_PRINCIPAIS = [
    // M1 - Análise Gemini
    { modulo: 'M1', arquivo: 'lib/gemini.js', descricao: 'Análise Gemini (IA Principal)' },
    { modulo: 'M1', arquivo: 'app/api/analyze/route.js', descricao: 'API de Análise' },

    // M2 - CA/EPI (NÃO está no backup)
    { modulo: 'M2', arquivo: 'lib/ca-real-search.js', descricao: 'Busca de CA (NÃO no backup)', noBackup: true },
    { modulo: 'M2', arquivo: 'lib/caepi.js', descricao: 'Validação de CA' },

    // M3 - CATMAT
    { modulo: 'M3', arquivo: 'lib/catmat.js', descricao: 'Validação CATMAT' },
    { modulo: 'M3', arquivo: 'app/api/catmat-lookup/route.js', descricao: 'API CATMAT' },

    // M4 - Busca de Preços
    { modulo: 'M4', arquivo: 'lib/price-search.js', descricao: 'Busca de Preços' },
    { modulo: 'M4', arquivo: 'app/api/prices/route.js', descricao: 'API de Preços' },

    // M5 - PNCP
    { modulo: 'M5', arquivo: 'lib/pncp.js', descricao: 'Cliente PNCP' },

    // M6-M9 - Interface
    { modulo: 'M6', arquivo: 'app/analise/page.js', descricao: 'Página de Análise' },
    { modulo: 'M7', arquivo: 'app/dashboard/consulta-ca/page.tsx', descricao: 'Consulta CA' },
    { modulo: 'M8', arquivo: 'app/dashboard/consulta-catmat/page.tsx', descricao: 'Consulta CATMAT' },
    { modulo: 'M9', arquivo: 'app/dashboard/page.tsx', descricao: 'Dashboard' },

    // M10-M12 - Auth/Controle
    { modulo: 'M10', arquivo: 'lib/supabase.ts', descricao: 'Supabase Auth' },
    { modulo: 'M12', arquivo: 'lib/usage-tracker.js', descricao: 'Rastreamento de Uso' },
    { modulo: 'M12', arquivo: 'lib/rate-limiter.js', descricao: 'Rate Limiter' },

    // M13-M17 - Infraestrutura
    { modulo: 'M13', arquivo: 'lib/cache.js', descricao: 'Cache' },
    { modulo: 'M14', arquivo: 'lib/email-templates.ts', descricao: 'Templates de Email' },
    { modulo: 'M15', arquivo: 'lib/flow-orchestrator.js', descricao: 'Orquestrador de Fluxo' },

    // Configurações
    { modulo: 'CONFIG', arquivo: 'package.json', descricao: 'Dependências' },
    { modulo: 'CONFIG', arquivo: 'next.config.js', descricao: 'Configuração Next.js' },
    { modulo: 'CONFIG', arquivo: 'netlify.toml', descricao: 'Configuração Netlify' },
];

console.log('\n═══════════════════════════════════════════════════════════');
console.log('TRIANGULAÇÃO COMPLETA - O LICITADOR');
console.log('Data:', new Date().toLocaleString('pt-BR'));
console.log('═══════════════════════════════════════════════════════════\n');

const resultados = {
    identicos: [],
    diferentes: [],
    somenteLocal: [],
    somenteBackup: [],
    somenteGithub: [],
    erros: []
};

function getGitHubContent(filePath) {
    try {
        const content = execSync(`git show origin/main:${filePath}`, {
            cwd: LOCAL_DIR,
            encoding: 'utf8'
        });
        return content;
    } catch (error) {
        return null;
    }
}

function compareFiles(info) {
    const { modulo, arquivo, descricao, noBackup } = info;

    console.log(`\n📄 ${modulo} - ${descricao}`);
    console.log(`   Arquivo: ${arquivo}`);

    const localPath = path.join(LOCAL_DIR, arquivo);
    const backupPath = path.join(BACKUP_DIR, arquivo);

    // Verificar existência
    const existeLocal = fs.existsSync(localPath);
    const existeBackup = !noBackup && fs.existsSync(backupPath);
    const githubContent = getGitHubContent(arquivo);
    const existeGithub = githubContent !== null;

    console.log(`   Existe em LOCAL: ${existeLocal ? '✅' : '❌'}`);
    console.log(`   Existe em BACKUP: ${noBackup ? '⚠️ (Não esperado)' : existeBackup ? '✅' : '❌'}`);
    console.log(`   Existe em GITHUB: ${existeGithub ? '✅' : '❌'}`);

    // Se não existe em nenhum lugar
    if (!existeLocal && !existeBackup && !existeGithub) {
        console.log('   Status: ❌ NÃO EXISTE EM NENHUM LUGAR');
        resultados.erros.push({ modulo, arquivo, descricao, erro: 'Não existe em nenhum lugar' });
        return;
    }

    // Se é arquivo novo (não no backup)
    if (noBackup && existeLocal && existeGithub) {
        const localContent = fs.readFileSync(localPath, 'utf8');
        if (localContent === githubContent) {
            console.log('   Status: ✅ IDÊNTICO (LOCAL = GITHUB) [Arquivo novo]');
            resultados.identicos.push({ modulo, arquivo, descricao, tipo: 'novo' });
        } else {
            console.log('   Status: ⚠️ DIFERENTE (LOCAL ≠ GITHUB) [Arquivo novo modificado localmente]');
            resultados.diferentes.push({
                modulo, arquivo, descricao,
                diferenca: 'LOCAL ≠ GITHUB',
                tipo: 'novo_modificado'
            });
        }
        return;
    }

    // Comparação completa (3 pontos)
    if (existeLocal && existeBackup && existeGithub) {
        const localContent = fs.readFileSync(localPath, 'utf8');
        const backupContent = fs.readFileSync(backupPath, 'utf8');

        const localVsBackup = localContent === backupContent;
        const localVsGithub = localContent === githubContent;
        const backupVsGithub = backupContent === githubContent;

        if (localVsBackup && localVsGithub && backupVsGithub) {
            console.log('   Status: ✅ IDÊNTICO EM TODAS AS 3 VERSÕES');
            resultados.identicos.push({ modulo, arquivo, descricao, tipo: 'completo' });
        } else {
            console.log('   Status: ⚠️ DIFERENÇAS DETECTADAS:');
            if (!localVsBackup) console.log('      - LOCAL ≠ BACKUP');
            if (!localVsGithub) console.log('      - LOCAL ≠ GITHUB');
            if (!backupVsGithub) console.log('      - BACKUP ≠ GITHUB');

            resultados.diferentes.push({
                modulo, arquivo, descricao,
                diferenca: {
                    localVsBackup: !localVsBackup,
                    localVsGithub: !localVsGithub,
                    backupVsGithub: !backupVsGithub
                }
            });
        }
    } else {
        // Arquivo existe em alguns lugares mas não em todos
        if (existeLocal && !existeBackup && !existeGithub) {
            console.log('   Status: 🆕 SOMENTE EM LOCAL (não commitado)');
            resultados.somenteLocal.push({ modulo, arquivo, descricao });
        } else if (!existeLocal && existeBackup && !existeGithub) {
            console.log('   Status: 🗑️ REMOVIDO (estava no backup, não está mais)');
            resultados.somenteBackup.push({ modulo, arquivo, descricao });
        } else if (!existeLocal && !existeBackup && existeGithub) {
            console.log('   Status: ☁️ SOMENTE NO GITHUB (falta localmente)');
            resultados.somenteGithub.push({ modulo, arquivo, descricao });
        } else {
            console.log('   Status: ⚠️ SITUAÇÃO COMPLEXA');
            resultados.erros.push({ modulo, arquivo, descricao, erro: 'Situação complexa de existência' });
        }
    }
}

// Executar comparação para todos os arquivos
ARQUIVOS_PRINCIPAIS.forEach(compareFiles);

// RESUMO EXECUTIVO
console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('RESUMO EXECUTIVO');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Total de arquivos analisados: ${ARQUIVOS_PRINCIPAIS.length}`);
console.log(`✅ Idênticos nas 3 versões: ${resultados.identicos.length}`);
console.log(`⚠️  Diferentes entre versões: ${resultados.diferentes.length}`);
console.log(`🆕 Somente em LOCAL: ${resultados.somenteLocal.length}`);
console.log(`🗑️  Somente em BACKUP: ${resultados.somenteBackup.length}`);
console.log(`☁️  Somente em GITHUB: ${resultados.somenteGithub.length}`);
console.log(`❌ Erros/Situações complexas: ${resultados.erros.length}`);

// DETALHAMENTO DE DIFERENÇAS
if (resultados.diferentes.length > 0) {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('DETALHAMENTO DE DIFERENÇAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    resultados.diferentes.forEach(item => {
        console.log(`\n📌 ${item.modulo} - ${item.descricao}`);
        console.log(`   Arquivo: ${item.arquivo}`);
        if (typeof item.diferenca === 'string') {
            console.log(`   Diferença: ${item.diferenca}`);
        } else {
            if (item.diferenca.localVsBackup) console.log('   ⚠️ LOCAL ≠ BACKUP');
            if (item.diferenca.localVsGithub) console.log('   ⚠️ LOCAL ≠ GITHUB (mudanças não commitadas)');
            if (item.diferenca.backupVsGithub) console.log('   ⚠️ BACKUP ≠ GITHUB (evolução do código)');
        }
    });
}

// ARQUIVOS NOVOS (não no backup)
if (resultados.somenteLocal.length > 0) {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('ARQUIVOS NOVOS (Somente em LOCAL)');
    console.log('═══════════════════════════════════════════════════════════\n');

    resultados.somenteLocal.forEach(item => {
        console.log(`🆕 ${item.modulo} - ${item.descricao}: ${item.arquivo}`);
    });
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('FIM DO RELATÓRIO');
console.log('═══════════════════════════════════════════════════════════\n');
