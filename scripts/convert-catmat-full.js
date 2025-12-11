// Converte CATMAT.xlsx para formato otimizado com todas colunas
const XLSX = require('xlsx');
const fs = require('fs');

console.log('[CATMAT-CONVERT] Lendo CATMAT.xlsx...');
const workbook = XLSX.readFile('catmat.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet);

console.log(`[CATMAT-CONVERT] Total de linhas: ${rawData.length}`);

// Primeira linha é header
const header = rawData[0];
console.log('[CATMAT-CONVERT] Header detectado:', header);

const catmatDB = {};
let processedCount = 0;
let skippedCount = 0;

// Processa do índice 1 em diante (pula header)
for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];

    const codigo = String(row['__EMPTY_5'] || '').trim();

    if (!codigo || codigo === '-' || codigo === '') {
        skippedCount++;
        continue;
    }

    catmatDB[codigo] = {
        codigo_grupo: String(row['Extração realizada em 21/11/2025'] || '').trim(),
        nome_grupo: String(row['__EMPTY'] || '').trim(),
        codigo_classe: String(row['__EMPTY_1'] || '').trim(),
        nome_classe: String(row['__EMPTY_2'] || '').trim(),
        codigo_pdm: String(row['__EMPTY_3'] || '').trim(),
        nome_pdm: String(row['__EMPTY_4'] || '').trim(),
        codigo_item: codigo,
        descricao_item: String(row['__EMPTY_6'] || '').trim(),
        codigo_ncm: String(row['__EMPTY_7'] || '').trim()
    };

    processedCount++;

    if (processedCount % 10000 === 0) {
        console.log(`[CATMAT-CONVERT] Processados: ${processedCount}...`);
    }
}

console.log(`[CATMAT-CONVERT] Processamento completo!`);
console.log(`  - Processados: ${processedCount}`);
console.log(`  - Ignorados: ${skippedCount}`);

console.log('[CATMAT-CONVERT] Salvando catmat-db-full.json...');
fs.writeFileSync('lib/catmat-db-full.json', JSON.stringify(catmatDB, null, 2));

console.log('[CATMAT-CONVERT] ✅ Conversão completa!');
console.log('Exemplo de item:');
const firstCode = Object.keys(catmatDB)[0];
console.log(JSON.stringify({ [firstCode]: catmatDB[firstCode] }, null, 2));
