/**
 * TESTE: BUSCAR DIRETO NO MÓDULO DE PREÇO POR DESCRIÇÃO
 */
import fetch from 'node-fetch';

async function testeBuscaDireta() {
    console.log("🔍 TESTE: Busca Direta de Preço por Descrição\n");

    // Tentativa: Usar descricaoItem no endpoint de preço em vez do de material
    const url = 'https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?descricaoItem=NOTEBOOK&tamanhoPagina=10';

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);

        if (res.ok) {
            const data = await res.json();
            console.log(`Resultados: ${data.resultado?.length || 0}`);
            if (data.resultado?.length > 0) {
                console.log("✅ FUNCIONOU!");
                console.log(data.resultado[0]);
            } else {
                console.log("❌ Retornou vazio");
            }
        }
    } catch (e) {
        console.log(`Erro: ${e.message}`);
    }
}

testeBuscaDireta();
