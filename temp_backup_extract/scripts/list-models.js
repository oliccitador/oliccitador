const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load env manually
const envPath = path.join(__dirname, '..', '.env.local');
let apiKey = process.env.GOOGLE_API_KEY;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error("GOOGLE_API_KEY not found in .env.local or environment");
    process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Attempting to use gemini-1.5-flash...");
        // There isn't a direct listModels method on the SDK instance easily accessible in all versions,
        // but we can try to generate content to see if the model works, or catch the error which might list models.

        // Actually, for the Node SDK, we might not have a listModels method exposed on the main class in all versions.
        // Let's try a simple generation to confirm if the key works with a standard model.

        const result = await model.generateContent("Hello");
        console.log("Success! gemini-1.5-flash is working.");
        console.log(result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);

        // Try gemini-pro as fallback
        try {
            console.log("\nAttempting to use gemini-pro...");
            const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resultPro = await modelPro.generateContent("Hello");
            console.log("Success! gemini-pro is working.");
            console.log(resultPro.response.text());
        } catch (errorPro) {
            console.error("Error with gemini-pro:", errorPro.message);
        }
    }
}

listModels();
