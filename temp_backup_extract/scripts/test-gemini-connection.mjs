import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

async function testGemini() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchKey = process.env.GOOGLE_SEARCH_API_KEY;

    console.log('Gemini Key (GOOGLE_API_KEY):', apiKey ? apiKey.substring(0, 5) + '...' : 'Missing');
    console.log('Search Key (GOOGLE_SEARCH_API_KEY):', searchKey ? searchKey.substring(0, 5) + '...' : 'Missing');
    console.log('Keys are identical:', apiKey === searchKey);

    // Test with Search Key FIRST
    if (searchKey) {
        console.log('\n--- Testing with Search Key ---');
        const genAI2 = new GoogleGenerativeAI(searchKey);
        try {
            console.log('Attempting to use "gemini-1.5-flash" with Search Key...');
            const model = genAI2.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log('Response:', result.response.text());
            console.log('✅ Gemini API is working with Search Key!');
        } catch (error) {
            console.error('❌ Error testing with Search Key:', error.message);
        }
    }

    if (!apiKey) {
        console.error('GOOGLE_API_KEY is missing');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log('\n--- Testing with GOOGLE_API_KEY ---');
        console.log('Attempting to use "gemini-1.5-flash" with GOOGLE_API_KEY...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log('Response:', result.response.text());
        console.log('✅ Gemini API is working with GOOGLE_API_KEY!');
    } catch (error) {
        console.error('❌ Error testing gemini-1.5-flash with GOOGLE_API_KEY:', error.message);
    }
}

testGemini();
