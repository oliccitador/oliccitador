import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testGeminiConnection() {
    console.log("=== TESTING GEMINI API CONNECTION ===\n");

    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("API Key loaded:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT FOUND");

    if (!apiKey) {
        console.error("❌ GOOGLE_API_KEY not found in .env.local");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        console.log("\nSending test prompt to Gemini...");
        const result = await model.generateContent("Test: respond with 'OK'");
        const response = await result.response;
        const text = response.text();

        console.log("\n✅ API Response:", text);
        console.log("\n✅ Connection successful!");

    } catch (error) {
        console.error("\n❌ API Error:");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Details:", error);
    }
}

testGeminiConnection();
