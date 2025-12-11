// Script de teste de cotação - Máscara Cirúrgica
// Uso: node scripts/test-cotacao-mascara.js

const { analisarItem } = require('../lib/gemini');
const { buscarMelhoresPrecos } = require('../lib/price-search');

async function testarCotacao() {
    console.log('🧪 TESTE DE COTAÇÃO - MÁSCARA CIRÚRGICA');
    console.log('═══════════════════════════════════════\n');

    const descricao = `Máscara Cirúrgica Descartável
Confeccionada em tecido não tecido (TNT) em formato retangular,
com três camadas de proteção. Elástico para fixação e bordas
acabadas por soldagem eletrônica pontilhada.`;

    console.log('📝 DESCRIÇÃO DO PRODUTO:');
    console.log(descricao);
    console.log('\n');

    try {
        // PASSO 1: Análise com Gemini (M1)
        console.log('🤖 PASSO 1: Analisando com Gemini (M1)...\n');
        const analise = await analisarItem(descricao);

        console.log('✅ ANÁLISE CONCLUÍDA:');
        console.log('─────────────────────────────────────');
        console.log('Produto:', analise.produto_referencia?.nome || 'N/A');
        console.log('Categoria:', analise.categoria || 'N/A');
        console.log('Query Semântica:', analise.query_semantica_limpa || 'N/A');
        console.log('Tem CA?', analise.ca_module?.ca_numero ? `Sim (${analise.ca_module.ca_numero})` : 'Não');
        console.log('Tem CATMAT?', analise.catmat_module?.codigo ? `Sim (${analise.catmat_module.codigo})` : 'Não');
        console.log('\n');

        // PASSO 2: Cotação de Preços (M4)
        console.log('💰 PASSO 2: Buscando preços (M4)...\n');

        const parametrosCotacao = {
            query: analise.query_semantica_limpa || descricao,
            has_ca: !!analise.ca_module?.ca_numero,
            ca_numero: analise.ca_module?.ca_numero || null,
            ca_nome_comercial: analise.ca_module?.nome_comercial || null,
            produto_nome: analise.produto_referencia?.nome || 'Máscara Cirúrgica',
            descricao_tecnica: descricao
        };

        const cotacao = await buscarMelhoresPrecos(parametrosCotacao);

        console.log('✅ COTAÇÃO CONCLUÍDA:');
        console.log('─────────────────────────────────────');

        if (cotacao.precos && cotacao.precos.length > 0) {
            console.log(`\n📊 TOP ${cotacao.precos.length} PREÇOS ENCONTRADOS:\n`);
            cotacao.precos.forEach((preco, index) => {
                console.log(`${index + 1}. ${preco.title}`);
                console.log(`   Preço: R$ ${preco.price}`);
                console.log(`   Loja: ${preco.source}`);
                console.log(`   Link: ${preco.link}`);
                console.log('');
            });
        } else {
            console.log('⚠️  Nenhum preço encontrado no Google Shopping');
        }

        if (cotacao.pncp && cotacao.pncp.length > 0) {
            console.log(`\n🏛️  REFERÊNCIAS PNCP (${cotacao.pncp.length}):\n`);
            cotacao.pncp.forEach((ref, index) => {
                console.log(`${index + 1}. ${ref.orgao || 'Órgão não informado'}`);
                console.log(`   Valor: R$ ${ref.valor_unitario || 'N/A'}`);
                console.log(`   Data: ${ref.data || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('⚠️  Nenhuma referência PNCP encontrada');
        }

        console.log('\n═══════════════════════════════════════');
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:');
        console.error('─────────────────────────────────────');
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('\n');
        process.exit(1);
    }
}

// Executar teste
testarCotacao();
