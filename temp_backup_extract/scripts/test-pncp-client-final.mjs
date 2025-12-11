/**
 * TESTE DE INTEGRAÇÃO FINAL
 * Usa a nova lib/pncp-client.js
 */

import { pncpClient } from '../lib/pncp-client.js';

async function testeFinal() {
    console.log("🚀 TESTE DE INTEGRAÇÃO FINAL (PNCP CLIENT)\n");

    // Casos de Teste
    const casos = ["NOTEBOOK", "CADEIRA", "XBOX", "SERVIDOR"];

    for (const caso of casos) {
        console.log("-".repeat(50));
        console.log(`🔎 Buscando: "${caso}"...`);

        try {
            const resultados = await pncpClient.buscarPrecos(caso);

            console.log(`✅ Encontrados: ${resultados.length}`);

            if (resultados.length > 0) {
                // Mostrar Top 2
                resultados.slice(0, 2).forEach((r, i) => {
                    console.log(`   ${i + 1}. [${r.fonte}] R$ ${r.preco} - ${r.marca} (${r.descricao.substring(0, 40)}...)`);
                });
            } else {
                console.log("   ⚠️ Nenhum resultado encontrado.");
            }
        } catch (error) {
            console.log(`   ❌ Erro fatal: ${error.message}`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }
}

testeFinal();
