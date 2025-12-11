/**
 * TESTE ISOLADO SERPAPI
 * Valida se a chave atual funciona
 */

import fetch from 'node-fetch';

const CHAVE_TESTE = "[KEY_REMOVED]";

async function testeSerpApi() {
    console.log(`🔎 Testando SerpApi com chave: ${CHAVE_TESTE.substring(0, 10)}...`);

    try {
        const params = new URLSearchParams({
            engine: "google_shopping",
            q: "Caneta Azul",
            api_key: CHAVE_TESTE,
            num: 1 // Só preciso de 1 pra saber se funciona
        });

        const url = `https://serpapi.com/search.json?${params.toString()}`;
        console.log(`📡 GET ${url}`);

        const res = await fetch(url);

        if (res.ok) {
            const data = await res.json();
            if (data.shopping_results) {
                console.log(`✅ SUCESSO! Encontrados ${data.shopping_results.length} resultados.`);
                console.log(`   Primeiro item: ${data.shopping_results[0].title}`);
            } else if (data.error) {
                console.log(`❌ ERRO NA RESPOSTA (200 OK mas com erro): ${data.error}`);
            } else {
                console.log(`⚠️ Resposta OK mas sem shopping_results. JSON:`, JSON.stringify(data).substring(0, 200));
            }
        } else {
            console.log(`❌ FALHA HTTP: ${res.status} ${res.statusText}`);
            const txt = await res.text();
            console.log(`   Body: ${txt}`);
        }

    } catch (e) {
        console.log(`❌ ERRO EXCEÇÃO: ${e.message}`);
    }
}

testeSerpApi();
