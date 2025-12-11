// Teste M3 CATMAT com extração de specs - Com dotenv
import dotenv from 'dotenv';
dotenv.config();

import { consultarCATMATCompleto } from '../lib/catmat.js';

console.log('\n🧪 TESTE M3 CATMAT - EXTRAÇÃO DE SPECS (NOTEBOOK)\n');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`API Key configurada: ${process.env.GOOGLE_API_KEY ? '✅ SIM' : '❌ NÃO'}\n`);

(async () => {
    const CODIGO_TESTE = '451899'; // Notebook completo

    console.log(`📋 Testando CATMAT ${CODIGO_TESTE} (Notebook)...\n`);

    try {
        const resultado = await consultarCATMATCompleto(CODIGO_TESTE);

        console.log('✅ RESULTADO COMPLETO:\n');
        console.log(JSON.stringify(resultado, null, 2));

        console.log('\n═══════════════════════════════════════════════════════════\n');
        console.log('📊 RESUMO:');
        console.log(`  Código: ${resultado.codigo}`);
        console.log(`  Grupo: ${resultado.grupo}`);
        console.log(`  Classe: ${resultado.classe}`);
        console.log(`  PDM: ${resultado.pdm}`);
        console.log(`  Descrição Técnica: ${resultado.descricao_item}`);
        console.log(`\n  ⭐ Nome Comercial (IA): ${resultado.nome_comercial}`);
        console.log(`  🔍 Query Busca: ${resultado.query_busca}`);
        console.log(`  📋 Specs Críticas:`, resultado.specs_criticas);

    } catch (e) {
        console.error('\n❌ ERRO:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
