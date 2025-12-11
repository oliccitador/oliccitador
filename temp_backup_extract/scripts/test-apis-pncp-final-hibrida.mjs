/**
 * TESTE FINAL - ABORDAGEM OTIMIZADA HÍBRIDA
 * 
 * Combina o melhor das 3 APIs documentadas:
 * - API Compras.gov.br (Pesquisa de Preço) para dados de mercado
 * - Busca direta sem dependência de código CATMAT
 * - Validação segura com fallbacks
 * 
 * OBJETIVO: Encontrar a forma mais estável e confiável
 */

import fetch from 'node-fetch';

console.log("🧪 TESTE ABORDAGEM OTIMIZADA - HÍBRIDA\n");
console.log("=".repeat(80));

const BASE_URL = 'https://dadosabertos.compras.gov.br';

// Casos de teste realistas
const CASOS_TESTE = [
    {
        id: 1,
        termo: "COMPUTADOR",
        tipo: "Material",
        esperado: "Equipamentos de informática"
    },
    {
        id: 2,
        termo: "MESA",
        tipo: "Material",
        esperado: "Mobiliário"
    }
];

/**
 * NOVA ESTRATÉGIA: Buscar diretamente por termo no módulo de pesquisa de preço
 * CONTORNA a necessidade de código CATMAT
 */
async function buscarDiretoPorDescricao(termo) {
    console.log(`\n🔍 Busca Direta por: "${termo}"`);

    // Estratégia 1: Tentar buscar código CATMAT primeiro
    try {
        console.log(`\n   📋 Tentativa 1: Buscar código CATMAT...`);

        const urlCatmat = `${BASE_URL}/modulo-material/4_consultarItemMaterial` +
            `?descricaoItem=${encodeURIComponent(termo)}` +
            `&tamanhoPagina=5`;

        const response = await fetch(urlCatmat);

        if (response.ok) {
            const data = await response.json();

            if (data.resultado && data.resultado.length > 0) {
                const item = data.resultado[0];
                console.log(`   ✅ Código CATMAT encontrado: ${item.codigoItem}`);
                console.log(`   📦 ${item.descricaoItem.substring(0, 60)}...`);

                // Agora buscar preços com o código
                return await buscarPrecosPorCodigo(item.codigoItem, termo);
            }
        }

        console.log(`   ⚠️ Código CATMAT não encontrado`);

    } catch (error) {
        console.log(`   ⚠️ Erro na busca CATMAT: ${error.message}`);
    }

    // Estratégia 2: Buscar no módulo de contratações sem código CATMAT
    try {
        console.log(`\n   📋 Tentativa 2: Buscar em contratações recentes...`);

        const dataFinal = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const dataInicial = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');

        const urlContratacoes = `${BASE_URL}/modulo-contratacoes/2_consultarItensContratacoes_PNCP_14133` +
            `?materialOuServico=M` +
            `&codigoGrupo=1` + // Grupo genérico
            `&dataInclusaoPncpInicial=${dataInicial}` +
            `&dataInclusaoPncpFinal=${dataFinal}` +
            `&tamanhoPagina=10`;

        const response = await fetch(urlContratacoes);

        if (response.ok) {
            const data = await response.json();

            if (data.resultado && data.resultado.length > 0) {
                console.log(`   ✅ Encontradas ${data.resultado.length} contratações`);

                // Filtrar por termo
                const relevantes = data.resultado.filter(item =>
                    item.descricaoResumida?.toLowerCase().includes(termo.toLowerCase()) ||
                    item.descricaodetalhada?.toLowerCase().includes(termo.toLowerCase())
                );

                if (relevantes.length > 0) {
                    console.log(`   ✅ ${relevantes.length} relevantes para "${termo}"`);
                    return formatarResultadosContratacoes(relevantes);
                }
            }
        }

        console.log(`   ⚠️ Nenhuma contratação relevante`);

    } catch (error) {
        console.log(`   ⚠️ Erro em contratações: ${error.message}`);
    }

    // Estratégia 3: Buscar em dados abertos gerais
    console.log(`\n   ⚠️ Todas as estratégias falharam para "${termo}"`);
    return null;
}

/**
 * Buscar preços por código CATMAT
 */
