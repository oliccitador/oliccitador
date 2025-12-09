/**
 * TESTE FASE 1 - ABORDAGEM 1: API Compras.gov.br - Pesquisa de Preço
 * 
 * Fluxo:
 * 1. Buscar código CATMAT por descrição
 * 2. Buscar preços praticados com esse código
 * 
 * Vantagens esperadas:
 * - Retorna campo "marca" específico
 * - Simples (2 etapas)
 * - Dados completos
 */

import fetch from 'node-fetch';

console.log("🧪 TESTE ABORDAGEM 1: API Compras.gov.br - Pesquisa de Preço\n");
console.log("=".repeat(80));

const BASE_URL_COMPRAS = 'https://dadosabertos.compras.gov.br';

// Casos de teste
const CASOS_TESTE = [
    {
        id: 1,
        descricao: "NOTEBOOK",
        categoria: "Eletrônicos"
    },
    {
        id: 2,
        descricao: "CADEIRA ESCRITORIO",
        categoria: "Mobiliário"
    },
    {
        id: 3,
        descricao: "CAPACETE SEGURANCA",
        categoria: "EPI"
    }
];

/**
 * ETAPA 1: Buscar código CATMAT por descrição
 */
async function buscarCodigoCatmat(descricao) {
    console.log(`\n📋 ETAPA 1: Buscar código CATMAT para "${descricao}"`);

    try {
        const url = `${BASE_URL_COMPRAS}/modulo-material/4_consultarItemMaterial?descricaoItem=${encodeURIComponent(descricao)}`;
        console.log(`   URL: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`   ❌ Erro HTTP ${response.status}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (!data.resultado || data.resultado.length === 0) {
            console.log(`   ⚠️ Nenhum item encontrado`);
            return null;
        }

        const primeiroItem = data.resultado[0];
        console.log(`   ✅ Encontrado: ${primeiroItem.descricaoItem.substring(0, 60)}...`);
        console.log(`   📦 Código CATMAT: ${primeiroItem.codigoItem}`);
        console.log(`   🏷️ Classe: ${primeiroItem.nomeClasse}`);

        return {
            codigoItem: primeiroItem.codigoItem,
            descricao: primeiroItem.descricaoItem,
            classe: primeiroItem.nomeClasse
        };

    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * ETAPA 2: Buscar preços praticados com código CATMAT
 */
async function buscarPrecosPraticados(codigoItem) {
    console.log(`\n💰 ETAPA 2: Buscar preços praticados (código ${codigoItem})`);

    try {
        const url = `${BASE_URL_COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?codigoItemCatalogo=${codigoItem}`;
        console.log(`   URL: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`   ❌ Erro HTTP ${response.status}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (!data.resultado || data.resultado.length === 0) {
            console.log(`   ⚠️ Nenhum preço encontrado`);
            return null;
        }

        console.log(`   ✅ Encontrados ${data.resultado.length} registros de compras`);

        // Pegar primeiros 3 exemplos
        const exemplos = data.resultado.slice(0, 3);

        exemplos.forEach((item, index) => {
            console.log(`\n   📊 Exemplo ${index + 1}:`);
            console.log(`      Descrição: ${item.descricaoItem?.substring(0, 50)}...`);
            console.log(`      Marca: ${item.marca || 'NÃO INFORMADA'} ← CAMPO ESPECÍFICO!`);
            console.log(`      Preço: R$ ${item.precoUnitario?.toFixed(2) || 'N/A'}`);
            console.log(`      Fornecedor: ${item.nomeFornecedor || 'N/A'}`);
            console.log(`      Órgão: ${item.nomeUasg || 'N/A'} (${item.estado || 'N/A'})`);
            console.log(`      Data: ${item.dataResultado || 'N/A'}`);
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
async function executarTesteCompleto() {
    let sucessos = 0;
    let falhas = 0;

    for (const caso of CASOS_TESTE) {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`🧪 TESTE ${caso.id}: ${caso.categoria} - "${caso.descricao}"`);
        console.log("=".repeat(80));

        // Etapa 1
        const itemCatmat = await buscarCodigoCatmat(caso.descricao);

        if (!itemCatmat) {
            console.log(`\n❌ TESTE ${caso.id} FALHOU: Não encontrou código CATMAT`);
            falhas++;
            continue;
        }

        // Aguardar 500ms entre requisições
        await new Promise(r => setTimeout(r, 500));

        // Etapa 2
        const precos = await buscarPrecosPraticados(itemCatmat.codigoItem);

        if (!precos || precos.length === 0) {
            console.log(`\n⚠️ TESTE ${caso.id} PARCIAL: Encontrou código mas sem preços`);
            falhas++;
            continue;
        }

        // Validar se tem campo "marca"
        const temMarca = precos.some(p => p.marca && p.marca.trim() !== '');

        if (temMarca) {
            console.log(`\n✅ TESTE ${caso.id} PASSOU: Retornou preços COM MARCA!`);
            sucessos++;
        } else {
            console.log(`\n⚠️ TESTE ${caso.id} PARCIAL: Retornou preços MAS SEM MARCA`);
            falhas++;
        }

        // Aguardar 1s entre testes
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log("📊 RESULTADO FINAL - ABORDAGEM 1");
    console.log("=".repeat(80));
    console.log(`Total de Testes: ${CASOS_TESTE.length}`);
    console.log(`Sucessos: ${sucessos}`);
    console.log(`Falhas: ${falhas}`);
    console.log(`Taxa de Sucesso: ${((sucessos / CASOS_TESTE.length) * 100).toFixed(1)}%`);

    if (sucessos >= 2) {
        console.log(`\n✅ ABORDAGEM 1 APROVADA`);
        console.log(`\n🎯 VANTAGENS OBSERVADAS:`);
        console.log(`   ✅ Campo "marca" presente nos resultados`);
        console.log(`   ✅ Dados completos (preço, fornecedor, órgão)`);
        console.log(`   ✅ API responsiva`);
        console.log(`\n⚠️ LIMITAÇÕES OBSERVADAS:`);
        console.log(`   ⚠️ Modelo do produto não vem em campo separado`);
        console.log(`   ⚠️ Precisa extrair da descrição com regex/IA`);
    } else {
        console.log(`\n❌ ABORDAGEM 1 REPROVADA`);
    }
}

// Executar
executarTesteCompleto().catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
