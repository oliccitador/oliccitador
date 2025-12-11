// Teste simples de extração
import { buscarMelhoresPrecos } from '../lib/price-search.js';

console.log('Testing: LIQUIDIFICADOR 3L 1200W\n');

const result = await buscarMelhoresPrecos({
    query: "LIQUIDIFICADOR 3L 1200W",
    has_ca: false,
    ca_numero: null,
    ca_descricao_tecnica: null,
    ca_nome_comercial: null,
    query_semantica: "LIQUIDIFICADOR 3L 1200W"
});

console.log('\n=== RESULTS ===');
console.log(`Total: ${result.melhores_precos.length}`);

if (result.melhores_precos.length > 0) {
    console.log('\nTop 3:');
    result.melhores_precos.slice(0, 3).forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.preco_formatado} - ${item.titulo}`);
        console.log(`   Loja: ${item.loja}`);
    });
} else {
    console.log('FAILED - No results');
}
