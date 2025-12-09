import { scrapeCA } from '../lib/ca-scraper.js';

const CAs = ['40377', '20565', '5745'];

async function test() {
    console.log("INICIANDO TESTE DO SCRAPER DE CA...");

    for (const ca of CAs) {
        console.log(`\n--- Testando CA ${ca} ---`);
        const data = await scrapeCA(ca);
        console.log(JSON.stringify(data, null, 2));
    }
}

test();
