/**
 * Test CATMAT local database and flow orchestrator
 */

import { consultarCATMAT } from '../lib/catmat.js';
import { determineFlow } from '../lib/flow-orchestrator.js';
import fs from 'fs';
import path from 'path';

console.log('=== CATMAT Local Test ===\n');

// Test 1: Check if database file exists
console.log('1. Checking database file...');
const dbPath = path.join(process.cwd(), 'lib', 'catmat-db.json');
console.log(`   Path: ${dbPath}`);
console.log(`   Exists: ${fs.existsSync(dbPath)}`);
if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}
console.log();

// Test 2: Query specific code from user's screenshot
console.log('2. Testing consultarCATMAT("628378")...');
try {
    const result = await consultarCATMAT('628378');
    console.log('   Status:', result.status);
    if (result.status === 'OK') {
        console.log('   ✅ Code found!');
        console.log('   Código:', result.codigo);
        console.log('   Nome:', result.nome);
        console.log('   Classe:', result.classe);
        console.log('   Descrição:', result.descricao?.substring(0, 100) + '...');
    } else {
        console.log('   ❌ Code NOT found');
        console.log('   Response:', result);
    }
} catch (error) {
    console.log('   ❌ Error:', error.message);
}
console.log();

// Test 3: Test flow orchestrator with description containing CATMAT
console.log('3. Testing Flow Orchestrator with auto-detection...');
const testDescription = 'ATADURA CREPOM, TIPO: CERCA DE 13 FIOS / CM², MATE-RIAL: FAIXA DE TECIDO 100% ALGODÃO, LARGURA: CERCA DE 10 CM, COMPRIMENTO EM REPOUSO: ROLO CERCA DE 1,8 M, ESTERILIDADE: NÃO ESTÉRIL C/12 UNIDADES EMBALA-GEM: EMBALAGEM INDIVIDUAL CATMAT 628378';

const flow = determineFlow({
    description: testDescription,
    ca: null,
    catmat: null
});

console.log('   Input description contains: "CATMAT 628378"');
console.log('   Selected flow:', flow);
console.log('   Expected: FLOW_3_CATMAT');
console.log('   Result:', flow === 'FLOW_3_CATMAT' ? '✅ PASS' : '❌ FAIL');
console.log();

console.log('=== Test Complete ===');
