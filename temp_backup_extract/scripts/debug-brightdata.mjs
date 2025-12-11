// DEBUG: Test Bright Data SERP API directly
// This script tests the API call in isolation to identify issues

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
// TESTING NEW KEY DIRECTLY
let BRIGHTDATA_API_TOKEN = "[KEY_REMOVED]";

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          DEBUG: BRIGHT DATA SERP API TEST                                    ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

console.log('1. Checking API Token...');
if (!BRIGHTDATA_API_TOKEN) {
    console.error('❌ BRIGHTDATA_API_TOKEN is NOT configured!');
    console.log('   Please add it to .env.local');
    process.exit(1);
}
console.log(`✅ Token found: ${BRIGHTDATA_API_TOKEN.substring(0, 8)}...`);

const query = 'ventilador pulmonar preço Brasil';
const SERP_API_URL = 'https://api.brightdata.com/serp/req';

console.log(`\n2. Testing API call for query: "${query}"`);

async function testBrightDataAPI() {
    try {
        const requestBody = {
            zone: "serp",
            url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR`,
            format: "json"
        };

        console.log('\n3. Request details:');
        console.log('   URL:', SERP_API_URL);
        console.log('   Body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(SERP_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRIGHTDATA_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('\n4. Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const data = await response.json();

        console.log('\n5. Response structure:');
        console.log('   Keys:', Object.keys(data));

        // Log full response for debugging
        console.log('\n6. Full response (first 3000 chars):');
        console.log(JSON.stringify(data, null, 2).substring(0, 3000));

    } catch (error) {
        console.error('\n❌ Exception:', error.message);
        console.error('   Stack:', error.stack);
    }
}

testBrightDataAPI();
