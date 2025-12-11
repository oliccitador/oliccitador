// Simple SerpApi Test
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) {
        process.env.SERPAPI_KEY = match[1].trim();
    }
}

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const query = "ventilador pulmonar preço Brasil";

console.log('Testing SerpApi with query:', query);
console.log('API Key:', SERPAPI_KEY ? `${SERPAPI_KEY.substring(0, 10)}...` : 'NOT FOUND');

const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    google_domain: "google.com.br",
    gl: "br",
    hl: "pt-br",
    api_key: SERPAPI_KEY
});

const url = `https://serpapi.com/search.json?${params.toString()}`;

try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('\nResponse status:', response.status);
    console.log('Shopping results count:', data.shopping_results?.length || 0);

    if (data.shopping_results && data.shopping_results.length > 0) {
        console.log('\nFirst 3 results:');
        data.shopping_results.slice(0, 3).forEach((item, idx) => {
            console.log(`\n${idx + 1}. ${item.title}`);
            console.log(`   Price: ${item.price || item.extracted_price || 'N/A'}`);
            console.log(`   Source: ${item.source || 'N/A'}`);
        });
    } else {
        console.log('\nNo shopping results found');
        console.log('Response keys:', Object.keys(data));
    }
} catch (error) {
    console.error('Error:', error.message);
}
