/**
 * TESTE FASE 1 - ABORDAGEM 2: API Compras.gov.br - Módulo Contratações
 * 
 * Fluxo:
 * 1. Buscar código CATMAT por descrição
 * 2. Buscar itens de contratações com esse código
 * 3. Buscar resultados dos itens (fornecedor vencedor)
 * 
 * Vantagens esperadas:
 * - Dados oficiais de contratações
 * - Fornecedor vencedor com CNPJ
 * - Valores homologados
 */

import fetch from 'node-fetch';

console.log("🧪 TESTE ABORDAGEM 2: API Compras.gov.br - Módulo Contratações\n");
console.log("=".repeat(80));

const BASE_URL = 'https://dadosabertos.compras.gov.br';

// Caso de teste (vou usar apenas 1 para não sobrecarregar)
const CASO_TESTE = {
    descricao: "NOTEBOOK",
    materialOuServico: "M", // M = Material, S = Serviço
    codigoClasse: 4380, // Classe de informática (exemplo)
    dataInicial: "2024-01-01",
    dataFinal: "2024-12-31"
};

/**
 * ETAPA 1: Buscar código CATMAT
 */
async function buscarCodigoCatmat(descricao) {
    console.log(`\n📋 ETAPA 1: Buscar código CATMAT para "${descricao}"`);

    try {
        const url = `${BASE_URL}/modulo-material/4_consultarItemMaterial?descricaoItem=${encodeURIComponent(descricao)}&tamanhoPagina=5`;
        console.log(`   URL: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`   ❌ Erro HTTP ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.resultado || data.resultado.length === 0) {
            console.log(`   ⚠️ Nenhum item encontrado`);
            return null;
        }

        const item = data.resultado[0];
        console.log(`   ✅ Código: ${item.codigoItem}`);
        console.log(`   📦 Descrição: ${item.descricaoItem.substring(0, 60)}...`);
        console.log(`   🏷️ Classe: ${item.codigoClasse}`);

        return {
            codigoItem: item.codigoItem,
            codigoClasse: item.codigoClasse,
            codigoGrupo: item.codigoGrupo
        };

    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * ETAPA 2: Buscar itens de contratações
 */
async function buscarItensContratacoes(params) {
    console.log(`\n🔍 ETAPA 2: Buscar itens de contratações`);
    console.log(`   Código Item: ${params.codItemCatalogo}`);
    console.log(`   Classe: ${params.codigoClasse}`);

    try {
        const url = `${BASE_URL}/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133?` +
            `materialOuServico=${params.materialOuServico}` +
            `&codigoClasse=${params.codigoClasse}` +
            `&codItemCatalogo=${params.codItemCatalogo}` +
            `&dataInclusaoPncpInicial=${params.dataInicial}` +
            `&dataInclusaoPncpFinal=${params.dataFinal}` +
            `&tamanhoPagina=10`;

        console.log(`   URL: ${url.substring(0, 100)}...`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`   ❌ Erro HTTP ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.resultado || data.resultado.length === 0) {
            console.log(`   ⚠️ Nenhuma contratação encontrada`);
            return null;
        }

        console.log(`   ✅ Encontradas ${data.resultado.length} contratações`);

        // Listar primeiras 3
        data.resultado.slice(0, 3).forEach((item, i) => {
            console.log(`\n   📊 Contratação ${i + 1}:`);
            console.log(`      ID: ${item.idContratacaoPNCP}`);
            console.log(`      Descrição: ${item.descricaoResumida?.substring(0, 50)}...`);
            console.log(`      Órgão: ${item.orgaoEntidadeCnpj}`);
            console.log(`      Valor Estimado: R$ ${item.valorUnitarioEstimado || 'N/A'}`);
            console.log(`      Tem Resultado: ${item.temResultado ? 'SIM' : 'NÃO'}`);
        });

        return data.resultado;

    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * ETAPA 3: Buscar resultados (fornecedor vencedor)
 */
async function buscarResultados(params) {
    console.log(`\n🏆 ETAPA 3: Buscar resultados (fornecedores vencedores)`);

    try {
        const url = `${BASE_URL}/modulo-contratacoes/3_consultarResultadoItensContratacoes_PNCP_14133?` +
            `dataResultadoPncpInicial=${params.dataInicial}` +
            `&dataResultadoPncpFinal=${params.dataFinal}` +
            `&tamanhoPagina=10`;

        console.log(`   URL: ${url.substring(0, 100)}...`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`   ❌ Erro HTTP ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.resultado || data.resultado.length === 0) {
            console.log(`   ⚠️ Nenhum resultado encontrado`);
            return null;
        }

        console.log(`   ✅ Encontrados ${data.resultado.length} resultados`);

        // Listar primeiros 3
        data.resultado.slice(0, 3).forEach((item, i) => {
            console.log(`\n   🏅 Resultado ${i + 1}:`);
            console.log(`      Fornecedor: ${item.nomeRazaoSocialFornecedor || 'N/A'}`);
            console.log(`      CNPJ: ${item.niFornecedor || 'N/A'}`);
            console.log(`      Valor Homologado: R$ ${item.valorUnitarioHomologado?.toFixed(2) || 'N/A'}`);
            console.log(`      Quantidade: ${item.quantidadeHomologada || 'N/A'}`);
            console.log(`      Porte: ${item.porteFornecedorNome || 'N/A'}`);
        });

        return data.resultado;

    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * Executar teste completo
 */
async function executarTeste() {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🧪 TESTE: ${CASO_TESTE.descricao}`);
    console.log("=".repeat(80));

    // Etapa 1
    const itemCatmat = await buscarCodigoCatmat(CASO_TESTE.descricao);

    if (!itemCatmat) {
        console.log(`\n❌ TESTE FALHOU: Não encontrou código CATMAT`);
        return false;
    }

    await new Promise(r => setTimeout(r, 1000));

    // Etapa 2
    const contratacoes = await buscarItensContratacoes({
        codItemCatalogo: itemCatmat.codigoItem,
        codigoClasse: itemCatmat.codigoClasse,
        materialOuServico: CASO_TESTE.materialOuServico,
        dataInicial: CASO_TESTE.dataInicial,
        dataFinal: CASO_TESTE.dataFinal
    });

    if (!contratacoes || contratacoes.length === 0) {
        console.log(`\n⚠️ TESTE PARCIAL: Código encontrado mas sem contratações`);
        return false;
    }

    await new Promise(r => setTimeout(r, 1000));

    // Etapa 3
    const resultados = await buscarResultados({
        dataInicial: CASO_TESTE.dataInicial,
        dataFinal: CASO_TESTE.dataFinal
    });

    if (!resultados || resultados.length === 0) {
        console.log(`\n⚠️ TESTE PARCIAL: Contratações encontradas mas sem resultados`);
        return false;
    }

    console.log(`\n✅ TESTE PASSOU: Fluxo completo funcionou!`);

    // Resumo
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 RESUMO DO FLUXO");
    console.log("=".repeat(80));
    console.log(`Código CATMAT: ${itemCatmat.codigoItem}`);
    console.log(`Contratações encontradas: ${contratacoes.length}`);
    console.log(`Resultados encontrados: ${resultados.length}`);
    console.log(`\n🎯 DADOS OBTIDOS:`);
    console.log(`   ✅ Fornecedor vencedor com CNPJ`);
    console.log(`   ✅ Valor homologado oficial`);
    console.log(`   ✅ Quantidade homologada`);
    console.log(`   ✅ Porte da empresa`);
    console.log(`\n⚠️ LIMITAÇÕES:`);
    console.log(`   ⚠️ Marca do produto não vem em campo específico`);
    console.log(`   ⚠️ Precisaria cruzar com ID da contratação`);
    console.log(`   ⚠️ Mais complexo (3 etapas)`);

    return true;
}

// Executar
console.log("\n🚀 Iniciando teste da Abordagem 2...\n");

executarTeste().then(sucesso => {
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 RESULTADO FINAL - ABORDAGEM 2");
    console.log("=".repeat(80));

    if (sucesso) {
        console.log("✅ ABORDAGEM 2 FUNCIONAL");
        console.log("\n💡 ANÁLISE:");
        console.log("   ✅ API responsiva e completa");
        console.log("   ✅ Dados oficiais de contratações");
        console.log("   ⚠️ Mais complexa (3 chamadas)");
        console.log("   ⚠️ Sem campo 'marca' específico");
    } else {
        console.log("❌ ABORDAGEM 2 COM LIMITAÇÕES");
    }

    process.exit(sucesso ? 0 : 1);
}).catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
