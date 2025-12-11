// ============================================================
// TESTE DE QUERIES BALANCEADAS PARA COTAÇÃO
// ============================================================
// Queries com especificações técnicas suficientes para trazer o produto CORRETO

import { buscarMelhoresPrecos } from '../lib/price-search.js';

// Casos de Teste com QUERIES BALANCEADAS (específicas mas não excessivas)
const testCases = [
    {
        id: 1,
        produto: "LIQUIDIFICADOR",
        query_display: "LIQUIDIFICADOR ESCADA DEGRAUS TEXTURIZADOS ANTIDERRAPANTE CORRIMÃO...",
        query_busca: "LIQUIDIFICADOR 3L 12 VELOCIDADES AUTOLIMPANTE 1200W 110V", // Especificações principais
        esperado: {
            min_resultados: 2,
            deve_conter_palavra: "liquidificador",
            specs_importantes: ["3l", "1200w", "velocidades"]
        }
    },
    {
        id: 2,
        produto: "ESCORREGADOR",
        query_display: "ESCORREGADOR ESCADA DEGRAUS TEXTURIZADOS...",
        query_busca: "ESCORREGADOR INFANTIL POLIETILENO ROTOMOLDADO ARO BASQUETE", // Material + diferencial
        esperado: {
            min_resultados: 2,
            deve_conter_palavra: "escorregador",
            specs_importantes: ["polietileno", "infantil"]
        }
    },
    {
        id: 3,
        produto: "CADEIRA DE RODAS",
        query_display: "CADEIRA RODAS OBESOS DOBRAVEL...",
        query_busca: "CADEIRA RODAS DOBRAVEL OBESOS 250KG ADULTO", // Capacidade + tipo
        esperado: {
            min_resultados: 2,
            deve_conter_palavra: "cadeira",
            specs_importantes: ["dobravel", "adulto"]
        }
    }
];

console.log("╔" + "═".repeat(78) + "╗");
console.log("║" + " TESTE DE QUERIES BALANCEADAS - COTAÇÃO PRECISA".padEnd(78) + "║");
console.log("╚" + "═".repeat(78) + "╝\n");

let totalTestes = testCases.length;
let testesComSucesso = 0;
let tempoTotal = 0;
let resultadosEncontrados = 0;

for (const testCase of testCases) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`🧪 TESTE ${testCase.id}: ${testCase.produto}`);
    console.log(`${"─".repeat(80)}`);
    console.log(`📝 Query Display: "${testCase.query_display}"`);
    console.log(`🔍 Query Busca: "${testCase.query_busca}"`);
    console.log(`🎯 Specs Esperadas: ${testCase.esperado.specs_importantes.join(", ")}`);

    const startTime = Date.now();

    try {
        const resultado = await buscarMelhoresPrecos({
            query: testCase.query_busca,
            has_ca: false,
            ca_numero: null,
            ca_descricao_tecnica: null,
            ca_nome_comercial: null,
            query_semantica: testCase.query_display
        });

        const endTime = Date.now();
        const tempoDecorrido = ((endTime - startTime) / 1000).toFixed(2);
        tempoTotal += parseFloat(tempoDecorrido);

        console.log(`\n⏱️  Tempo: ${tempoDecorrido}s`);
        console.log(`📊 Resultados: ${resultado.melhores_precos?.length || 0}`);

        const numResultados = resultado.melhores_precos?.length || 0;
        resultadosEncontrados += numResultados;

        let sucesso = true;
        let motivos = [];

        // Critério 1: Mínimo de resultados
        if (numResultados < testCase.esperado.min_resultados) {
            sucesso = false;
            motivos.push(`❌ Esperava ${testCase.esperado.min_resultados}+ resultados, encontrou ${numResultados}`);
        } else {
            motivos.push(`✅ Quantidade OK (${numResultados})`);
        }

        // Critério 2: Relevância básica (palavra-chave no título)
        if (numResultados > 0) {
            const primeiroTitulo = resultado.melhores_precos[0].titulo.toLowerCase();
            if (primeiroTitulo.includes(testCase.esperado.deve_conter_palavra)) {
                motivos.push(`✅ Produto correto (contém "${testCase.esperado.deve_conter_palavra}")`);
            } else {
                sucesso = false;
                motivos.push(`❌ Produto errado: "${resultado.melhores_precos[0].titulo}"`);
            }

            // Critério 3: PRECISÃO - Verifica se contém specs importantes
            let specsEncontradas = 0;
            for (const spec of testCase.esperado.specs_importantes) {
                if (primeiroTitulo.includes(spec)) {
                    specsEncontradas++;
                }
            }

            const taxaPrecisao = (specsEncontradas / testCase.esperado.specs_importantes.length * 100).toFixed(0);

            if (specsEncontradas >= testCase.esperado.specs_importantes.length / 2) {
                motivos.push(`✅ Precisão aceitável (${taxaPrecisao}% das specs)`);
            } else {
                motivos.push(`⚠️  Precisão baixa (${taxaPrecisao}% das specs) - pode não ser o produto exato`);
            }
        }

        // Exibir Top 3
        if (numResultados > 0) {
            console.log(`\n💰 Top ${Math.min(3, numResultados)} Preços:`);
            resultado.melhores_precos.slice(0, 3).forEach((item, idx) => {
                console.log(`   ${idx + 1}. ${item.preco_formatado} - ${item.titulo.substring(0, 55)}...`);
                console.log(`      🏪 ${item.loja}`);
            });
        }

        console.log(`\n📋 Validação:`);
        motivos.forEach(m => console.log(`   ${m}`));

        if (sucesso) {
            testesComSucesso++;
            console.log(`\n✅ TESTE ${testCase.id}: PASSOU`);
        } else {
            console.log(`\n❌ TESTE ${testCase.id}: FALHOU`);
        }

    } catch (error) {
        console.log(`\n❌ ERRO: ${error.message}`);
        console.log(`\n❌ TESTE ${testCase.id}: FALHOU (Exceção)`);
    }
}

// Relatório Final
console.log(`\n\n${"═".repeat(80)}`);
console.log(`📊 RELATÓRIO FINAL - QUERIES BALANCEADAS`);
console.log(`${"═".repeat(80)}`);
console.log(`\n📈 Métricas:`);
console.log(`   • Testes Executados: ${totalTestes}`);
console.log(`   • Testes com Sucesso: ${testesComSucesso}`);
console.log(`   • Taxa de Sucesso: ${((testesComSucesso / totalTestes) * 100).toFixed(1)}%`);
console.log(`   • Tempo Total: ${tempoTotal.toFixed(2)}s`);
console.log(`   • Tempo Médio: ${(tempoTotal / totalTestes).toFixed(2)}s`);
console.log(`   • Total de Resultados: ${resultadosEncontrados}`);
console.log(`   • Média por Teste: ${(resultadosEncontrados / totalTestes).toFixed(1)}`);

console.log(`\n🎯 Avaliação:`);
if (testesComSucesso === totalTestes) {
    console.log(`   ✅ EXCELENTE - Queries balanceadas funcionaram!`);
    console.log(`   📝 Próximo: Criar lógica para extrair automaticamente essas queries.`);
} else if (testesComSucesso >= totalTestes * 0.7) {
    console.log(`   ⚠️  PARCIAL - Ajustar queries que falharam.`);
} else {
    console.log(`   ❌ FALHA - Reavaliar estratégia de queries.`);
}

console.log(`\n${"═".repeat(80)}\n`);
