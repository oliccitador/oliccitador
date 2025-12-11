// TESTE EXAUSTIVO - 20 Produtos COMUNS
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { consultarCATMATCompleto } from '../lib/catmat.js';
import { buscarPrecosCATMAT } from '../lib/price-search-catmat.js';

const testData = JSON.parse(fs.readFileSync('scripts/test-codes-comuns.json'));

console.log('\n🧪 TESTE EXAUSTIVO - 20 PRODUTOS COMUNS\n');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total de códigos: ${testData.codes.length}`);
console.log('Categorias: NOTEBOOKS, IMPRESSORAS, MOBILIÁRIO, COMPUTADORES, PERIFÉRICOS');
console.log('═══════════════════════════════════════════════════════════\n');

const results = {
    total: 0,
    sucesso: 0,
    falha: 0,
    compativel: 0,
    incompativel: 0,
    detalhes: []
};

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
        total_keywords: queryKeywords.length
    };
}

(async () => {
    for (const codigo of testData.codes) {
        results.total++;

        console.log(`\n[${results.total}/20] TESTANDO CATMAT ${codigo}`);
        console.log('─'.repeat(60));

        try {
            const dadosCATMAT = await consultarCATMATCompleto(codigo);

            if (!dadosCATMAT || dadosCATMAT.status !== 'OK') {
                console.log('❌ M3 falhou');
                results.falha++;
                results.detalhes.push({ codigo, status: 'M3_FAILED' });
                continue;
            }

            console.log(`✅ M3: ${dadosCATMAT.nome_comercial}`);
            console.log(`   Query: ${dadosCATMAT.query_busca.substring(0, 80)}...`);

            const precos = await buscarPrecosCATMAT({
                query_completa: dadosCATMAT.query_busca,
                nome_comercial: dadosCATMAT.nome_comercial,
                specs_criticas: dadosCATMAT.specs_criticas,
                codigo_catmat: codigo
            });

            if (!precos || precos.melhores_precos.length === 0) {
                console.log('⚠️  M4: Sem preços');
                results.falha++;
                results.detalhes.push({ codigo, status: 'SEM_PRECOS', nome: dadosCATMAT.nome_comercial });
                continue;
            }

            console.log(`✅ M4: ${precos.melhores_precos.length} preços (${precos.estrategia_usada})`);

            const top1 = precos.melhores_precos[0];
            const compat = validarCompatibilidade(dadosCATMAT.query_busca, top1.titulo);

            const statusIcon = compat.compativel ? '✅' : '❌';

            console.log(`${statusIcon} Top 1: ${top1.titulo.substring(0, 60)}...`);
            console.log(`   Preço: R$ ${top1.preco.toFixed(2)} | Compat: ${compat.score}%`);

            if (compat.compativel) {
                results.compativel++;
            } else {
                results.incompativel++;
            }

            results.sucesso++;
            results.detalhes.push({
                codigo,
                nome: dadosCATMAT.nome_comercial,
                status: 'OK',
                top1_titulo: top1.titulo,
                top1_preco: top1.preco,
                compatibilidade: compat.compativel,
                compat_score: compat.score,
                estrategia: precos.estrategia_usada
            });

        } catch (e) {
            console.log(`❌ ERRO: ${e.message}`);
            results.falha++;
            results.detalhes.push({ codigo, status: 'ERROR', erro: e.message });
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    // RELATÓRIO FINAL
    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('📊 RELATÓRIO FINAL - TESTE 20 PRODUTOS COMUNS');
    console.log('═'.repeat(80));
    console.log(`\n  Total: ${results.total}`);
    console.log(`  ✅ Sucesso: ${results.sucesso} (${Math.round(results.sucesso / results.total * 100)}%)`);
    console.log(`  ❌ Falha: ${results.falha} (${Math.round(results.falha / results.total * 100)}%)`);
    console.log(`\n  Compatibilidade:`);
    console.log(`  ✅ Compatível: ${results.compativel} (${Math.round(results.compativel / results.sucesso * 100)}%)`);
    console.log(`  ❌ Incompatível: ${results.incompativel} (${Math.round(results.incompativel / results.sucesso * 100)}%)`);

    console.log('\n📋 RESUMO:\n');

    results.detalhes.forEach((det, idx) => {
        const num = `${idx + 1}`.padStart(2, '0');

        if (det.status === 'OK') {
            const icon = det.compatibilidade ? '✅' : '⚠️';
            console.log(`${num}. ${icon} CATMAT ${det.codigo} - ${det.compat_score}%`);
            console.log(`    ${det.top1_titulo.substring(0, 70)}...`);
            console.log(`    R$ ${det.top1_preco.toFixed(2)}\n`);
        } else {
            console.log(`${num}. ❌ CATMAT ${det.codigo} - ${det.status}\n`);
        }
    });

    console.log('═'.repeat(80));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(`scripts/test-report-comuns-${timestamp}.json`, JSON.stringify(results, null, 2));
    console.log(`\n💾 Relatório salvo\n`);

})();
