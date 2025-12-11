/**
 * TESTE DE REFINAMENTO DE BUSCA CATMAT
 * Objetivo: Encontrar o padrão de busca que retorna resultados
 */

import fetch from 'node-fetch';

async function testarBuscas() {
    console.log("🔍 TESTE DE REFINAMENTO CATMAT\n");

    const termos = [
        "COMPUTADOR",        // Termo único genérico
        "MICROCOMPUTADOR",   // Termo técnico comum
        "NOTEBOOK",          // Termo comercial
        "LAPTOP"             // Sinônimo
    ];

    for (const termo of termos) {
        // Importante: tamanhoPagina=10 para evitar erro 400
        const url = `https://dadosabertos.compras.gov.br/modulo-material/4_consultarItemMaterial?descricaoItem=${encodeURIComponent(termo)}&tamanhoPagina=10`;

        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log(`Termo: "${termo}"`);
                console.log(`✅ Resultados: ${data.resultado?.length || 0}`);
                if (data.resultado && data.resultado.length > 0) {
                    console.log(`   Exemplo: [${data.resultado[0].codigoItem}] ${data.resultado[0].descricaoItem}`);
                    return; // Sucesso! Podemos parar.
                }
            } else {
                console.log(`Termo: "${termo}" ❌ Erro ${res.status}`);
            }
        } catch (e) {
            console.log(`Termo: "${termo}" ❌ Erro: ${e.message}`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }
}

testarBuscas();
