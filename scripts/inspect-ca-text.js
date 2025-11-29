
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ca.xlsx');

try {
    console.log(`Reading file as text: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log('\n=== FIRST 500 CHARS ===');
    console.log(content.substring(0, 500));

} catch (error) {
    console.error('Error reading file:', error.message);
}
