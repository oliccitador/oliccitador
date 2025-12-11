// Teste integrado M3 + M4-CATMAT
// Fluxo completo: Consulta CATMAT → Extrai Specs → Busca Preços
import dotenv from 'dotenv';
dotenv.config();

import { consultarCATMATCompleto } from '../lib/catmat.js';
import { buscarPrecosCATMAT } from '../lib/price-search-catmat.js';

console.log('\n🧪 TESTE INTEGRADO: M3 + M4-CATMAT\n');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {
    // Teste 1: Notebook
    console.log('📋 TESTE 1: NOTEBOOK (CATMAT 451899)\n');

    try {
        // M3: Consultar CATMAT
        const dadosCATMAT = await consultarCATMATCompleto('451899');

        console.log('✅ M3 - Dados CATMAT:');
        console.log(`  Código: ${dadosCATMAT.codigo}`);
        console.log(`  Nome: ${dadosCATMAT.nome_comercial}`);
        console.log(`  Query: ${dadosCATMAT.query_busca}`);
        console.log(`  Specs:`, dadosCATMAT.specs_criticas);

        console.log('\n🔍 M4-CATMAT - Buscando preços...\n');

        // M4-CATMAT: Buscar preços
        const precos = await buscarPrecosCATMAT({
            query_completa: dadosCATMAT.query_busca,
            nome_comercial: dadosCATMAT.nome_comercial,
            specs_criticas: dadosCATMAT.specs_criticas,
            codigo_catmat: dadosCATMAT.codigo
        });

        console.log('✅ M4-CATMAT - Resultados:');
        console.log(`  Estratégia: ${precos.estrategia_usada}`);
        console.log(`  Total encontrados: ${precos.total_encontrados}`);
        console.log(`  Top 3 preços:`);

        precos.melhores_precos.forEach((item, idx) => {
            console.log(`    ${idx + 1}. ${item.titulo}`);
            console.log(`       Preço: ${item.preco_formatado || `R$ ${item.preco?.toFixed(2)}`}`);
            console.log(`       Loja: ${item.loja}`);
            console.log(`       Score: ${item.relevance_score || 'N/A'}`);
        });

        console.log(`\n  Referências PNCP: ${precos.referencias_governamentais.length}`);

    } catch (e) {
        console.error('\n❌ ERRO:', e.message);
        console.error(e.stack);
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Teste 2: Impressora
    console.log('📋 TESTE 2: IMPRESSORA (CATMAT 204959)\n');

    try {
        const dadosCATMAT = await consultarCATMATCompleto('204959');

        console.log('✅ M3 - Dados CATMAT:');
        console.log(`  Nome: ${dadosCATMAT.nome_comercial}`);
        console.log(`  Query: ${dadosCATMAT.query_busca.substring(0, 100)}...`);

        console.log('\n🔍 M4-CATMAT - Buscando preços...\n');

        const precos = await buscarPrecosCATMAT({
            query_completa: dadosCATMAT.query_busca,
            nome_comercial: dadosCATMAT.nome_comercial,
            specs_criticas: dadosCATMAT.specs_criticas,
            codigo_catmat: dadosCATMAT.codigo
        });

        console.log('✅ M4-CATMAT - Resultados:');
        console.log(`  Estratégia: ${precos.estrategia_usada}`);
        console.log(`  Total: ${precos.total_encontrados} preços`);
        console.log(`  Top 3: ${precos.melhores_precos.length} itens`);

    } catch (e) {
        console.error('\n❌ ERRO:', e.message);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 TESTE COMPLETO!\n');

})();
