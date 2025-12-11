// Script de Validação de Integração de Cotação (M4) com M2/M3
// Simula o ambiente de produção chamando o módulo real.

import { buscarMelhoresPrecos } from '../lib/price-search.js';

console.log('\n🔍 VALIDAÇÃO DE INTEGRAÇÃO DE COTAÇÃO (M4 + M2/M3)\n');
console.log('Este teste fará chamadas REAIS as APIs (Google Shopping/SerpApi e PNCP).');
console.log('═══════════════════════════════════════════════════════════\n');

(async () => {

    // --- CENÁRIO 1: FLUXO M2 (CA) ---
    console.log('🧪 TESTE 1: Integração M2 (CA) -> M4 (Plano Radical)');
    console.log('   Cenário: Item com CA 40677 (Botina) identificado.');

    // Simula dados vindo do Orchestrator após passar pelo M2
    const paramsM2 = {
        query: 'Botina segurança CA 40677',
        has_ca: true,
        ca_numero: '40677',
        ca_nome_comercial: 'BOTINA DE SEGURANCA TIPO B', // Nome vindo da base do CA
        query_semantica: 'Botina Segurança Couro Bico Aço', // Fallback, não deve ser usado se CA funcionar
        ca_descricao_tecnica: 'Calçado de segurança de uso profissional tipo botina...'
    };

    try {
        console.log('   Executar buscarMelhoresPrecos()...');
        const resultadoM2 = await buscarMelhoresPrecos(paramsM2);

        console.log('\n   📊 RESULTADO TESTE 1:');
        console.log(`   Produto Buscado: "${resultadoM2.produto}"`);
        console.log(`   Fonte: "${resultadoM2.fonte}"`);
        console.log(`   Origem: "${resultadoM2.origem_descricao}"`);
        console.log(`   Preços Encontrados: ${resultadoM2.melhores_precos.length}`);

        if (resultadoM2.melhores_precos.length > 0) {
            console.log(`   💰 Melhor Preço: R$ ${resultadoM2.melhores_precos[0].preco}`);
            console.log(`   🛒 Título Loja: ${resultadoM2.melhores_precos[0].titulo}`);
        }

        // Validação da Lógica
        if (resultadoM2.origem_descricao === 'exact_ca_match') {
            console.log('   ✅ SUCESSO: Plano Radical ativado (Busca por CA Exato)');
        } else {
            console.error('   ⚠️ ALERTA: Plano Radical NÃO ativado. Usou estratégia:', resultadoM2.origem_descricao);
        }

    } catch (error) {
        console.error('   ❌ ERRO TESTE 1:', error);
    }

    console.log('\n-----------------------------------------------------------\n');

    // --- CENÁRIO 2: FLUXO M3 (CATMAT) ---
    console.log('🧪 TESTE 2: Integração M3 (CATMAT) -> M4 (Busca Semântica)');
    console.log('   Cenário: Item SEM CA, mas com CATMAT identificado (refinamento semântico).');

    // Simula dados vindo do Orchestrator após passar pelo M3 e Gemini
    const paramsM3 = {
        query: 'Luva de proteção',
        has_ca: false,
        ca_numero: null,
        ca_nome_comercial: null,
        // A Query Semântica aqui já seria o resultado do enriquecimento do CATMAT + Gemini
        query_semantica: 'Luva Segurança Vaqueta Petroleira Punho 20cm'
    };

    try {
        console.log('   Executar buscarMelhoresPrecos()...');
        const resultadoM3 = await buscarMelhoresPrecos(paramsM3);

        console.log('\n   📊 RESULTADO TESTE 2:');
        console.log(`   Produto Buscado: "${resultadoM3.produto}"`);
        console.log(`   Fonte: "${resultadoM3.fonte}"`);
        console.log(`   Origem: "${resultadoM3.origem_descricao}"`);
        console.log(`   Preços Encontrados: ${resultadoM3.melhores_precos.length}`);

        if (resultadoM3.melhores_precos.length > 0) {
            console.log(`   💰 Melhor Preço: R$ ${resultadoM3.melhores_precos[0].preco}`);
            console.log(`   🛒 Título Loja: ${resultadoM3.melhores_precos[0].titulo}`);
        }

        // Validação da Lógica
        if (resultadoM3.origem_descricao === 'semantic_query_gemini') {
            console.log('   ✅ SUCESSO: Busca Semântica ativada (Fluxo CATMAT/Genérico)');
        } else {
            console.error('   ⚠️ ALERTA: Estratégia inesperada:', resultadoM3.origem_descricao);
        }

    } catch (error) {
        console.error('   ❌ ERRO TESTE 2:', error);
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

})();
