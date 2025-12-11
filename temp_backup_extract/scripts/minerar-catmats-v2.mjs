/**
 * MINERADOR DE CATMAT REAIS (CORRIGIDO)
 */

import fetch from 'node-fetch';

async function minerarCatmats() {
    console.log("⛏️ MINERADOR DE CATMATs (TENTATIVA 2)\n");

    const alvos = ["NOTEBOOK", "COMPUTADOR", "PNEU", "CAFE", "CADEIRA"];
    const hoje = new Date();
    const dataFinal = hoje.toISOString().split('T')[0].replace(/-/g, '');
    const dataInicial = new Date(hoje.setDate(hoje.getDate() - 60)).toISOString().split('T')[0].replace(/-/g, '');

    // Parâmetros validados no Step 8650
    const urlBase = `https://dadosabertos.compras.gov.br/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133?materialOuServico=M&codigoGrupo=1&dataInclusaoPncpInicial=${dataInicial}&dataInclusaoPncpFinal=${dataFinal}&tamanhoPagina=100`;

    console.log("Baixando lote de contratações recentes...");

    try {
        const res = await fetch(urlBase);
        if (!res.ok) {
            console.log(`❌ Erro API Geral: ${res.status}`);
            return;
        }

        const data = await res.json();
        const todosItens = data.resultado || [];
        console.log(`Total baixado: ${todosItens.length} itens`);

        for (const alvo of alvos) {
            // Filtrar na memória
            const match = todosItens.find(i =>
                (i.descricaoItem || i.descricaoResumida || "").toUpperCase().includes(alvo)
            );

            if (match) {
                console.log(`✅ ${alvo}: ${match.codigoItemCatalogo} (${match.descricaoItem?.substring(0, 40)}...)`);
            } else {
                console.log(`⚠️ ${alvo}: Não encontrado neste lote.`);
            }
        }

    } catch (e) {
        console.log(`❌ Erro: ${e.message}`);
    }
}

minerarCatmats();
