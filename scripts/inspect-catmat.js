
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'catmat.xlsx');

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON (array of arrays for first few rows)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

    console.log('\n=== HEADERS (Row 0) ===');
    console.log(JSON.stringify(data[0], null, 2));

    console.log('\n=== FIRST ROW DATA (Row 1) ===');
    console.log(JSON.stringify(data[1], null, 2));

} catch (error) {
    console.error('Error reading Excel:', error.message);
}
