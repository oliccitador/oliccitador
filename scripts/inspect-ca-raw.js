const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'ca.xlsx');

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }); // Header 1 = Array de Arrays

console.log('--- AMOSTRA DAS PRIMEIRAS 5 LINHAS ---');
for (let i = 0; i < 5; i++) {
    console.log(`Linha ${i}:`, JSON.stringify(data[i]));
}
