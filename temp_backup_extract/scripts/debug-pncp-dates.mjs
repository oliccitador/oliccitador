
import fetch from 'node-fetch';

const ENDPOINTS = [
    'https://pncp.gov.br/api/consulta/v1/atas',
    'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao'
];

async function testEndpoint(url) {
    // Add date range (required by some PNCP endpoints)
    const params = new URLSearchParams({
        termo: 'caneta',
        pagina: '1',
        tamanhoPagina: '1',
        dataInicial: '20240101',
        dataFinal: '20241231'
    });

    const testUrl = `${url}?${params.toString()}`;
    console.log(`\nTesting: ${testUrl}`);
    try {
        const response = await fetch(testUrl);
        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('✅ SUCCESS!');
            const data = await response.json();
            console.log('Data keys:', Object.keys(data));
        } else {
            const text = await response.text();
            console.log(`❌ Error Body: ${text.substring(0, 200)}`);
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }
}

for (const url of ENDPOINTS) {
    await testEndpoint(url);
}
