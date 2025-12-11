
import fetch from 'node-fetch';

const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1/atas';

async function searchPncpByText(text) {
    console.log(`\n=== Testing PNCP Search for Text: "${text}" ===`);
    const url = `${PNCP_BASE_URL}?termo=${encodeURIComponent(text)}&pagina=1&tamanhoPagina=10`;
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            const results = data.data || data || [];
            console.log(`Found ${results.length} results.`);

            // Look for CATMAT 298933 in results
            const found = results.find(item => {
                const itemCode = item.codigoItem || item.codigo || item.itemUrl?.split('/').pop();
                return itemCode == '298933' || JSON.stringify(item).includes('298933');
            });

            if (found) {
                console.log('✅ FOUND CATMAT 298933 in results!');
                console.log(JSON.stringify(found, null, 2));
            } else {
                console.log('❌ CATMAT 298933 NOT found in top 10 results.');
                if (results.length > 0) {
                    console.log('Sample result structure:');
                    console.log(JSON.stringify(results[0], null, 2));
                }
            }
        } else {
            console.log('❌ Request failed.');
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

await searchPncpByText('Extensão Elétrica');
