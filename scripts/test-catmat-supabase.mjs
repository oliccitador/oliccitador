/**
 * Test CATMAT Supabase integration
 */

import { consultarCATMAT } from '../lib/catmat.js';

console.log('=== CATMAT Supabase Test ===\n');

// Test: Query code 628378 from Supabase
console.log('Testing consultarCATMAT("628378") via Supabase...');

try {
    const result = await consultarCATMAT('628378');
    console.log('\n✅ Result:', {
        status: result.status,
        codigo: result.codigo,
        nome: result.nome,
        classe: result.classe,
        descricao: result.descricao?.substring(0, 100) + '...'
    });
} catch (error) {
    console.error('\n❌ Error:', error.message);
}

console.log('\n=== Test Complete ===');
