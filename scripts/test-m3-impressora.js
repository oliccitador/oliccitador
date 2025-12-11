// Teste M3 CATMAT - Impressora
import dotenv from 'dotenv';
dotenv.config();

import { consultarCATMATCompleto } from '../lib/catmat.js';

console.log('\n🧪 TESTE M3 CATMAT - IMPRESSORA MULTIFUNCIONAL\n');

(async () => {
    const CODIGO = '204959';

    const resultado = await consultarCATMATCompleto(CODIGO);

    console.log('✅ RESULTADO:\n');
    console.log(`  Código: ${resultado.codigo}`);
    console.log(`  Grupo: ${resultado.grupo}`);
    console.log(`  PDM: ${resultado.pdm}`);
    console.log(`  Descrição: ${resultado.descricao_item}`);
    console.log(`\n  ⭐ Nome Comercial: ${resultado.nome_comercial}`);
    console.log(`  🔍 Query: ${resultado.query_busca}`);
    console.log(`  📋 Specs:`, resultado.specs_criticas);
})();
