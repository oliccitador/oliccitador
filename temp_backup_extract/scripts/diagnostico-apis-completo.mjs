/**
 * DIAGNÓSTICO COMPLETO DAS APIs
 * 
 * Objetivo: Identificar qual endpoint está realmente funcional
 * e qual estrutura de dados REAL ele retorna
 */

import fetch from 'node-fetch';

console.log("🔍 DIAGNÓSTICO COMPLETO DAS APIs DE COMPRAS PÚBLICAS\n");
console.log("=".repeat(80));

const BASE_URL_COMPRAS = 'https://dadosabertos.compras.gov.br';
const BASE_URL_PNCP = 'https://pncp.gov.br/api/consulta/v1';

/**
 * Teste 1: API Compras.gov.br - Módulo Material (Busca de CATMAT)
 */
async function testeModuloMaterial() {
    console.log("\n📦 TESTE 1: Módulo Material (CATMAT)");
    console.log("-".repeat(80));

    const endpoints = [
        {
            nome: "Consultar Item Material (com descrição específica)",
            url: `${BASE_URL_COMPRAS}/modulo-material/4_consultarItemMaterial?descricaoItem=COMPUTADOR%20PORTATIL&tamanhoPagina=3`
        },
        {
            nome: "Consultar Item Material (grupo genérico)",
            url: `${BASE_URL_COMPRAS}/modulo-material/4_consultarItemMaterial?codigoGrupo=1&tamanhoPagina=3`
        }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔄 Testando: ${endpoint.nome}`);
        console.log(`   URL: ${endpoint.url}`);

        try {
            const response = await fetch(endpoint.url);
            console.log(`   Status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Resposta OK`);
                console.log(`   Estrutura:`, JSON.stringify(Object.keys(data), null, 2));

                if (data.resultado && data.resultado.length > 0) {
                    console.log(`   📊 Registros: ${data.resultado.length}`);
                    console.log(`   Exemplo (primeiro item):`);
                    console.log(JSON.stringify(data.resultado[0], null, 2));
                } else {
                    console.log(`   ⚠️ Nenhum resultado`);
                }
            } else {
                console.log(`   ❌ Erro HTTP`);
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
}

/**
 * Teste 2: API Compras.gov.br - Módulo Pesquisa de Preço
 */
async function testeModuloPesquisaPreco() {
    console.log("\n💰 TESTE 2: Módulo Pesquisa de Preço");
    console.log("-".repeat(80));

    // Usar código CATMAT conhecido (se foi encontrado no teste anterior)
    const codigosCatmat = ['401838', '444269']; // Exemplos de códigos válidos

    for (const codigo of codigosCatmat) {
        console.log(`\n🔄 Testando com código CATMAT: ${codigo}`);
        const url = `${BASE_URL_COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?codigoItemCatalogo=${codigo}&tamanhoPagina=3`;
        console.log(`   URL: ${url}`);

        try {
            const response = await fetch(url);
            console.log(`   Status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Resposta OK`);
                console.log(`   Estrutura:`, JSON.stringify(Object.keys(data), null, 2));

                if (data.resultado && data.resultado.length > 0) {
                    console.log(`   📊 Registros: ${data.resultado.length}`);
                    console.log(`   Exemplo (primeiro item):`);
                    const item = data.resultado[0];
                    console.log(`      Descrição: ${item.descricaoItem?.substring(0, 50)}...`);
                    console.log(`      Marca: ${item.marca || 'N/A'}`);
                    console.log(`      Preço: R$ ${item.precoUnitario || 'N/A'}`);
                    console.log(`      Fornecedor: ${item.nomeFornecedor || 'N/A'}`);
                    console.log(`\n   Campos disponíveis:`, Object.keys(item));
                } else {
                    console.log(`   ⚠️ Nenhum resultado`);
                }
            } else {
                console.log(`   ❌ Erro HTTP`);
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
}

/**
 * Teste 3: API Compras.gov.br - Módulo Contratações
 */
async function testeModuloContratacoes() {
    console.log("\n📝 TESTE 3: Módulo Contratações");
    console.log("-".repeat(80));

    const dataFinal = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const dataInicial = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');

    const url = `${BASE_URL_COMPRAS}/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133` +
        `?materialOuServico=M` +
        `&dataInclusaoPncpInicial=${dataInicial}` +
        `&dataInclusaoPncpFinal=${dataFinal}` +
        `&tamanhoPagina=3`;

    console.log(`\n🔄 Testando: Consultar Itens de Contratações`);
    console.log(`   URL: ${url.substring(0, 100)}...`);

    try {
        const response = await fetch(url);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Resposta OK`);
            console.log(`   Estrutura:`, JSON.stringify(Object.keys(data), null, 2));

            if (data.resultado && data.resultado.length > 0) {
                console.log(`   📊 Registros: ${data.resultado.length}`);
                console.log(`   Exemplo (primeiro item):`);
                const item = data.resultado[0];
                console.log(JSON.stringify(item, null, 2));
            } else {
                console.log(`   ⚠️ Nenhum resultado`);
            }
        } else {
            console.log(`   ❌ Erro HTTP`);
        }
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
    }
}

/**
 * Teste 4: API PNCP - Contratações
 */
async function testeApiPncp() {
    console.log("\n🏛️ TESTE 4: API PNCP");
    console.log("-".repeat(80));

    const endpoints = [
        {
            nome: "Busca de Contratações (últimos 30 dias)",
            url: `${BASE_URL_PNCP}/contratacoes/publicacao?dataInicial=20241101&dataFinal=20241130&codigoModalidadeContratacao=6&pagina=1&tamanhoPagina=3`
        },
        {
            nome: "Busca de Atas de Registro de Preço",
            url: `${BASE_URL_PNCP}/atas?termo=COMPUTADOR&pagina=1&tamanhoPagina=3`
        }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🔄 Testando: ${endpoint.nome}`);
        console.log(`   URL: ${endpoint.url}`);

        try {
            const response = await fetch(endpoint.url);
            console.log(`   Status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Resposta OK`);

                if (data.data && data.data.length > 0) {
                    console.log(`   📊 Registros: ${data.data.length}`);
                    console.log(`   Exemplo (primeiro item):`);
                    console.log(JSON.stringify(data.data[0], null, 2));
                } else if (data.items && data.items.length > 0) {
                    console.log(`   📊 Registros: ${data.items.length}`);
                    console.log(`   Exemplo (primeiro item):`);
                    console.log(JSON.stringify(data.items[0], null, 2));
                } else {
                    console.log(`   ⚠️ Nenhum resultado`);
                    console.log(`   Estrutura recebida:`, JSON.stringify(Object.keys(data), null, 2));
                }
            } else {
                const text = await response.text();
                console.log(`   ❌ Erro HTTP`);
                console.log(`   Resposta:`, text.substring(0, 200));
            }
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
}

/**
 * Executar todos os testes
 */
async function executarDiagnostico() {
    console.log("\n🚀 Iniciando diagnóstico completo...\n");

    await testeModuloMaterial();
    await testeModuloPesquisaPreco();
    await testeModuloContratacoes();
    await testeApiPncp();

    console.log("\n" + "=".repeat(80));
    console.log("📊 DIAGNÓSTICO COMPLETO");
    console.log("=".repeat(80));
    console.log("\n✅ Análise das APIs concluída!");
    console.log("\n💡 Próximos passos:");
    console.log("   1. Identificar quais endpoints retornaram dados");
    console.log("   2. Analisar a estrutura real dos dados retornados");
    console.log("   3. Definir a estratégia final baseada nos resultados");
}

executarDiagnostico().catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
