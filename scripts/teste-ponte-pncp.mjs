/**
 * TESTE DA ESTRATÉGIA "PONTE"
 * PNCP (Listagem) -> PNCP (Itens) -> Extrair CATMAT -> Compras.gov (Preço)
 */

import fetch from 'node-fetch';

const PNCP_BASE = 'https://pncp.gov.br/api/consulta/v1';

async function testePonte() {
    console.log("🌉 TESTE DA ESTRATÉGIA PONTE\n");

    // PASSO 1: Buscar uma contratação recente de "COMPUTADOR"
    console.log("1️⃣ Buscando contratação recente...");

    // Busca textual no PNCP (que sabemos que "Contratações" aceita datas, mas vamos ver se aceita objeto)
    // Se não aceitar objeto, pegamos uma geral e filtramos

    // Tentar busca textual de atas primeiro (que falhou antes, mas vamos re-testar com tamanhoPagina=10)
    const urlBusca = `${PNCP_BASE}/atas?termo=COMPUTADOR&pagina=1&tamanhoPagina=10`;

    try {
        let res = await fetch(urlBusca);
        if (!res.ok) {
            console.log(`❌ Falha na busca de atas: ${res.status}`);
            // Fallback: Contratações do dia
            const hoje = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
            const urlCont = `${PNCP_BASE}/contratacoes/publicacao?dataInicial=20241101&dataFinal=20241130&codigoModalidadeContratacao=6&pagina=1&tamanhoPagina=10`;
            res = await fetch(urlCont);
        }

        const data = await res.json();
        const lista = data.data || data.items || [];

        if (lista.length === 0) {
            console.log("❌ Nenhuma contratação encontrada");
            return;
        }

        // Pegar a primeira contratação
        const contrata = lista[0];
        console.log(`✅ Contratação encontrada: ${contrata.numeroControlePNCP || contrata.id}`);

        // PASSO 2: Buscar Itens dessa contratação
        console.log("\n2️⃣ Buscando itens da contratação...");
        // Endpoint provável: /contratacoes/{id}/itens
        // id no PNCP geralmente é o numeroControlePNCP ou id sequencial. Vamos tentar ambos se precisar.

        const id = contrata.numeroControlePNCP || contrata.id;
        const ano = contrata.anoCompra;

        const urlItens = `${PNCP_BASE}/contratacoes/${ano}/${id}/itens`; // Verificando padrão de URL

        // Tentativa com URL ajustada (padrão comum REST)
        // Se falhar, tentamos apenas /contratacoes/{id}/itens
        let resItens = await fetch(`${PNCP_BASE}/contratacoes/${id}/itens`);

        if (!resItens.ok) {
            console.log(`⚠️ Tentativa 1 falhou (${resItens.status}). Tentando formato alternativo...`);
            resItens = await fetch(`${PNCP_BASE}/contratacoes/${contrata.orgaoEntidade.cnpj}/${contrata.anoCompra}/${contrata.sequencialCompra}/itens`);
        }

        if (resItens.ok) {
            const dataItens = await resItens.json();
            console.log(`✅ Itens encontrados: ${dataItens.length}`);

            if (dataItens.length > 0) {
                const item = dataItens[0];
                console.log(JSON.stringify(item, null, 2));

                // VERIFICAÇÃO FINAL: Temos o código?
                if (item.codigoItem || item.itemCodigo) {
                    console.log(`\n🎉 SUCESSO! Código encontrado: ${item.codigoItem || item.itemCodigo}`);
                } else {
                    console.log("\n❌ Item não tem código CATMAT claro");
                }
            }
        } else {
            console.log(`❌ Falha ao buscar itens: ${resItens.status}`);
        }

    } catch (e) {
        console.log(`❌ Erro: ${e.message}`);
    }
}

testePonte();
