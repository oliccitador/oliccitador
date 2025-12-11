
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("MARKER: START DEBUG");

try {
    console.log("Importing gemini.js...");
    const { analyzeWithFlow } = await import('../lib/gemini.js');
    console.log("Imported gemini.js successfully.");

    console.log("Testing analyzeWithFlow with dummy data...");
    const result = await analyzeWithFlow("ITEM DE TESTE - Teste de importação.");
    console.log("Analysis Result:", JSON.stringify(result, null, 2));

} catch (e) {
    console.error("DEBUG ERROR:", e);
}
console.log("MARKER: END DEBUG");
