// Teste VARIAÇÕES de query para Impressora Laser
import dotenv from 'dotenv';
dotenv.config();

import { buscarPrecosCATMAT } from '../lib/price-search-catmat.js';

console.log('\n🔍 TESTE VARIAÇÕES - Impressora Laser\n');

const variacoes = [
    "Impressora laser colorida",
    "Impressora laser colorida nova",
    "Impressora laser colorida profissional",
    "Impressora laser colorida escritório",
    "Impressora laser colorida 600 dpi"
];

(async () => {
    for (const query of variacoes) {
        console.log(`\n📋 Query: "${query}"`);
        console.log('─'.repeat(60));

        try {
            const precos = await buscarPrecosCATMAT({
                query_completa: query,
                nome_comercial: "Impressora Laser",
                specs_criticas: { tipo: "laser", cor: "colorida" },
                codigo_catmat: "204951"
            });

            if (precos.melhores_precos.length > 0) {
                const top3 = precos.melhores_precos.slice(0, 3);
                console.log(`✅ Encontrou ${precos.total_encontrados} preços\n`);

                top3.forEach((item, idx) => {
                    console.log(`${idx + 1}. ${item.titulo.substring(0, 60)}...`);
                    console.log(`   R$ ${item.preco.toFixed(2)} - ${item.loja}`);
                });

                const media = top3.reduce((sum, item) => sum + item.preco, 0) / top3.length;
                console.log(`\n   Preço médio top 3: R$ ${media.toFixed(2)}`);
            }

        } catch (e) {
            console.log(`❌ Erro: ${e.message}`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('💡 RECOMENDAÇÃO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('A query que trouxer preço médio entre R$ 1.500-3.000 é a ideal');
    console.log('(Impressoras laser coloridas novas custam nessa faixa)');

})();
