
require('dotenv').config();
const { analyzeWithFlow } = require('../lib/gemini.js');

// Mock GoogleGenerativeAI to avoid actual API calls and just test the logic flow
// or we can use the real API if we have the key. 
// Given the user context, we might have the key in .env.
// But to be safe and fast, let's try to run it with the real key if available, 
// or mock it if we just want to test the prompt structure (but we can't easily test prompt structure without calling API).
// Actually, the best way to verify the *logic* (that it uses the new rules) is to see the output.
// But we can't see the output without the API generating it.
// So we will assume the API key is present in .env (it should be).

async function testSemanticQuery() {
    console.log('--- Starting Semantic Query Verification ---');

    const description = "Notebook: tela: superior a 14, interatividade da tela: sensível ao toque, memória RAM: superior a 8GB, núcleos por processador: 4 a 8 velocidade superior a 2.2 ghz, armazenamento hdd: sem disco hdd, armazenamento ssd: superior a 500, bateria: superior ou igual a 3 células, alimentação: bivolt automática, sistema operacional: proprietário, webcam integrada, teclado padrão Brasil, garantia on site: 12 meses";

    console.log(`\nInput Description: "${description.substring(0, 100)}..."`);

    try {
        // We need to handle the import of flow-orchestrator inside analyzeWithFlow
        // Since we are running in node, dynamic imports might be tricky if not configured.
        // But let's try.

        const result = await analyzeWithFlow(description, null, null);

        console.log('\n--- Analysis Result ---');
        console.log('Query Semântica Limpa:', result.query_semantica_limpa);
        console.log('Produto Referência:', JSON.stringify(result.produto_referencia, null, 2));

        if (result.query_semantica_limpa && result.query_semantica_limpa.includes('Notebook')) {
            console.log('\n✅ SUCCESS: Semantic query generated.');

            // Simple heuristic check for "rich" query
            if (result.query_semantica_limpa.includes('15.6') || result.query_semantica_limpa.includes('Core i5') || result.query_semantica_limpa.includes('SSD')) {
                console.log('✅ SUCCESS: Query contains specific technical details (Rich Query).');
            } else {
                console.log('⚠️ WARNING: Query might still be generic. Check output.');
            }

        } else {
            console.log('\n❌ FAILURE: No semantic query generated.');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }
}

testSemanticQuery();
