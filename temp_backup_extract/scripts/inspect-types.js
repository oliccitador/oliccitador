const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../debug_ml.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = html.match(/<script[^>]*id="__PRELOADED_STATE__"[^>]*>([\s\S]*?)<\/script>/);

if (scriptMatch && scriptMatch[1]) {
    const json = JSON.parse(scriptMatch[1]);
    const resultsArray = json?.pageState?.initialState?.results || [];

    console.log(`Total items: ${resultsArray.length}\n`);

    // Show types of first 10 items
    console.log('First 10 items types and IDs:');
    resultsArray.slice(0, 10).forEach((item, i) => {
        console.log(`${i}: type="${item.type}" id="${item.id}" polycard=${!!item.polycard}`);
    });

    // Count by type
    const typeCounts = {};
    resultsArray.forEach(item => {
        const type = item.type || 'UNKNOWN';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    console.log('\nType distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
}
