// Teste abrangente - Múltiplas categorias de produtos
import { buscarMelhoresPrecos } from '../lib/price-search.js';

const testCases = [
    // Eletrodomésticos
    { categoria: "ELETRODOMÉSTICO", query: "GELADEIRA FROST FREE 400L DUPLEX INOX" },
    { categoria: "ELETRODOMÉSTICO", query: "AR CONDICIONADO SPLIT 12000 BTUS INVERTER" },
    { categoria: "ELETRODOMÉSTICO", query: "MICRO-ONDAS 30L 1200W INOX" },

    // Eletrônicos
    { categoria: "ELETRÔNICO", query: "NOTEBOOK I5 8GB 256GB SSD 15.6" },
    { categoria: "ELETRÔNICO", query: "IMPRESSORA MULTIFUNCIONAL LASER MONOCROMATICA" },
    { categoria: "ELETRÔNICO", query: "PROJETOR LED 3000 LUMENS FULL HD" },

    // Móveis/Equipamentos
    { categoria: "MOBILIÁRIO", query: "CADEIRA ESCRITORIO ERGONOMICA GIRATORIA" },
    { categoria: "MOBILIÁRIO", query: "MESA REUNIAO 8 LUGARES MADEIRA" },
    { categoria: "MOBILIÁRIO", query: "ARMARIO AÇO 2 PORTAS 1.90M" },

    // Médico-Hospitalar
    { categoria: "MÉDICO-HOSPITALAR", query: "CADEIRA RODAS DOBRAVEL ADULTO" },
    { categoria: "MÉDICO-HOSPITALAR", query: "DESFIBRILADOR AUTOMATICO DEA" },
    { categoria: "MÉDICO-HOSPITALAR", query: "TERMOMETRO DIGITAL INFRAVERMELHO" },

    // Material de Escritório
    { categoria: "ESCRITÓRIO", query: "PAPEL A4 75G RESMA 500 FOLHAS" },
    { categoria: "ESCRITÓRIO", query: "GRAMPEADOR GRANDE 100 FOLHAS" },

    // Construção/Manutenção
    { categoria: "CONSTRUÇÃO", query: "FURADEIRA IMPACTO 800W DEWALT" },
    { categoria: "CONSTRUÇÃO", query: "ESCADA ALUMINIO 6 DEGRAUS" }
];

console.log("╔" + "═".repeat(78) + "╗");
console.log("║" + " TESTE ABRANGENTE - MÚLTIPLAS CATEGORIAS".padEnd(78) + "║");
console.log("╚" + "═".repeat(78) + "╝\n");

let totalTestes = testCases.length;
let sucessos = 0;
let falhas = 0;
let resultadosPorCategoria = {};

for (const [idx, testCase] of testCases.entries()) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`🧪 TESTE ${idx + 1}/${totalTestes}: ${testCase.categoria}`);
    console.log(`🔍 Query: "${testCase.query}"`);

    try {
        const resultado = await buscarMelhoresPrecos({
            query: testCase.query,
            has_ca: false,
            ca_numero: null,
            ca_descricao_tecnica: null,
            ca_nome_comercial: null,
            query_semantica: testCase.query
        });

        const numResultados = resultado.melhores_precos?.length || 0;

        // Inicializa categoria nos stats
        if (!resultadosPorCategoria[testCase.categoria]) {
            resultadosPorCategoria[testCase.categoria] = {
                testes: 0,
                sucessos: 0,
                totalResultados: 0
            };
        }

        resultadosPorCategoria[testCase.categoria].testes++;
        resultadosPorCategoria[testCase.categoria].totalResultados += numResultados;

        if (numResultados >= 2) {
            console.log(`✅ SUCESSO - ${numResultados} resultados encontrados`);
            sucessos++;
            resultadosPorCategoria[testCase.categoria].sucessos++;

            // Mostra top 2
            console.log(`\n💰 Top 2:`);
            resultado.melhores_precos.slice(0, 2).forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.preco_formatado} - ${item.titulo.substring(0, 45)}...`);
                console.log(`      🏪 ${item.loja}`);
            });
        } else {
            console.log(`❌ FALHA - Apenas ${numResultados} resultado(s)`);
            falhas++;
        }

    } catch (error) {
        console.log(`❌ ERRO - ${error.message}`);
        falhas++;
    }

    // Pequeno delay para não sobrecarregar
    if (idx < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Relatório Final
console.log(`\n\n${"═".repeat(80)}`);
console.log(`📊 RELATÓRIO FINAL - TESTE ABRANGENTE`);
console.log(`${"═".repeat(80)}`);

console.log(`\n📈 Métricas Globais:`);
console.log(`   • Total de Testes: ${totalTestes}`);
console.log(`   • Sucessos: ${sucessos} (${((sucessos / totalTestes) * 100).toFixed(1)}%)`);
console.log(`   • Falhas: ${falhas} (${((falhas / totalTestes) * 100).toFixed(1)}%)`);

console.log(`\n📊 Performance por Categoria:`);
Object.entries(resultadosPorCategoria).forEach(([cat, stats]) => {
    const taxaSucesso = ((stats.sucessos / stats.testes) * 100).toFixed(0);
    const mediaResultados = (stats.totalResultados / stats.testes).toFixed(1);
    console.log(`   ${cat}:`);
    console.log(`      Taxa de Sucesso: ${taxaSucesso}%`);
    console.log(`      Média de Resultados: ${mediaResultados}`);
});

console.log(`\n🎯 Avaliação Geral:`);
const taxaGeral = (sucessos / totalTestes) * 100;
if (taxaGeral >= 80) {
    console.log(`   ✅ EXCELENTE - Módulo funcionando bem em múltiplas categorias!`);
} else if (taxaGeral >= 60) {
    console.log(`   ⚠️  BOM - Algumas categorias precisam de ajuste.`);
} else {
    console.log(`   ❌ INSUFICIENTE - Módulo precisa de melhorias.`);
}

console.log(`\n${"═".repeat(80)}\n`);
