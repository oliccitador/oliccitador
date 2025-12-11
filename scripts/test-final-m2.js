// Teste Final M2+M4
// Valida CA 20565 e busca de preços

import { buscarDadosCA } from '../lib/ca-real-search.js';

console.log('\n🧪 TESTE FINAL: M2 + M4');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {
    const CA = '20565';
    console.log(`📋 Testando CA ${CA}...\n`);

    try {
        console.log('ETAPA 1: Buscar dados do CA (M2)');
        const dadosCA = await buscarDadosCA(CA);

        if (dadosCA) {
            console.log('\n✅ M2 SUCESSO! Dados do CA:');
            console.log(JSON.stringify(dadosCA, null, 2));
        } else {
            console.error('\n❌ M2 FALHOU: Nenhum dado retornado');
            process.exit(1);
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (e) {
        console.error('\n❌ ERRO FATAL:', e);
        process.exit(1);
    }
})();
