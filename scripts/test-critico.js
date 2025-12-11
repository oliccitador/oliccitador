// Teste CRÍTICO - Validação com queries melhoradas
import dotenv from 'dotenv';
dotenv.config();

import { consultarCATMATCompleto } from '../lib/catmat.js';
import { buscarPrecosCATMAT } from '../lib/price-search-catmat.js';

console.log('\n🔥 TESTE CRÍTICO - QUERIES OTIMIZADAS\n');
console.log('═══════════════════════════════════════════════════════════\n');

const testCodes = [
    { code: '451899', desc: 'Notebook 14pol 4GB HDD500GB' },
    { code: '204959', desc: 'Impressora Multifuncional Jato Tinta' },
    { code: '204951', desc: 'Impressora Laser' },
    { code: '202441', desc: 'Apontador Lápis Mesa' }
];

function validarCompatibilidadeMelhorada(queryBusca, produtoTitulo) {
    // Remove palavras de preenchimento
    const stopWords = ['até', 'acima', 'sistema', 'operacional', 'garantia', 'bivolt',
        'alimentação', 'aplicação', 'características', 'adicionais', 'tipo'];

    const queryClean = queryBusca
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));

    const tituloLower = produtoTitulo.toLowerCase();

    // Conta matches com peso
    let score = 0;
    let totalWeight = 0;

    queryClean.forEach(keyword => {
        // Palavras com números têm peso maior
        const hasNumber = /\d/.test(keyword);
        const weight = hasNumber ? 2 : 1;

        totalWeight += weight;

        if (tituloLower.includes(keyword)) {
            score += weight;
        }
    });

    const compatibilidade = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

    return {
        compativel: compatibilidade >= 20, // Threshold 20%
        score: Math.round(compatibilidade),
        matches: score,
        total_weight: totalWeight,
        keywords: queryClean
    };
}

(async () => {
    const results = [];

    for (const item of testCodes) {
        console.log(`\n📋 ${item.desc} (${item.code})`);
        console.log('─'.repeat(60));

        try {
            const dados = await consultarCATMATCompleto(item.code);
            console.log(`✅ M3: "${dados.nome_comercial}"`);
            console.log(`   Query: "${dados.query_busca}"`);

            const precos = await buscarPrecosCATMAT({
                query_completa: dados.query_busca,
                nome_comercial: dados.nome_comercial,
                specs_criticas: dados.specs_criticas,
                codigo_catmat: item.code
            });

            if (precos.melhores_precos.length > 0) {
                const top1 = precos.melhores_precos[0];
                const compat = validarCompatibilidadeMelhorada(dados.query_busca, top1.titulo);

                const icon = compat.compativel ? '✅' : '❌';
                console.log(`${icon} Top 1: "${top1.titulo.substring(0, 70)}..."`);
                console.log(`   Preço: R$ ${top1.preco.toFixed(2)}`);
                console.log(`   Compatibilidade: ${compat.score}% (${compat.matches}/${compat.total_weight} peso)`);
                console.log(`   Keywords: ${compat.keywords.join(', ')}`);

                results.push({
                    code: item.code,
                    desc: item.desc,
                    query: dados.query_busca,
                    top1: top1.titulo,
                    preco: top1.preco,
                    compat: compat.score,
                    compativel: compat.compativel
                });
            } else {
                console.log('⚠️ Sem preços');
            }

        } catch (e) {
            console.log(`❌ ERRO: ${e.message}`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO CRÍTICO');
    console.log('═══════════════════════════════════════════════════════════\n');

    const compativeis = results.filter(r => r.compativel);
    console.log(`✅ Compatível: ${compativeis.length}/${results.length} (${Math.round(compativeis.length / results.length * 100)}%)`);

    results.forEach((r, idx) => {
        const icon = r.compativel ? '✅' : '❌';
        console.log(`\n${idx + 1}. ${icon} ${r.desc} - ${r.compat}%`);
        console.log(`   Query: "${r.query}"`);
        console.log(`   Top 1: "${r.top1.substring(0, 60)}..."`);
        console.log(`   R$ ${r.preco.toFixed(2)}`);
    });

})();
