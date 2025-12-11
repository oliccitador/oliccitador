
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'catmat.xlsx');
const outputFile = path.join(__dirname, '..', 'lib', 'catmat-db.json');

try {
    console.log(`Reading Excel file: ${inputFile}`);
    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON array of arrays
    // range: 1 means start from Row 1 (0-indexed), skipping Row 0 (Metadata)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 1 });

    console.log(`Total rows found: ${rawData.length}`);

    const db = {};
    let count = 0;

    // Headers are in the first row of rawData (which is Row 1 of file)
    // [ "Código do Grupo", "Nome do Grupo", "Código da Classe", "Nome da Classe", "Código do PDM", "Nome do PDM", "Código do Item", "Descrição do Item", ... ]

    // Indices based on inspection:
    // 6: Código do Item
    // 7: Descrição do Item
    // 3: Nome da Classe
    // 1: Nome do Grupo

    // Iterate from index 1 (skipping header row)
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const code = row[6];

        if (code) {
            // Ensure code is string
            const codeStr = String(code).trim();

            // Minified structure to save space (63MB -> ~20MB?)
            // d: description
            // c: class
            // n: name (if different from desc)
            db[codeStr] = {
                d: row[7] || "Sem descrição",
                c: row[3] || "Classe desconhecida"
            };
            if (row[5] && row[5] !== row[7]) {
                db[codeStr].n = row[5];
            }
            count++;
        }
    }

    console.log(`Processed ${count} items.`);

    fs.writeFileSync(outputFile, JSON.stringify(db, null, 2));
    console.log(`Database saved to: ${outputFile}`);

    // Verify specific item
    if (db['298933']) {
        console.log('\n✅ Verification: Item 298933 found!');
        console.log(db['298933']);
    } else {
        console.log('\n❌ Verification: Item 298933 NOT found in processed data.');
    }

} catch (error) {
    console.error('Error processing CATMAT:', error);
}
