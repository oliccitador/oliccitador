// Test completo do fluxo CATMAT
import { analyzeWithFlow } from '../lib/gemini.js';

console.log('╔═══════════════════════════════════════╗');
console.log('║  TESTE COMPLETO - FLUXO CATMAT        ║');
console.log('╚═══════════════════════════════════════╝\n');

const testCases = [
    {
        name: 'CATMAT 477283 (detectado no texto)',
        description: 'ANEL MOLDÁVEL PARA PROTEÇÃO DE OSTOMIA CATMAT 477283',
        ca: null,
        catmat: null,
        expected: {
            flow: 'FLOW_3_CATMAT',
            catmat: '477283'
        }
    },
    {
        name: 'CATMAT 477283 (campo manual)',
        description: 'Anel moldável para ostomia',
        ca: null,
        catmat: '477283',
        expected: {
            flow: 'FLOW_3_CATMAT',
            catmat: '477283'
        }
    }
];

let passed = 0;
let failed = 0;

for (const test of testCases) {
    console.log(`\n📝 Teste: ${test.name}`);
    console.log(`   Descrição: "${test.description.substring(0, 50)}..."`);

    try {
        const result = await analyzeWithFlow(test.description, test.ca, test.catmat);

        // Verificações
        const flowOk = result.flow_used === test.expected.flow;
        const catmatOk = result.codigos_detectados?.catmat === test.expected.catmat;
        const dataOk = result.catmat_data !== null && result.catmat_data !== undefined;

        if (flowOk && catmatOk && dataOk) {
            console.log('   ✅ PASSOU');
            console.log(`      Flow: ${result.flow_used}`);
            console.log(`      CATMAT detectado: ${result.codigos_detectados?.catmat}`);
            console.log(`      Dados CATMAT: ${result.catmat_data ? 'OK' : 'Null'}`);
            passed++;
        } else {
            console.log('   ❌ FALHOU');
            if (!flowOk) console.log(`      Flow incorreto: ${result.flow_used} (esperado: ${test.expected.flow})`);
            if (!catmatOk) console.log(`      CATMAT incorreto: ${result.codigos_detectados?.catmat} (esperado: ${test.expected.catmat})`);
            if (!dataOk) console.log(`      Dados CATMAT ausentes`);
            failed++;
        }
    } catch (error) {
        console.log('   ❌ ERRO:', error.message);
        failed++;
    }
}

console.log('\n' + '═'.repeat(45));
console.log(`RESULTADO: ${passed} passou, ${failed} falhou`);
console.log('═'.repeat(45));

if (failed > 0) {
    process.exit(1);
}
