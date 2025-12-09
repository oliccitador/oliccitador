/**
 * MINERADOR DE CATMAT REAIS (2025)
 * Objetivo: Descobrir os códigos corretos e atuais para atualizar o cache
 */

import fetch from 'node-fetch';

async function minerarCatmats() {
    console.log("⛏️ MINERADOR DE CATMATs\n");

    // Lista de desejos
    const alvos = [
        "NOTEBOOK",
        "COMPUTADOR",
        "PNEU",
        "CAFE",
        "CADEIRA",
        "PAPEL A4",
        "CANETA"
    ];

    // Datas recentes para garantir códigos ativos
    const hoje = new Date();
    const dataFinal = hoje.toISOString().split('T')[0].replace(/-/g, '');
    const dataInicial = new Date(hoje.setDate(hoje.getDate() - 120)).toISOString().split('T')[0].replace(/-/g, ''); // 4 meses

    for (const alvo of alvos) {
        // Tentar buscar nas contratações RECENTES
        // endpoint validado anteriormente
        // codigoGrupo=1 (Bens) ajuda a filtrar serviços
        const url = `https://dadosabertos.compras.gov.br/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133?dataInclusaoPncpInicial=${dataInicial}&dataInclusaoPncpFinal=${dataFinal}&codigoModalidadeContratacao=6&tamanhoPagina=50`;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.log(`${alvo}: ❌ Erro API ${res.status}`);
                continue;
            }

            const data = await res.json();
            const itens = data.resultado || [];

            // Filtrar localmente pela descrição
            const match = itens.find(i =>
                (i.descricaoItem || "").toUpperCase().includes(alvo) ||
                (i.descricaoResumida || "").toUpperCase().includes(alvo)
            );

            if (match) {
                console.log(`✅ ${alvo}: ${match.codigoItemCatalogo} (${match.descricaoItem?.substring(0, 30)}...)`);
            } else {
                console.log(`${alvo}: ⚠️ Não encontrado nas últimas 50 contratações (Scan limitado)`);
            }

        } catch (e) {
            console.log(`${alvo}: ❌ Erro ${e.message}`);
        }

        await new Promise(r => setTimeout(r, 1500));
    }
}

minerarCatmats();
