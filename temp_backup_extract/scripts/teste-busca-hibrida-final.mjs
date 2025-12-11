/**
 * TESTE HÍBRIDO FINAL: USAR MÓDULO CONTRATAÇÕES COMO BUSCA
 * 
 * Lógica: Se não conseguimos achar o código pelo módulo material,
 * tentamos achar uma contratação que tenha esse item e pegamos o código de lá.
 */

import fetch from 'node-fetch';

async function testeBuscaViaContratacoes() {
    console.log("🔄 TESTE: Busca de Código via Contratações\n");

    // Configurar datas (obrigatório neste endpoint)
    const hoje = new Date();
    const dataFinal = hoje.toISOString().split('T')[0].replace(/-/g, '');
    const dataInicial = new Date(hoje.setDate(hoje.getDate() - 360)).toISOString().split('T')[0].replace(/-/g, '');

    // Parâmetros para buscar "COMPUTADOR"
    // Nota: A API pede 'nomeClasse' ou 'codigoGrupo' as vezes, vamos tentar sem primeiro
    // Ou filtrar depois se a busca for genérica

    // URL tirada da Abordagem 2 validada anteriormente
    // Vamos usar codigoGrupo=1 (Bens) para filtrar um pouco mas deixar aberto
    const url = `https://dadosabertos.compras.gov.br/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133` +
        `?dataInclusaoPncpInicial=${dataInicial}` +
        `&dataInclusaoPncpFinal=${dataFinal}` +
        `&codigoModalidadeContratacao=6` + // Pregão
        `&tamanhoPagina=10`; // IMPORTANTE: >= 10

    console.log(`URL Base: ${url}`);

    try {
        const res = await fetch(url);

        if (res.ok) {
            const data = await res.json();
            console.log(`Total Bruto: ${data.resultado?.length || 0}`);

            if (data.resultado) {
                // Filtrar localmente por "COMPUTADOR" ou "NOTEBOOK" se a API não filtrar por texto
                // A API tem campo 'objetoCompra'?

                const termo = "NOTEBOOK";
                const encontrados = data.resultado.filter(item => {
                    const desc = (item.descricaoItem || item.descricaoResumida || "").toUpperCase();
                    return desc.includes(termo);
                });

                console.log(`Filtrados por "${termo}": ${encontrados.length}`);

                if (encontrados.length > 0) {
                    const item = encontrados[0];
                    console.log("\n✅ ÍTEM ENCONTRADO!");
                    console.log(`Descrição: ${item.descricaoItem || item.descricaoResumida}`);
                    console.log(`Código CATMAT: ${item.codigoItemCatalogo || item.codigoItem}`);

                    if (item.codigoItemCatalogo) {
                        console.log("🎉 CÓDIGO CAPTURADO! Podemos usar na Pesquisa de Preço.");
                    }
                } else {
                    console.log("Exemplo do que veio (para ajustar filtro):");
                    if (data.resultado.length > 0) console.log(data.resultado[0].descricaoItem);
                }
            }
        } else {
            console.log(`❌ Erro HTTP: ${res.status}`);
        }
    } catch (e) {
        console.log(`❌ Erro: ${e.message}`);
    }
}

testeBuscaViaContratacoes();
