import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGeminiDirect() {
    // Read API key from .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error("API key not found");
        return;
    }

    console.log("Testing with key:", apiKey.substring(0, 10) + "...");

    // Test with direct fetch to v1 endpoint (newer)
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    for (const modelName of models) {
        console.log(`\n--- Testing ${modelName} ---`);

        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Hello, respond with 'OK'" }]
                    }]
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`✅ ${modelName} WORKS!`);
                console.log("Response:", JSON.stringify(data, null, 2).substring(0, 200));
                break; // Found working model
            } else {
                console.log(`❌ ${modelName} failed:`, data.error?.message || JSON.stringify(data));
            }
        } catch (error) {
            console.log(`❌ ${modelName} error:`, error.message);
        }
    }
}

testGeminiDirect();
