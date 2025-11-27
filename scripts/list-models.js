const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(/GOOGLE_API_KEY=(.*)/);
    if (match) {
        process.env.GOOGLE_API_KEY = match[1].trim();
    }
} catch (e) {
    console.log("Could not read .env.local");
}

async function listModels() {
    try {
        const key = process.env.GOOGLE_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        let output = "Available Models:\n";
        if (data.models) {
            data.models.forEach(m => {
                output += `- ${m.name}\n`;
                if (m.supportedGenerationMethods) {
                    output += `  Methods: ${m.supportedGenerationMethods.join(', ')}\n`;
                }
            });
        } else {
            output += "No models found or error: " + JSON.stringify(data);
        }

        console.log(output);
        fs.writeFileSync('models-list.txt', output);
        console.log("\nSaved to models-list.txt");
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
