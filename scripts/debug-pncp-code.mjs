
import fetch from 'node-fetch';

const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1/atas';

async function searchPncpByCode(codigo) {
    console.log(`\n=== Testing PNCP Search for Code: ${codigo} ===`);
    const url = `${PNCP_BASE_URL}?termo=${codigo}&pagina=1&tamanhoPagina=5`;
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            const results = data.data || data || [];
            console.log(`Found ${results.length} results.`);
            if (results.length > 0) {
                console.log('First result sample:');
                console.log(JSON.stringify(results[0], null, 2));
            }
        } else {
            console.log('❌ Request failed.');
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

await searchPncpByCode('298933');
