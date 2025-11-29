
import { consultarCATMAT } from '../lib/catmat.js';

async function test() {
    console.log('Testing Local CATMAT Lookup...');

    // Test known valid code
    const result = await consultarCATMAT('298933');

    console.log('\nResult for 298933:');
    console.log(JSON.stringify(result, null, 2));

    if (result.status === 'OK' && result.descricao) {
        console.log('\n✅ SUCCESS: Local lookup worked!');
    } else {
        console.log('\n❌ FAILED: Local lookup did not return expected data.');
    }

    // Test invalid code
    const invalid = await consultarCATMAT('000000');
    console.log('\nResult for 000000:');
    console.log(invalid.status);
}

test();
