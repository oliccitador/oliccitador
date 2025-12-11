// Script para comparar .env.local atual com o backup
import fs from 'fs';
import path from 'path';

const currentEnvPath = path.join(process.cwd(), '.env.local');
const backupEnvPath = path.join(process.cwd(), 'temp_backup_extract', '.env.local');

console.log('\n🔍 COMPARAÇÃO DE VARIÁVEIS DE AMBIENTE\n');
console.log('═══════════════════════════════════════════════════════════\n');

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const vars = {};

    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                vars[key.trim()] = value;
            }
        }
    });

    return vars;
}

const currentVars = parseEnvFile(currentEnvPath);
const backupVars = parseEnvFile(backupEnvPath);

if (!currentVars) {
    console.error('❌ Não foi possível ler .env.local atual\n');
    process.exit(1);
}

if (!backupVars) {
    console.error('❌ Não foi possível ler .env.local do backup\n');
    console.log('📌 Certifique-se de que o backup foi extraído em temp_backup_extract/\n');
    process.exit(1);
}

console.log('✅ Arquivos lidos com sucesso!\n');
console.log(`   Atual: ${Object.keys(currentVars).length} variáveis`);
console.log(`   Backup: ${Object.keys(backupVars).length} variáveis\n`);

console.log('═══════════════════════════════════════════════════════════\n');

// Variáveis relacionadas ao Google
const googleKeys = [
    'GOOGLE_API_KEY',
    'GOOGLE_SEARCH_API_KEY',
    'GOOGLE_SEARCH_API_KEY_2',
    'GOOGLE_SEARCH_CX',
    'GOOGLE_SEARCH_ENGINE_ID'
];

console.log('🔑 VARIÁVEIS DO GOOGLE:\n');

googleKeys.forEach(key => {
    const currentValue = currentVars[key];
    const backupValue = backupVars[key];

    console.log(`\n📌 ${key}:`);

    if (currentValue && backupValue) {
        if (currentValue === backupValue) {
            console.log(`   ✅ IGUAL em ambos`);
            console.log(`   Valor: ${currentValue.substring(0, 20)}...`);
        } else {
            console.log(`   ⚠️  DIFERENTE`);
            console.log(`   Atual:  ${currentValue.substring(0, 20)}...`);
            console.log(`   Backup: ${backupValue.substring(0, 20)}...`);
        }
    } else if (currentValue && !backupValue) {
        console.log(`   ℹ️  Existe APENAS no atual`);
        console.log(`   Valor: ${currentValue.substring(0, 20)}...`);
    } else if (!currentValue && backupValue) {
        console.log(`   ⚠️  Existe APENAS no backup`);
        console.log(`   Valor: ${backupValue.substring(0, 20)}...`);
    } else {
        console.log(`   ❌ NÃO existe em nenhum`);
    }
});

console.log('\n═══════════════════════════════════════════════════════════\n');

// Verificar se há alguma chave do backup que poderia resolver o problema
console.log('💡 ANÁLISE:\n');

const backupGoogleApiKey = backupVars['GOOGLE_API_KEY'];
const backupSearchCx = backupVars['GOOGLE_SEARCH_CX'] || backupVars['GOOGLE_SEARCH_ENGINE_ID'];

if (backupGoogleApiKey && backupSearchCx) {
    console.log('   ✅ O backup contém GOOGLE_API_KEY e SEARCH_CX');
    console.log('   📌 Estas credenciais podem ser diferentes das atuais');
    console.log('   📌 Pode valer a pena testar as credenciais do backup\n');
} else {
    console.log('   ⚠️  O backup NÃO contém todas as credenciais necessárias\n');
}

console.log('═══════════════════════════════════════════════════════════\n');
