
const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';

const cnpj = '83500603000180';
const year = '2025';
const seq = '266';
const controlNumber = '83500603000180-1-000266/2025';

// Try variations of the ID structure
const endpoints = [
    // Using Control Number (encoded slash)
    `${PNCP_BASE_URL}/contratacoes/${encodeURIComponent(controlNumber)}`,
    `${PNCP_BASE_URL}/contratacoes/${encodeURIComponent(controlNumber)}/itens`,

    // Direct structure guesses
    `${PNCP_BASE_URL}/contratacoes/${cnpj}/${year}/${seq}`,
    `${PNCP_BASE_URL}/contratacoes/${cnpj}/${year}/${seq}/itens`,

    // "Compras" variations again just to be sure
    `${PNCP_BASE_URL}/orgaos/${cnpj}/compras/${year}/${seq}/arquivos`, // Maybe files exist?
    `${PNCP_BASE_URL}/orgaos/${cnpj}/compras/${year}/${seq}/itens/quantidade`
];

(async () => {
    console.log('🔍 Testing PNCP ID Patterns...\n');

    for (const url of endpoints) {
        console.log(`Testing: ${url}`);
        try {
            const response = await fetch(url);
            console.log(`  Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`  ✅ SUCCESS!`);
                // console.log(JSON.stringify(data, null, 2).substring(0, 200));
            }
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
        console.log('---');
    }
})();
