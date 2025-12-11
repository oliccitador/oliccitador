// Teste de Migração M2 -> SerpApi
import { buscarDadosCA } from '../lib/ca-real-search.js';

console.log('\n🔍 TESTE M2: MIGRADO PARA SERPAPI\n');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {
    // Caso difícil que falhava antes: CA 20565
    const CA = '20565';
    console.log(`🧪 Testando CA ${CA}...`);

    try {
        const resultado = await buscarDadosCA(CA);

        if (resultado) {
            console.log(`\n✅ SUCESSO! Dados encontrados via SerpApi:`);
            console.log(JSON.stringify(resultado, null, 2));
        } else {
            console.error(`\n❌ FALHA: Nenhum dado encontrado.`);
        }

    } catch (e) {
        console.error(`\n❌ ERRO FATAL:`, e);
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
})();
