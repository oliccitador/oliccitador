
import fetch from 'node-fetch';

const ENDPOINTS = [
    'https://pncp.gov.br/api/consulta/v1/atas',
    'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao',
    'https://pncp.gov.br/api/search/v1/items',
    'https://pncp.gov.br/api/consulta/v1/contratacoes'
];

async function testEndpoint(url) {
    const testUrl = `${url}?termo=caneta&pagina=1&tamanhoPagina=1`;
    console.log(`\nTesting: ${testUrl}`);
    try {
        const response = await fetch(testUrl);
        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('✅ SUCCESS!');
            const data = await response.json();
            console.log('Data keys:', Object.keys(data));
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }
}

for (const url of ENDPOINTS) {
    await testEndpoint(url);
}
