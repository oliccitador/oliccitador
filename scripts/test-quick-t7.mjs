// Quick test: T7 search with new query (no brand)
import { intelligentProductSearch } from '../lib/intelligent-search.js';
import { searchGoogleAPI } from '../lib/serpapi.js';
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

const t7Description = `Ventilador de Transporte Pulmonar Adulto e Pediátrico
* Certificação IPX4: resistente à água e intempéries
* 17 modos de ventilação disponíveis
* Peso: 5,5 kg
* Volume corrente (VC): 20 ml`;

console.log('Testing intelligent search...\n');

const result = await intelligentProductSearch(t7Description, 'Ventilador Pulmonar T7 Amoul');

console.log('Generated Query:', result.query);
console.log('Model:', result.specs.model);
console.log('Brand:', result.specs.brand);
console.log('\nSearching Google API...\n');

const prices = await searchGoogleAPI(result.query);

console.log(`Found ${prices.length} results:\n`);
prices.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.titulo}`);
    console.log(`   Price: R$ ${item.preco.toFixed(2)}`);
    console.log(`   Store: ${item.loja}\n`);
});
