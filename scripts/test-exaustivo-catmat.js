// TESTE EXAUSTIVO M3+M4-CATMAT - 20 Códigos de 4 Grupos
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { consultarCATMATCompleto } from '../lib/catmat.js';
import { buscarPrecosCATMAT } from '../lib/price-search-catmat.js';

const testData = JSON.parse(fs.readFileSync('scripts/test-codes-catmat.json'));

console.log('\n🧪 TESTE EXAUSTIVO M3+M4-CATMAT - PRODUÇÃO\n');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total de códigos: ${testData.codes.length}`);
console.log('Categorias: INFORMÁTICA, IMPRESSORAS, MÓVEIS, EQUIPAMENTOS');
console.log('═══════════════════════════════════════════════════════════\n');

const results = {
    total: 0,
    sucesso: 0,
    falha: 0,
    compativel: 0,
    incompativel: 0,
    detalhes: []
};

async function validarCompatibilidade(queryBusca, produtoTitulo) {
    // Extrai palavras-chave da query
    const queryKeywords = queryBusca
        .toLowerCase()
        .replace(/[,\\.]/g, ' ')
        .split(' ')
        .filter(w => w.length > 3); // Palavras > 3 caracteres

    const tituloLower = produtoTitulo.toLowerCase();

    // Conta quantas keywords aparecem
    const matches = queryKeywords.filter(kw => tituloLower.includes(kw));
    const compatibilidade = (matches.length / queryKeywords.length) * 100;

    return {
        compativel: compatibilidade >= 30, // 30% das keywords
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
            // M3: Consultar CATMAT
            const dadosCATMAT = await consultarCATMATCompleto(codigo);

            if (!dadosCATMAT || dadosCATMAT.status !== 'OK') {
                console.log('❌ M3 falhou');
                results.falha++;
                results.detalhes.push({ codigo, status: 'M3_FAILED', erro: 'Consulta falhou' });
                continue;
            }

            console.log(`✅ M3: ${dadosCATMAT.nome_comercial}`);
            console.log(`   Grupo: ${dadosCATMAT.grupo?.substring(0, 40)}...`);
            console.log(`   Query: ${dadosCATMAT.query_busca.substring(0, 80)}...`);

            // M4-CATMAT: Buscar preços
            const precos = await buscarPrecosCATMAT({
                query_completa: dadosCATMAT.query_busca,
                nome_comercial: dadosCATMAT.nome_comercial,
                specs_criticas: dadosCATMAT.specs_criticas,
                codigo_catmat: codigo
            });

            if (!precos || precos.melhores_precos.length === 0) {
                console.log('⚠️  M4: Sem preços encontrados');
                results.falha++;
                results.detalhes.push({
                    codigo,
                    nome: dadosCATMAT.nome_comercial,
                    query: dadosCATMAT.query_busca,
                    status: 'SEM_PRECOS',
                    estrategia: precos?.estrategia_usada || 'N/A'
                });
                continue;
            }

            console.log(`✅ M4: ${precos.melhores_precos.length} preços (${precos.estrategia_usada})`);

            // Validar compatibilidade do Top 1
            const top1 = precos.melhores_precos[0];
            const compat = validarCompatibilidade(dadosCATMAT.query_busca, top1.titulo);

            const statusCompat = compat.compativel ? '✓ COMPATÍVEL' : '✗ INCOMPATÍVEL';
            const emoji = compat.compativel ? '✅' : '❌';

            console.log(`${emoji} Top 1: ${top1.titulo.substring(0, 60)}...`);
            console.log(`   Preço: ${top1.preco_formatado || `R$ ${top1.preco?.toFixed(2)}`}`);
            console.log(`   Loja: ${top1.loja}`);
            console.log(`   ${statusCompat} (${compat.score}%) - ${compat.matches}/${compat.total_keywords} keywords`);

            if (compat.compativel) {
                results.compativel++;
            } else {
                results.incompativel++;
            }

            results.sucesso++;
            results.detalhes.push({
                codigo,
                nome: dadosCATMAT.nome_comercial,
                query: dadosCATMAT.query_busca.substring(0, 100),
                status: 'OK',
                precos_encontrados: precos.melhores_precos.length,
                estrategia: precos.estrategia_usada,
                top1_titulo: top1.titulo,
                top1_preco: top1.preco,
                top1_loja: top1.loja,
                compatibilidade: compat.compativel,
                compat_score: compat.score
            });

        } catch (e) {
            console.log(`❌ ERRO: ${e.message}`);
            results.falha++;
            results.detalhes.push({ codigo, status: 'ERROR', erro: e.message });
        }

        // Pausa de 1s entre requisições (evitar rate limit)
        await new Promise(r => setTimeout(r, 1000));
    }

    // RELATÓRIO FINAL
    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('📊 RELATÓRIO FINAL - TESTE EXAUSTIVO M3+M4-CATMAT');
    console.log('═'.repeat(80));
    console.log(`\n  Total de testes: ${results.total}`);
    console.log(`  ✅ Sucesso: ${results.sucesso} (${Math.round(results.sucesso / results.total * 100)}%)`);
    console.log(`  ❌ Falha: ${results.falha} (${Math.round(results.falha / results.total * 100)}%)`);
    console.log(`\n  Compatibilidade dos preços encontrados:`);
    console.log(`  ✓ Compatível: ${results.compativel} (${Math.round(results.compativel / results.sucesso * 100)}%)`);
    console.log(`  ✗ Incompatível: ${results.incompativel} (${Math.round(results.incompativel / results.sucesso * 100)}%)`);

    console.log('\n\n📋 DETALHES POR CÓDIGO:\n');

    results.detalhes.forEach((det, idx) => {
        const num = `${idx + 1}`.padStart(2, '0');

        if (det.status === 'OK') {
            const comp = det.compatibilidade ? '✅' : '⚠️';
            console.log(`${num}. CATMAT ${det.codigo} ${comp}`);
            console.log(`    Nome: ${det.nome}`);
            console.log(`    Top 1: ${det.top1_titulo.substring(0, 70)}...`);
            console.log(`    Preço: R$ ${det.top1_preco.toFixed(2)} (${det.top1_loja})`);
            console.log(`    Compat: ${det.compat_score}% | Estratégia: ${det.estrategia}\n`);
        } else {
            console.log(`${num}. CATMAT ${det.codigo} ❌ ${det.status}`);
            console.log(`    Erro: ${det.erro || 'Sem preços'}\n`);
        }
    });

    console.log('═'.repeat(80));

    // Salvar relatório
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `scripts/test-report-${timestamp}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Relatório salvo em: ${reportPath}\n`);

})();
