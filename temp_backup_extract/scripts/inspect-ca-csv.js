
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ca.xlsx');

try {
    console.log(`Reading file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    console.log(`Total lines: ${lines.length}`);

    console.log('\n=== FIRST 5 LINES ===');
    for (let i = 0; i < 5; i++) {
        console.log(`Line ${i}: ${lines[i].substring(0, 100)}...`);
    }

} catch (error) {
    console.error('Error reading file:', error.message);
}
