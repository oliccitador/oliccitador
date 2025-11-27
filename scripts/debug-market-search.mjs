import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchValidatedMarketData } from '../lib/market-search.js';

// Manually load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key] = value;
        }
    });
}

async function testMarketSearch() {
    const query = process.argv[2] || 'Cadeira Ergonômica';
    console.log(`🔍 Testing Market Search for: "${query}"`);

    // Check keys
    console.log('🔑 Google Search API Key present:', !!process.env.GOOGLE_SEARCH_API_KEY);
    console.log('🔑 Google API Key (Gemini) present:', !!process.env.GOOGLE_API_KEY);
    console.log('🔑 Google Search Engine ID present:', !!process.env.GOOGLE_SEARCH_ENGINE_ID);
    console.log('🔑 ScraperAPI Key present:', !!process.env.SCRAPER_API_KEY);
    console.log('🔑 Gemini API Key present:', !!process.env.GEMINI_API_KEY);

    try {
        console.log('⏳ Fetching data... (this may take a few seconds)');
        const results = await fetchValidatedMarketData(query);

        console.log('\n✅ Search Complete!');
        console.log(`📊 Found ${results.length} candidates:\n`);

        results.forEach((item, index) => {
            console.log(`[${index + 1}] ${item.product_title}`);
            console.log(`    💰 Price: R$ ${item.price}`);
            console.log(`    🏪 Store: ${item.source_marketplace} (${item.seller_name})`);
            console.log(`    🔗 Link: ${item.link}`);
            console.log('---');
        });

    } catch (error) {
        console.error('\n❌ Error during search:', error);
    }
}

testMarketSearch();
