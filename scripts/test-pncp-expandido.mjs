/**
 * TESTE DE INTEGRAÇÃO FINAL (PNCP CLIENT) - EXPANDIDO
 * Valida o cache expandido em diferentes categorias
 */

import { pncpClient } from '../lib/pncp-client.js';

async function testeFinal() {
    console.log("🚀 TESTE FINAL EXPANDIDO (PNCP CLIENT)\n");

    // Casos de diferentes grupos
    const casos = [
        "NOTEBOOK", // Informática
        "PNEU",     // Veículos
        "CAFE",     // Alimentos
        "PAPEL",    // Escritório
        "XBOX"      // Fallback
    ];

    for (const caso of casos) {
        console.log("-".repeat(50));
        console.log(`🔎 Buscando: "${caso}"...`);

        try {
            const resultados = await pncpClient.buscarPrecos(caso);

            console.log(`✅ Encontrados: ${resultados.length}`);

            if (resultados.length > 0) {
                const top = resultados[0];
                console.log(`   R$ ${top.preco} | ${top.marca} | ${top.fonte}`);
                console.log(`   Desc: ${top.descricao.substring(0, 50)}...`);
            } else {
                console.log("   ⚠️ Nenhum resultado.");
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }
}

testeFinal();
