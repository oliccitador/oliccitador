
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ca.xlsx');

try {
    console.log(`Reading file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['CAs'];

    const csv = XLSX.utils.sheet_to_csv(sheet);

    console.log(`CSV Length: ${csv.length}`);
    console.log('\n=== FIRST 500 CHARS OF CSV ===');
    console.log(csv.substring(0, 500));

    // Check for any number
    const match = csv.match(/\d{3,}/);
    if (match) {
        console.log(`\nFound number: ${match[0]}`);
    } else {
        console.log('\nNo numbers found in CSV output.');
    }

} catch (error) {
    console.error('Error reading Excel:', error.message);
}
