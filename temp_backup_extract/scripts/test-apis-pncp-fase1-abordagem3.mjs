/**
 * TESTE FASE 1 - ABORDAGEM 3: API PNCP
 * 
 * Fluxo:
 * 1. Buscar contratações por data e modalidade
 * 2. Filtrar por item específico
 * 
 * Vantagens esperadas:
 * - Dados oficiais do PNCP
 * - Informações completas de pregões
 */

import fetch from 'node-fetch';

console.log("🧪 TESTE ABORDAGEM 3: API PNCP\n");
console.log("=".repeat(80));

const BASE_URL_PNCP = 'https://pncp.gov.br/api/consulta';

// Parâmetros de teste
const TESTE = {
    dataInicial: "20241101", // Nov 2024
    dataFinal: "20241130",
    codigoModalidade: 6, // Pregão Eletrônico
    pagina: 1
};

/**
 * Buscar contratações por data
 */
async function buscarContratacoes(params) {
    console.log(`\n🔍 Buscar contratações no PNCP`);
    console.log(`   Período: ${params.dataInicial} a ${params.dataFinal}`);
    console.log(`   Modalidade: ${params.codigoModalidade} (Pregão Eletrônico)`);

    try {
        const url = `${BASE_URL_PNCP}/v1/contratacoes/publicacao?` +
            `dataInicial=${params.dataInicial}` +
            `&dataFinal=${params.dataFinal}` +
            `&codigoModalidadeContratacao=${params.codigoModalidade}` +
            `&pagina=${params.pagina}`;

        console.log(`   URL: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Erro HTTP ${response.status}: ${errorText.substring(0, 200)}`);
            return null;
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.log(`   ⚠️ Nenhuma contratação encontrada`);
            return null;
        }

        console.log(`   ✅ Encontradas ${data.totalRegistros} contratações (mostrando página ${params.pagina})`);
        console.log(`   📄to Páginas: ${data.totalPaginas}`);

        // Listar primeiras 3
        data.data.slice(0, 3).forEach((item, i) => {
            console.log(`\n   📋 Contratação ${i + 1}:`);
            console.log(`      ID PNCP: ${item.numeroControlePNCP}`);
            console.log(`      Número: ${item.numeroCompra}/${item.anoCompra}`);
            console.log(`      Objeto: ${item.objetoCompra?.substring(0, 60)}...`);
            console.log(`      Órgão: ${item.orgaoEntidade?.razaoSocial?.substring(0, 40)}...`);
            console.log(`      Modalidade: ${item.modalidadeNome}`);
            console.log(`      Valor Estimado: R$ ${item.valorTotalEstimado?.toFixed(2) || 'N/A'}`);
            console.log(`      Data Publicação: ${item.dataPublicacaoPncp}`);
        });

        return data;

    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * Executar teste
 */
async function executarTeste() {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🧪 TESTE: Buscar contratações no PNCP`);
    console.log("=".repeat(80));

    const contratacoes = await buscarContratacoes(TESTE);

    if (!contratacoes || contratacoes.data.length === 0) {
        console.log(`\n❌ TESTE FALHOU: Nenhuma contratação encontrada`);
        return false;
    }

    console.log(`\n✅ TESTE PASSOU: API PNCP respondeu com sucesso!`);

    // Resumo
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 ANÁLISE DA RESPOSTA");
    console.log("=".repeat(80));
    console.log(`Total de Registros: ${contratacoes.totalRegistros}`);
    console.log(`Páginas Disponíveis: ${contratacoes.totalPaginas}`);

    console.log(`\n🎯 DADOS DISPONÍVEIS:`);
    console.log(`   ✅ Número de controle PNCP (ID único)`);
    console.log(`   ✅ Número do pregão`);
    console.log(`   ✅ Objeto da contratação`);
    console.log(`   ✅ Órgão comprador`);
    console.log(`   ✅ Valor estimado`);
    console.log(`   ✅ Datas (publicação, abertura, encerramento)`);

    console.log(`\n⚠️ LIMITAÇÕES:`);
    console.log(`   ⚠️ NÃO retorna itens específicos neste endpoint`);
    console.log(`   ⚠️ NÃO retorna marca/modelo do produto`);
    console.log(`   ⚠️ NÃO retorna fornecedor vencedor`);
    console.log(`   ⚠️ Precisaria de endpoints adicionais (não documentados aqui)`);

    console.log(`\n💡 USO RECOMENDADO:`);
    console.log(`   - Validação de existência de pregão`);
    console.log(`   - Obter link oficial do PNCP`);
    console.log(`   - Dados complementares (não primários)`);

    return true;
}

// Executar
console.log("\n🚀 Iniciando teste da Abordagem 3 (API PNCP)...\n");

executarTeste().then(sucesso => {
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 RESULTADO FINAL - ABORDAGEM 3");
    console.log("=".repeat(80));

    if (sucesso) {
        console.log("✅ ABORDAGEM 3 FUNCIONAL MAS LIMITADA");
        console.log("\n💡 CONCLUSÃO:");
        console.log("   ✅ API PNCP funciona");
        console.log("   ⚠️ Dados insuficientes para nossa necessidade");
        console.log("   ⚠️ Serve apenas como complemento");
        console.log("   ❌ NÃO recomendada como fonte primária");
    } else {
        console.log("❌ ABORDAGEM 3 FALHOU");
    }

    process.exit(sucesso ? 0 : 1);
}).catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
