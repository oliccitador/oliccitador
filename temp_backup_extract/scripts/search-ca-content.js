
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ca.xlsx');

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['CAs'];

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

    console.log(`Total rows: ${data.length}`);

    let found = 0;
    for (let i = 0; i < data.length && found < 5; i++) {
        const row = data[i];
        // Check all cells in row
        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            // Look for a number or a string containing a number (CA format)
            if (cell && (typeof cell === 'number' || (typeof cell === 'string' && /\d{3,}/.test(cell)))) {
                console.log(`Found potential data at Row ${i}, Col ${j}: ${cell}`);
                console.log(`Full Row ${i}:`, JSON.stringify(row));
                found++;
                break; // Next row
            }
        }
    }

    if (found === 0) {
        console.log('No numeric data found in the first scan.');
        // Dump row 100 just to see
        if (data.length > 100) {
            console.log('Row 100:', JSON.stringify(data[100]));
        }
    }

} catch (error) {
    console.error('Error reading Excel:', error.message);
}
