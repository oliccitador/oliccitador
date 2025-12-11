const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../debug_ml.html');
const html = fs.readFileSync(htmlPath, 'utf8');

let output = '';
output += `HTML length: ${html.length}\n`;

// Check for script tag with id="__PRELOADED_STATE__"
const scriptMatch = html.match(/<script[^>]*id="__PRELOADED_STATE__"[^>]*>([\s\S]*?)<\/script>/);

if (scriptMatch && scriptMatch[1]) {
    output += '✅ Script tag matched!\n';
    output += `Content length: ${scriptMatch[1].length}\n`;

    try {
        const json = JSON.parse(scriptMatch[1]);
        output += '✅ JSON parsed successfully!\n\n';
        output += `Top-level Keys: ${JSON.stringify(Object.keys(json))}\n\n`;

        // Inspect pageState
        if (json.pageState) {
            output += `pageState Keys: ${JSON.stringify(Object.keys(json.pageState))}\n\n`;

            if (json.pageState.initialState) {
                output += `pageState.initialState Keys: ${JSON.stringify(Object.keys(json.pageState.initialState))}\n\n`;

                if (json.pageState.initialState.results) {
                    const results = json.pageState.initialState.results;
                    output += '✅ Found results array!\n';
                    output += `Type: ${Array.isArray(results) ? 'Array' : 'Object'}\n`;
                    output += `Length/Keys: ${Array.isArray(results) ? results.length : Object.keys(results).length}\n\n`;

                    if (Array.isArray(results) && results.length > 0) {
                        output += `First item keys: ${JSON.stringify(Object.keys(results[0]))}\n\n`;
                        output += 'Sample item:\n' + JSON.stringify(results[0], null, 2).substring(0, 1000) + '\n';
                    }
                }
            }
        }

        // Write to file
        fs.writeFileSync('test-output.txt', output);
        console.log(output);
        console.log('\n✅ Full output saved to test-output.txt');

    } catch (e) {
        output += `❌ JSON parse error: ${e.message}\n`;
        fs.writeFileSync('test-output.txt', output);
        console.log(output);
    }
} else {
    output += '❌ Script tag NOT matched.\n';
    fs.writeFileSync('test-output.txt', output);
    console.log(output);
}
