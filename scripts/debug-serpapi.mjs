// DEBUG: Test SerpApi directly
// This script tests the API call in isolation to identify issues

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TESTING KEY DIRECTLY
const SERPAPI_KEY = process.env.SERPAPI_KEY || "YOUR_SERPAPI_KEY_HERE";
const BASE_URL = 'https://serpapi.com/search.json';

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          DEBUG: SERPAPI TEST                                                 ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`✅ Key configured: ${SERPAPI_KEY.substring(0, 8)}...`);

const query = 'ventilador pulmonar preço Brasil';

console.log(`\n2. Testing API call for query: "${query}"`);

async function testSerpApi() {
    try {
        const params = new URLSearchParams({
            engine: "google_shopping",
            q: query,
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: SERPAPI_KEY
        });

        const url = `${BASE_URL}?${params.toString()}`;
        console.log('\n3. Request URL:', url.replace(SERPAPI_KEY, 'HIDDEN_KEY'));

        const response = await fetch(url);

        console.log('\n4. Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const data = await response.json();

        console.log('\n5. Response structure:');
        console.log('   Keys:', Object.keys(data));

        if (data.shopping_results) {
            console.log('   shopping_results:', data.shopping_results.length, 'items');
            if (data.shopping_results.length > 0) {
                console.log('   First item:', JSON.stringify(data.shopping_results[0], null, 2));
            }
        } else {
            console.log('   No shopping_results found.');
            console.log('   Full response (first 500 chars):', JSON.stringify(data, null, 2).substring(0, 500));
        }

    } catch (error) {
        console.error('\n❌ Exception:', error.message);
        console.error('   Stack:', error.stack);
    }
}

testSerpApi();
