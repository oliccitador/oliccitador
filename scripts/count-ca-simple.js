const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'ca.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`TOTAL_REGISTROS: ${data.length}`);
    if (data.length > 0) {
        console.log(`HEADERS: ${Object.keys(data[0]).join(', ')}`);
        console.log(`PRIMEIRO_CA: ${data[0]['Numero_CA'] || data[0]['CA'] || 'N/A'}`);
    }

} catch (error) {
    console.error('ERRO:', error.message);
}
