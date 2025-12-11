
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ca.xlsx');

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get range
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log(`Sheet Range: ${sheet['!ref']} (Rows ${range.s.r} to ${range.e.r})`);

    // Dump first 5 rows to find the header
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

    console.log('\n=== FIRST 5 ROWS ===');
    for (let i = 0; i < 5; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }

} catch (error) {
    console.error('Error reading Excel:', error.message);
}
