// Teste direto do flow orchestrator (sem Gemini)
import { determineFlow, executeFlow } from '../lib/flow-orchestrator.js';

console.log('═══════════════════════════════════════');
console.log('   TESTE FLOW ORCHESTRATOR - CATMAT   ');
console.log('═══════════════════════════════════════\n');

const description = "ANEL MOLDÁVEL PARA PROTEÇÃO DE OSTOMIA CATMAT 477283";

// Teste 1: Determine Flow
console.log('1️⃣  Teste de Detecção');
const flowInfo = determineFlow({ description, ca: null, catmat: null });
console.log('   Flow:', flowInfo.flow);
console.log('   CA:', flowInfo.ca);
console.log('   CATMAT:', flowInfo.catmat);

if (flowInfo.flow === 'FLOW_3_CATMAT' && flowInfo.catmat === '477283') {
    console.log('   ✅ DETECÇÃO OK\n');
} else {
    console.log('   ❌ DETECÇÃO FALHOU\n');
    process.exit(1);
}

// Teste 2: Execute Flow
console.log('2️⃣  Teste de Execução');
try {
    const result = await executeFlow(flowInfo, { description });

    console.log('   Flow usado:', result.flow_used);
    console.log('   Status:', result.status);
    console.log('   Códigos detectados:', result.codigos_detectados);
    console.log('   CATMAT data:', result.catmat_data ? 'Presente' : 'Ausente');

    const allOk =
        result.flow_used === 'FLOW_3_CATMAT' &&
        result.codigos_detectados?.catmat === '477283' &&
        result.catmat_data !== null;

    if (allOk) {
        console.log('   ✅ EXECUÇÃO OK\n');
    } else {
        console.log('   ❌ EXECUÇÃO FALHOU\n');
        process.exit(1);
    }
} catch (error) {
    console.log('   ❌ ERRO:', error.message);
    process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('✅ TODOS OS TESTES PASSARAM');
console.log('═══════════════════════════════════════');
