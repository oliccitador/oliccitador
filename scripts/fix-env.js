const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const content = fs.readFileSync(envPath, 'utf8');

const lines = content.split('\n');
const newLines = [];
const keysSeen = new Set();

let googleApiKey = '';
let googleSearchApiKey = 'AIzaSyAIOLq-T3YfkEbEC9dVy6qs0PB6EUQV9nc'; // The one user provided

lines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        if (key === 'GOOGLE_API_KEY') {
            if (!googleApiKey) {
                // Keep the first one as GOOGLE_API_KEY (Gemini)
                googleApiKey = value;
                newLines.push(line);
            } else {
                // Ignore subsequent GOOGLE_API_KEYs (duplicates)
            }
        } else if (key === 'GOOGLE_SEARCH_ENGINE_ID') {
            newLines.push(line);
        } else if (key === '# Google Custom Search API') {
            // Skip comment
        } else {
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
});

// Add GOOGLE_SEARCH_API_KEY
newLines.push(`GOOGLE_SEARCH_API_KEY=${googleSearchApiKey}`);

fs.writeFileSync(envPath, newLines.join('\n'));
console.log('Fixed .env.local');
