import { determineFlow } from '../lib/flow-orchestrator.js';

const description = "Calçado de segurança, tipo botina sem biqueira e com solado de poliuretano (CA: 17015)\n\nProteção contra cortes, escoriações e agentes químicos.";

console.log('--- TESTE DE DETECÇÃO DE CA ---');
console.log('Descrição:', description);

// Teste 1: Sem CA explícito (deve detectar via regex)
const result1 = determineFlow({ description, ca: null, catmat: null });
console.log('\nResultado (CA nulo):', result1);

if (result1.flow === 'FLOW_1_CA' && result1.ca === '17015') {
    console.log('✅ SUCESSO: CA detectado via regex!');
} else {
    console.log('❌ FALHA: CA não detectado via regex.');
}

// Teste 2: Com CA explícito (deve priorizar)
const result2 = determineFlow({ description, ca: '99999', catmat: null });
console.log('\nResultado (CA explícito 99999):', result2);
