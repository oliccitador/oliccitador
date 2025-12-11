import { determineFlow, executeFlow } from '../lib/flow-orchestrator.js';

const description = "ANEL MOLDÁVEL PARA PROTEÇÃO DE OSTOMIA CATMAT 477283";

console.log('=== TESTE CATMAT 477283 ===\n');

// Test 1: Determine flow
const flowInfo = determineFlow({ description, ca: null, catmat: null });
console.log('1. Flow Info:', flowInfo);

if (flowInfo.flow === 'FLOW_3_CATMAT' && flowInfo.catmat === '477283') {
    console.log('✅ CATMAT detectado corretamente via regex!\n');
} else {
    console.log('❌ FALHA: CATMAT não detectado\n');
    process.exit(1);
}

// Test 2: Execute flow
console.log('2. Executando Flow 3...');
const result = await executeFlow(flowInfo, { description });

console.log('\n3. Resultado:');
console.log('   - Status:', result.status);
console.log('   - Códigos detectados:', result.codigos_detectados);
console.log('   - CATMAT Data:', result.catmat_data ? 'Encontrado' : 'Não encontrado');

if (result.codigos_detectados?.catmat === '477283') {
    console.log('\n✅ SUCESSO: CATMAT funcionando corretamente!');
} else {
    console.log('\n❌ FALHA: codigos_detectados incorreto');
    process.exit(1);
}
