// Direct test of searchGoogleAPI with T7 query
import { searchGoogleAPI } from '../lib/serpapi.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) {
        process.env.SERPAPI_KEY = match[1].trim();
    }
}

console.log('Testing searchGoogleAPI with T7 query...\n');

const results = await searchGoogleAPI('ventilador pulmonar T7 Amoul preço Brasil');

console.log(`\nFound ${results.length} results:\n`);

results.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.titulo}`);
    console.log(`   Preço: R$ ${item.preco?.toFixed(2) || 'N/A'}`);
    console.log(`   Loja: ${item.loja}`);
    console.log(`   Link: ${item.link}\n`);
});

// Save for inspection
fs.writeFileSync('google-organic-test.json', JSON.stringify(results, null, 2));
console.log('Full results saved to: google-organic-test.json');
