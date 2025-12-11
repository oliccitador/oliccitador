// scripts/test-real-flow.mjs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeWithFlow } from '../lib/gemini.js';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testRealFlow() {
    console.log("=== TESTING REAL FLOW WITH GEMINI API ===");

    // Test Case: A common item (Boot)
    const description = "Bota de segurança confeccionada em couro, com biqueira de aço, solado de poliuretano bidensidade injetado diretamente no cabedal. Cor preta. Tamanho 40.";
    const ca = ""; // Empty to force Flow 2 (PNCP) or Flow 3 if CATMAT found (but no CATMAT provided)
    const catmat = "";

    console.log(`\nInput Description: "${description}"`);
    console.log("Starting analysis...\n");

    try {
        const result = await analyzeWithFlow(description, ca, catmat);

        console.log("--- ANALYSIS RESULT ---");
        console.log("Flow Used:", result._flow);
        console.log("\n[Gemini] Regra Edital Gêmeo:", result.regra_edital_gemeo);
        console.log("\n[Gemini] Detetive de Códigos:", JSON.stringify(result.detetive_de_codigos, null, 2));
        console.log("\n[Gemini] Justificativa Técnica (Snippet):");

        if (result.justificativa_tecnica) {
            console.log(result.justificativa_tecnica.substring(0, 300) + "...");

            if (result.justificativa_tecnica.includes("Justificativa indisponível")) {
                console.log("\n❌ WARNING: Gemini API fallback triggered (Check logs)");
            } else {
                console.log("\n✅ SUCCESS: Real Gemini API response received!");
            }
        } else {
            console.log("UNDEFINED");
        }

    } catch (error) {
        console.error("\n❌ FATAL ERROR:", error);
    }
}

testRealFlow();
