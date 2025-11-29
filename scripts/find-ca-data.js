
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ca.xlsx');

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);

    console.log('Sheets found:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const range = sheet['!ref'];
        console.log(`\n--- Sheet: ${sheetName} ---`);
        console.log(`Range: ${range}`);

        // Convert first 20 rows to JSON to find where data starts
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

        console.log('First 10 non-empty rows:');
        let count = 0;
        for (let i = 0; i < data.length && count < 10; i++) {
            const row = data[i];
            // Check if row has any non-null/non-empty value
            if (row && row.some(cell => cell !== null && cell !== '')) {
                console.log(`Row ${i}:`, JSON.stringify(row));
                count++;
            }
        }
    });

} catch (error) {
    console.error('Error reading Excel:', error.message);
}
