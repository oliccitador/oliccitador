import { consultarCATMAT } from '../lib/catmat.js';

async function test() {
    console.log('🧪 Testing Local CATMAT Search...');

    // Test case 1: Known code
    const code1 = '4782';
    console.log(`\n🔍 Searching for code: ${code1}`);
    const result1 = await consultarCATMAT(code1);
    console.log('Result:', JSON.stringify(result1, null, 2));

    // Test case 2: Unknown code
    const code2 = '999999999';
    console.log(`\n🔍 Searching for code: ${code2}`);
    const result2 = await consultarCATMAT(code2);
    console.log('Result:', JSON.stringify(result2, null, 2));
}

test();
