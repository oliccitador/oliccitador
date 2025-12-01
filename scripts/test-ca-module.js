// Test script for CA module
import { buscarModuloCA, detectarCA } from '../lib/ca-module.js';

const testCases = [
    "LUVA DE SEGURANÇA EM VAQUETA CA 46391",
    "BOTINA DE SEGURANÇA PVC CA: 12345",
    "ÓCULOS DE PROTEÇÃO (CA: 98765)",
    "CAPACETE SEM CA", // Should not trigger
];

console.log('🧪 Testing CA Module Detection\n');

for (const description of testCases) {
    console.log(`\nTest: "${description}"`);
    const ca = detectarCA(description);
    console.log(`Result: ${ca ? `CA ${ca} detected` : 'No CA detected'}`);
}

console.log('\n\n🌐 Testing Full CA Search (CA 46391)\n');

// Test full search for a real CA
const result = await buscarModuloCA("LUVA DE SEGURANÇA EM VAQUETA CA 46391");
console.log('\nFull result:', JSON.stringify(result, null, 2));