async function buscarPrecosPorCodigo(codigoItem, termo) {
    console.log(`\n   💰 Buscando preços para código ${codigoItem}...`);

    try {
        const url = `${BASE_URL}/modulo-pesquisa-preco/1_consultarMaterial` +
            `?codigoItemCatalogo=${codigoItem}` +
            `&tamanhoPagina=10`;

        const response = await fetch(url);

        if (!response.ok) {
            console.log(`   ⚠️ Erro HTTP ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.resultado || data.resultado.length === 0) {
            console.log(`   ⚠️ Nenhum preço encontrado`);
            return null;
        }

        console.log(`   ✅ ${data.resultado.length} registros de preços encontrados`);

        return formatarResultadosPrecos(data.resultado);

    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * Formatar resultados de preços
 */
function formatarResultadosPrecos(resultados) {
    return resultados.slice(0, 5).map(item => ({
        descricao: item.descricaoItem,
        marca: item.marca || 'NÃO INFORMADA',
        preco: item.precoUnitario,
        fornecedor: item.nomeFornecedor,
        orgao: item.nomeUasg,
        municipio: item.municipio,
        estado: item.estado,
        data: item.dataResultado,
        fonte: 'Pesquisa de Preço'
    }));
}

/**
 * Formatar resultados de contratações
 */
function formatarResultadosContratacoes(resultados) {
    return resultados.slice(0, 5).map(item => ({
        descricao: item.descricaoResumida || item.descricaodetalhada,
        marca: 'A IDENTIFICAR', // Não vem em campo específico
        preco: item.valorUnitarioEstimado || item.valorUnitarioResultado,
        fornecedor: item.nomeFornecedor || 'NÃO INFORMADO',
        orgao: item.orgaoEntidadeCnpj,
        municipio: 'N/A',
        estado: 'N/A',
        data: item.dataInclusaoPncp,
        fonte: 'Contratações PNCP'
    }));
}

/**
 * Executar testes
 */
async function executarTestes() {
    let sucessos = 0;
    let falhas = 0;

    for (const caso of CASOS_TESTE) {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`🧪 TESTE ${caso.id}: "${caso.termo}" (${caso.esperado})`);
        console.log("=".repeat(80));

        const resultados = await buscarDiretoPorDescricao(caso.termo);

        if (resultados && resultados.length > 0) {
            console.log(`\n✅ TESTE ${caso.id} PASSOU!`);
            console.log(`\n📊 Resultados Encontrados: ${resultados.length}`);

            resultados.slice(0, 2).forEach((r, i) => {
                console.log(`\n   ${i + 1}. ${r.descricao?.substring(0, 50)}...`);
                console.log(`      Marca: ${r.marca}`);
                console.log(`      Preço: R$ ${r.preco?.toFixed(2) || 'N/A'}`);
                console.log(`      Fornecedor: ${r.fornecedor?.substring(0, 30)}...`);
                console.log(`      Fonte: ${r.fonte}`);
            });

            sucessos++;
        } else {
            console.log(`\n❌ TESTE ${caso.id} FALHOU`);
            falhas++;
        }

        // Aguardar entre testes
        if (caso.id < CASOS_TESTE.length) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Resultado Final
    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 RESULTADO FINAL - ABORDAGEM HÍBRIDA");
    console.log("=".repeat(80));
    console.log(`Total: ${CASOS_TESTE.length}`);
    console.log(`Sucessos: ${sucessos}`);
    console.log(`Falhas: ${falhas}`);
    console.log(`Taxa: ${((sucessos / CASOS_TESTE.length) * 100).toFixed(1)}%`);

    if (sucessos >= 1) {
        console.log(`\n✅ ABORDAGEM APROVADA`);
        console.log(`\n🎯 ESTRATÉGIA VALIDADA:`);
        console.log(`   1. Tentar código CATMAT primeiro (mais completo)`);
        console.log(`   2. Fallback para contratações diretas`);
        console.log(`   3. Múltiplas tentativas aumentam estabilidade`);

        console.log(`\n💡 RECOMENDAÇÃO FINAL:`);
        console.log(`   ✅ Usar abordagem híbrida com fallbacks`);
        console.log(`   ✅ Priorizar API Pesquisa de Preço (tem campo marca)`);
        console.log(`   ✅ Fallback para Contratações PNCP`);
        console.log(`   ✅ Tratamento de erros em cada etapa`);
    } else {
        console.log(`\n❌ ABORDAGEM INSTÁVEL - Requer mais ajustes`);
    }
}

// Executar
console.log("\n🚀 Iniciando teste da Abordagem Híbrida Otimizada...\n");

executarTestes().catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
