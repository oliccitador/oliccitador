
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1';

const KEYWORDS = [
    'capacete', 'oculos', 'óculos', 'luva', 'bota', 'respirador',
    'notebook', 'monitor', 'teclado', 'mouse', 'impressora',
    'cadeira', 'mesa', 'estante'
];

async function fetchRecentProcurements(dateStart) {
    const dateEnd = dateStart;
    const url = `${PNCP_BASE_URL}/contratacoes/publicacao?dataInicial=${dateStart}&dataFinal=${dateEnd}&codigoModalidadeContratacao=6&pagina=1&tamanhoPagina=50`;
    console.log(`Fetching procurements from: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status} - ${errText}`);
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching procurements:', error.message);
        return [];
    }
}

async function fetchItems(cnpj, year, seq) {
    const url = `${PNCP_BASE_URL}/orgaos/${cnpj}/compras/${year}/${seq}/itens`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // console.log(`  Failed to fetch items for ${url}: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        return [];
    }
}

(async () => {
    console.log('🚀 Starting PNCP Data Collection (DEBUG MODE)...');

    const recentProcurements = await fetchRecentProcurements('20251125');
    console.log(`Found ${recentProcurements.length} recent procurements.`);

    if (recentProcurements.length > 0) {
        console.log('DEBUG: First procurement object keys:', Object.keys(recentProcurements[0]));
        console.log('DEBUG: First procurement object sample:', JSON.stringify(recentProcurements[0], null, 2));
    }

    const collectedItems = [];
    let processedCount = 0;

    for (const proc of recentProcurements) {
        processedCount++;
        process.stdout.write(`Processing ${processedCount}/${recentProcurements.length}...\r`);

        const cnpj = proc.orgaoEntidade?.cnpj;
        const year = proc.anoCompra;
        const seq = proc.sequencialCompra;

        if (!cnpj || !year || !seq) {
            // console.log('Skipping due to missing ID fields', {cnpj, year, seq});
            continue;
        }

        const items = await fetchItems(cnpj, year, seq);
        if (items.length > 0 && processedCount <= 3) {
            console.log(`\nDEBUG: Found ${items.length} items for ${seq}. Sample item:`);
            console.log(JSON.stringify(items[0], null, 2));
        }

        for (const item of items) {
            const desc = item.descricao;
            if (!desc) continue;

            const descLower = desc.toLowerCase();
            if (KEYWORDS.some(kw => descLower.includes(kw))) {
                collectedItems.push({
                    raw_description: desc,
                    keyword_match: KEYWORDS.find(kw => descLower.includes(kw)),
                    source_procurement: { cnpj, year, seq }
                });
            }
        }

        await new Promise(r => setTimeout(r, 100));
        if (collectedItems.length >= 50) break;
    }

    console.log(`\n\nTotal Collected Items: ${collectedItems.length}`);
    const outputPath = path.join(__dirname, '..', 'pncp_real_examples.json');
    fs.writeFileSync(outputPath, JSON.stringify(collectedItems, null, 2));
})();
