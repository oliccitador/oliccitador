// Teste focado nos 5 CATMATs problemáticos
import dotenv from 'dotenv';
dotenv.config();

import { consultarCATMATCompleto } from '../lib/catmat.js';
import { buscarPrecosCATMAT } from '../lib/price-search-catmat.js';

console.log('\n🧪 TESTE FOCADO - CÓDIGOS PROBLEMÁTICOS\n');
console.log('═══════════════════════════════════════════════════════════\n');

const problemCodes = [
    { code: '200331', desc: 'Refil Tinta' },
    { code: '200685', desc: 'Fita Teleimpressora' },
    { code: '4782', desc: 'Distribuidor Asfalto' },
    { code: '58718', desc: 'Componente Ferroviário' },
    { code: '95974', desc: 'Película Refletiva' }
];

function validarCompatibilidade(queryBusca, produtoTitulo) {
    const queryKeywords = queryBusca
        .toLowerCase()
        .replace(/[,\\.]/g, ' ')
        .split(' ')
        .filter(w => w.length > 3);

    const tituloLower = produtoTitulo.toLowerCase();
    const matches = queryKeywords.filter(kw => tituloLower.includes(kw));
    const compatibilidade = (matches.length / queryKeywords.length) * 100;

    return {
        compativel: compatibilidade >= 30,
        score: Math.round(compatibilidade),
        matches: matches.length,
        total_keywords: queryKeywords.length,
        keywords_encontradas: matches
    };
}

(async () => {
    const results = [];

    for (const item of problemCodes) {
        console.log(`\n📋 TESTANDO: ${item.desc} (${item.code})`);
        console.log('─'.repeat(60));

        try {
            // M3
            const dados = await consultarCATMATCompleto(item.code);
            console.log(`✅ M3: ${dados.nome_comercial}`);
            console.log(`   Query: ${dados.query_busca}`);

            // M4
            const precos = await buscarPrecosCATMAT({
                query_completa: dados.query_busca,
                nome_comercial: dados.nome_comercial,
                specs_criticas: dados.specs_criticas,
                codigo_catmat: item.code
            });

            console.log(`✅ M4: ${precos.melhores_precos.length} preços (${precos.estrategia_usada})`);

            if (precos.melhores_precos.length > 0) {
                const top1 = precos.melhores_precos[0];
                const compat = validarCompatibilidade(dados.query_busca, top1.titulo);

                console.log(`\n   TOP 1:`);
                console.log(`   Título: ${top1.titulo}`);
                console.log(`   Preço: R$ ${top1.preco.toFixed(2)}`);
                console.log(`   Loja: ${top1.loja}`);
                console.log(`   Compatibilidade: ${compat.score}% (${compat.matches}/${compat.total_keywords} keywords)`);
                console.log(`   Keywords encontradas: ${compat.keywords_encontradas.join(', ')}`);
                console.log(`   Status: ${compat.compativel ? '✅ COMPATÍVEL' : '❌ INCOMPATÍVEL'}`);

                results.push({
                    code: item.code,
                    desc: item.desc,
                    query: dados.query_busca,
                    top1_titulo: top1.titulo,
                    top1_preco: top1.preco,
                    compat_score: compat.score,
                    compativel: compat.compativel,
                    estrategia: precos.estrategia_usada
                });
            } else {
                console.log('⚠️ Sem preços encontrados');
                results.push({
                    code: item.code,
                    desc: item.desc,
                    query: dados.query_busca,
                    sem_precos: true
                });
            }

        } catch (e) {
            console.log(`❌ ERRO: ${e.message}`);
            results.push({
                code: item.code,
                desc: item.desc,
                erro: e.message
            });
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════════════════\n');

    const compativeis = results.filter(r => r.compativel);
    const incompativeis = results.filter(r => r.compativel === false);

    console.log(`Total testado: ${results.length}`);
    console.log(`✅ Compatível: ${compativeis.length} (${Math.round(compativeis.length / results.length * 100)}%)`);
    console.log(`❌ Incompatível: ${incompativeis.length} (${Math.round(incompativeis.length / results.length * 100)}%)`);

    console.log('\n📋 DETALHES:\n');
    results.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.desc} (${r.code})`);
        if (r.erro) {
            console.log(`   ❌ Erro: ${r.erro}`);
        } else if (r.sem_precos) {
            console.log(`   ⚠️ Sem preços`);
        } else {
            const icon = r.compativel ? '✅' : '❌';
            console.log(`   ${icon} ${r.compat_score}% - ${r.top1_titulo.substring(0, 60)}...`);
            console.log(`   R$ ${r.top1_preco.toFixed(2)}`);
        }
        console.log();
    });

})();
