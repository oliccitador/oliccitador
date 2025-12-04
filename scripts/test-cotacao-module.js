// ============================================================
// TESTE DE EFICIÊNCIA DO MÓDULO DE COTAÇÃO
// ============================================================
// Testa o módulo de busca de preços com queries reais
// Mede: Taxa de sucesso, Tempo de resposta, Qualidade dos resultados

import { buscarMelhoresPrecos } from '../lib/price-search.js';

// Casos de Teste (usando as Query Semânticas validadas)
const testCases = [
    {
        id: 1,
        produto: "LIQUIDIFICADOR",
        query: "LIQUIDIFICADOR ESCADA DEGRAUS TEXTURIZADOS ANTIDERRAPANTE CORRIMÃO LATERAIS FORMATO LÚDICO GOLFINHO NARIZ ELEFANTE TROMBINA PALHACINHO RAMPA",
        esperado: {
            min_resultados: 3,
            deve_conter_palavra: "liquidificador"
        }
    },
    {
        id: 2,
        produto: "ESCORREGADOR",
        query: "ESCORREGADOR ESCADA DEGRAUS TEXTURIZADOS ANTIDERRAPANTE CORRIMÃO LATERAIS FORMATO LÚDICO GOLFINHO NARIZ ELEFANTE TROMBINA PALHACINHO RAMPA",
        esperado: {
            min_resultados: 2,
            deve_conter_palavra: "escorregador"
        }
    },
    {
        id: 3,
        produto: "CADEIRA DE RODAS",
        query: "CADEIRA RODAS OBESOS DOBRAVEL ADULTO MANUAL AÇO CARBONO ALUMINIO PINTURA EPOXI LOCOMOCAO APOIO BRACOS FIXOS ENCOSTO ASSENTO NYLON ELEVACAO PERNAS",
        esperado: {
            min_resultados: 3,
            deve_conter_palavra: "cadeira"
        }
    }
];

console.log("╔" + "═".repeat(78) + "╗");
console.log("║" + " TESTE DE EFICIÊNCIA - MÓDULO DE COTAÇÃO".padEnd(78) + "║");
console.log("╚" + "═".repeat(78) + "╝\n");

// Métricas Globais
let totalTestes = testCases.length;
let testesComSucesso = 0;
let tempoTotal = 0;
let resultadosEncontrados = 0;

// Executar Testes
for (const testCase of testCases) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`🧪 TESTE ${testCase.id}: ${testCase.produto}`);
    console.log(`${"─".repeat(80)}`);
    console.log(`📝 Query: "${testCase.query.substring(0, 60)}..."`);

    const startTime = Date.now();

    try {
        const resultado = await buscarMelhoresPrecos({
            query: testCase.query,
            has_ca: false,
            ca_numero: null,
            ca_descricao_tecnica: null,
            ca_nome_comercial: null,
            query_semantica: testCase.query
        });

        const endTime = Date.now();
        const tempoDecorrido = ((endTime - startTime) / 1000).toFixed(2);
        tempoTotal += parseFloat(tempoDecorrido);

        console.log(`\n⏱️  Tempo: ${tempoDecorrido}s`);
        console.log(`📊 Resultados: ${resultado.melhores_precos?.length || 0}`);

        // Validação
        const numResultados = resultado.melhores_precos?.length || 0;
        resultadosEncontrados += numResultados;

        let sucesso = true;
        let motivos = [];

        // Critério 1: Mínimo de resultados
        if (numResultados < testCase.esperado.min_resultados) {
            sucesso = false;
            motivos.push(`❌ Esperava ${testCase.esperado.min_resultados} resultados, encontrou ${numResultados}`);
        } else {
            motivos.push(`✅ Quantidade de resultados OK (${numResultados})`);
        }

        // Critério 2: Relevância (palavra-chave no título)
        if (numResultados > 0) {
            const primeiroTitulo = resultado.melhores_precos[0].titulo.toLowerCase();
            if (primeiroTitulo.includes(testCase.esperado.deve_conter_palavra)) {
                motivos.push(`✅ Relevância OK (contém "${testCase.esperado.deve_conter_palavra}")`);
            } else {
                sucesso = false;
                motivos.push(`❌ Primeiro resultado não contém "${testCase.esperado.deve_conter_palavra}"`);
                motivos.push(`   Título: "${resultado.melhores_precos[0].titulo}"`);
            }
        }

        // Exibir Resultados
        if (numResultados > 0) {
            console.log(`\n💰 Preços Encontrados:`);
            resultado.melhores_precos.forEach((item, idx) => {
                console.log(`   ${idx + 1}. ${item.preco_formatado} - ${item.titulo.substring(0, 50)}...`);
                console.log(`      🏪 ${item.loja}`);
            });
        }

        // Status Final do Teste
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
console.log(`📊 RELATÓRIO FINAL - EFICIÊNCIA DO MÓDULO DE COTAÇÃO`);
console.log(`${"═".repeat(80)}`);
console.log(`\n📈 Métricas:`);
console.log(`   • Testes Executados: ${totalTestes}`);
console.log(`   • Testes com Sucesso: ${testesComSucesso}`);
console.log(`   • Taxa de Sucesso: ${((testesComSucesso / totalTestes) * 100).toFixed(1)}%`);
console.log(`   • Tempo Total: ${tempoTotal.toFixed(2)}s`);
console.log(`   • Tempo Médio por Teste: ${(tempoTotal / totalTestes).toFixed(2)}s`);
console.log(`   • Total de Resultados Encontrados: ${resultadosEncontrados}`);
console.log(`   • Média de Resultados por Teste: ${(resultadosEncontrados / totalTestes).toFixed(1)}`);

console.log(`\n🎯 Avaliação:`);
if (testesComSucesso === totalTestes) {
    console.log(`   ✅ EXCELENTE - Todos os testes passaram!`);
} else if (testesComSucesso >= totalTestes * 0.7) {
    console.log(`   ⚠️  BOM - Maioria dos testes passou, mas há espaço para melhoria.`);
} else {
    console.log(`   ❌ CRÍTICO - Módulo precisa de ajustes significativos.`);
}

console.log(`\n${"═".repeat(80)}\n`);
