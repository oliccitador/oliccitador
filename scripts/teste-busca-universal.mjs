/**
 * TESTE DE DESBLOQUEIO DA BUSCA UNIVERSAL DE MATERIAIS
 * Objetivo: Encontrar o padrão de query que retorna resultados para produtos variados.
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://dadosabertos.compras.gov.br/modulo-material/4_consultarItemMaterial';

async function testarPadroesBusca() {
    console.log("🔓 TESTE DE DESBLOQUEIO: BUSCA UNIVERSAL\n");

    // Produtos difíceis (que não estão no cache)
    const alvos = [
        "CANETA ESFEROGRAFICA",
        "PAPEL A4",
        "PNEU",
        "DISCO RIGIDO",
        "ROTEADOR"
    ];

    // Padrões de tentativa
    const estrategias = [
        { nome: "Exato Simples", fn: (t) => t },
        { nome: "Primeira Palavra", fn: (t) => t.split(' ')[0] },
        { nome: "Com Wildcard (%) Final", fn: (t) => `${t}%` }, // Tentativa SQL Like
        { nome: "Com Wildcard (*) Final", fn: (t) => `${t}*` }  // Tentativa Lucene
    ];

    for (const produto of alvos) {
        console.log(`\n🎯 Alvo: "${produto}"`);
        let sucesso = false;

        for (const est of estrategias) {
            const termo = est.fn(produto);
            const url = `${BASE_URL}?descricaoItem=${encodeURIComponent(termo)}&tamanhoPagina=10`; // Sempre >= 10

            try {
                process.stdout.write(`   Tentando [${est.nome}]: "${termo}"... `);
                const res = await fetch(url);

                if (res.ok) {
                    const data = await res.json();
                    const qtd = data.resultado?.length || 0;

                    if (qtd > 0) {
                        console.log(`✅ SUCESSO! (${qtd} itens)`);
                        console.log(`      Ex: [${data.resultado[0].codigoItem}] ${data.resultado[0].descricaoItem}`);
                        sucesso = true;
                        break; // Achou, pula para o próximo produto
                    } else {
                        console.log(`❌ Zero`);
                    }
                } else {
                    console.log(`❌ Erro HTTP ${res.status}`);
                }
            } catch (e) {
                console.log(`❌ Erro: ${e.message}`);
            }

            await new Promise(r => setTimeout(r, 500)); // Rate limit leve
        }

        if (!sucesso) {
            console.log(`   ⚠️ FALHA TOTAL para este produto`);
        }
    }
}

testarPadroesBusca();
