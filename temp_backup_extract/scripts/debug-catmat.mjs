
import fetch from 'node-fetch';

const CATMAT_BASE_URL = 'https://www.comprasnet.gov.br/catmat/api';

async function testCatmat(codigo) {
    console.log(`\n=== Testing CATMAT: ${codigo} ===`);
    const url = `${CATMAT_BASE_URL}/material/${codigo}`;
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Data found:');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('❌ Request failed.');
            const text = await response.text();
            console.log('Body:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Test the problematic code
await testCatmat('298933');

// Test a likely valid code (e.g. 150635 - Caneta Esferográfica, common item)
// await testCatmat('150635');
