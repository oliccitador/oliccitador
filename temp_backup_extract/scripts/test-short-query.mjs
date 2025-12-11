// TESTE CORRIGIDO: Busca com Query CURTA E LIMPA
import { searchGoogleAPI } from '../lib/serpapi.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) process.env.SERPAPI_KEY = match[1].trim();
}

console.log('═══════════════════════════════════════════════════════════');
console.log('   TESTE CORRIGIDO: QUERY CURTA E LIMPA');
console.log('═══════════════════════════════════════════════════════════\n');

const testCases = [
    {
        name: 'Óculos Policarbonato',
        queryLimpa: 'óculos proteção policarbonato antiembaçante'
    },
    {
        name: 'Óculos Genebra Kalipso',
        queryLimpa: 'óculos segurança genebra kalipso'
    },
    {
        name: 'Óculos Ampla Visão PVC',
        queryLimpa: 'óculos ampla visão pvc flexível acetato'
    }
];

for (const test of testCases) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${test.name}`);
    console.log(`${'═'.repeat(60)}\n`);
    console.log(`Query Limpa: "${test.queryLimpa}"\n`);

    try {
        const results = await searchGoogleAPI(test.queryLimpa);

        console.log(`✅ Resultados: ${results.length}\n`);

        if (results.length > 0) {
            console.log('Top 3:\n');
            results.slice(0, 3).forEach((r, i) => {
                console.log(`${i + 1}. ${r.titulo}`);
                console.log(`   Fonte: ${r.loja}`);
                console.log(`   Preço: ${r.preco_formatado || 'N/A'}\n`);
            });
        } else {
            console.log('❌ Nenhum resultado\n');
        }
    } catch (error) {
        console.error(`❌ Erro: ${error.message}\n`);
    }
}

console.log('\n' + '═'.repeat(60));
console.log('CONCLUSÃO: Query curta FUNCIONA?');
console.log('═'.repeat(60) + '\n');
