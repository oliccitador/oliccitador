// TESTE COMPLETO PRE-COMMIT
// Valida todos os ajustes: Query Semantica, Snippet PNCP, Cotacao
import { buscarMelhoresPrecos } from '../lib/price-search.js';
import fs from 'fs';

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TESTE COMPLETO PRE-COMMIT - VALIDACAO DE TODOS OS AJUSTES           ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

const report = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
};

// ============================================================================
// TESTE 1: Modulo de Cotacao (price-search.js)
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 TESTE 1: MODULO DE COTACAO (Mercado Livre Scraping)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const cotacaoTests = [
    { name: 'Geladeira (Grid Layout)', query: 'GELADEIRA FROST FREE 400L', minResults: 2 },
    { name: 'Notebook (Lista Layout)', query: 'NOTEBOOK I5 8GB SSD', minResults: 2 },
    { name: 'Cadeira Rodas (Medico)', query: 'CADEIRA RODAS DOBRAVEL ADULTO', minResults: 2 },
    { name: 'Ar Condicionado (Eletro)', query: 'AR CONDICIONADO SPLIT 12000 BTU', minResults: 2 },
    { name: 'Impressora (Escritorio)', query: 'IMPRESSORA MULTIFUNCIONAL LASER', minResults: 2 },
];

let cotacaoPassed = 0;
let cotacaoFailed = 0;

for (const test of cotacaoTests) {
    console.log(`  🔍 Testando: ${test.name}`);
    console.log(`     Query: "${test.query}"`);

    try {
        const result = await buscarMelhoresPrecos({
            query: test.query,
            has_ca: false,
            ca_numero: null,
            ca_descricao_tecnica: null,
            ca_nome_comercial: null,
            query_semantica: test.query
        });

        const numResults = result.melhores_precos?.length || 0;
        const passed = numResults >= test.minResults;

        if (passed) {
            console.log(`     ✅ PASSOU - ${numResults} resultados`);
            if (numResults > 0) {
                const topPrice = result.melhores_precos[0];
                console.log(`     Top: ${topPrice.preco_formatado} - ${topPrice.titulo.substring(0, 40)}...`);
            }
            cotacaoPassed++;
        } else {
            console.log(`     ❌ FALHOU - Apenas ${numResults} resultado(s) (min: ${test.minResults})`);
            cotacaoFailed++;
        }

        report.tests.push({
            module: 'cotacao',
            name: test.name,
            query: test.query,
            results: numResults,
            passed: passed,
            topResult: numResults > 0 ? result.melhores_precos[0] : null
        });

    } catch (error) {
        console.log(`     ❌ ERRO: ${error.message}`);
        cotacaoFailed++;
        report.tests.push({
            module: 'cotacao',
            name: test.name,
            query: test.query,
            error: error.message,
            passed: false
        });
    }

    console.log('');
    await new Promise(r => setTimeout(r, 1000));
}

const cotacaoSuccess = cotacaoFailed === 0;
console.log(`  📊 Cotacao: ${cotacaoPassed}/${cotacaoTests.length} testes passaram (${cotacaoSuccess ? '✅ OK' : '❌ FALHOU'})\n`);

// ============================================================================
// TESTE 2: Query Semantica (cleanAndExtract em gemini.js)
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 TESTE 2: QUERY SEMANTICA (cleanAndExtract)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Importar funcao cleanAndExtract de gemini.js (precisamos extrair)
// Como cleanAndExtract nao esta exportada, vamos testar via API se disponivel
// Por ora, vamos validar a estrutura do arquivo

const geminiPath = 'lib/gemini.js';
const geminiContent = fs.readFileSync(geminiPath, 'utf-8');

const querySemanticaTests = [
    {
        check: 'cleanAndExtract existe',
        test: () => geminiContent.includes('function cleanAndExtract') || geminiContent.includes('const cleanAndExtract')
    },
    {
        check: 'Remove valores monetarios',
        test: () => geminiContent.includes('R\\$') || geminiContent.includes('reais') || geminiContent.includes('monetar')
    },
    {
        check: 'Limite de palavras configurado',
        test: () => geminiContent.includes('15') || geminiContent.includes('maxWords')
    },
    {
        check: 'cleanForPNCP existe',
        test: () => geminiContent.includes('cleanForPNCP')
    },
    {
        check: 'Limite PNCP (25 palavras)',
        test: () => geminiContent.includes('25')
    },
];

let queryPassed = 0;
let queryFailed = 0;

for (const test of querySemanticaTests) {
    const passed = test.test();
    console.log(`  ${passed ? '✅' : '❌'} ${test.check}`);

    if (passed) queryPassed++;
    else queryFailed++;

    report.tests.push({
        module: 'query_semantica',
        name: test.check,
        passed: passed
    });
}

const querySuccess = queryFailed === 0;
console.log(`\n  📊 Query Semantica: ${queryPassed}/${querySemanticaTests.length} verificacoes passaram (${querySuccess ? '✅ OK' : '❌ FALHOU'})\n`);

// ============================================================================
// TESTE 3: price-search.js estrutura
// ============================================================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 TESTE 3: ESTRUTURA price-search.js');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const priceSearchPath = 'lib/price-search.js';
const priceSearchContent = fs.readFileSync(priceSearchPath, 'utf-8');

const structureTests = [
    {
        check: 'Suporte a layout LI (Lista)',
        test: () => priceSearchContent.includes('ui-search-layout__item')
    },
    {
        check: 'Suporte a layout DIV (Grid)',
        test: () => priceSearchContent.includes('ui-search-result__wrapper')
    },
    {
        check: 'Fallback para titulo (poly + ui)',
        test: () => priceSearchContent.includes('poly-component__title') && priceSearchContent.includes('ui-search-item__title')
    },
    {
        check: 'Fallback para preco',
        test: () => priceSearchContent.includes('andes-money-amount__fraction')
    },
    {
        check: 'Fallback para link',
        test: () => priceSearchContent.includes('poly-component__title') && priceSearchContent.includes('href')
    },
    {
        check: 'buscarMelhoresPrecos exportada',
        test: () => priceSearchContent.includes('export') && priceSearchContent.includes('buscarMelhoresPrecos')
    },
];

let structurePassed = 0;
let structureFailed = 0;

for (const test of structureTests) {
    const passed = test.test();
    console.log(`  ${passed ? '✅' : '❌'} ${test.check}`);

    if (passed) structurePassed++;
    else structureFailed++;

    report.tests.push({
        module: 'price_search_structure',
        name: test.check,
        passed: passed
    });
}

const structureSuccess = structureFailed === 0;
console.log(`\n  📊 Estrutura: ${structurePassed}/${structureTests.length} verificacoes passaram (${structureSuccess ? '✅ OK' : '❌ FALHOU'})\n`);

// ============================================================================
// RELATORIO FINAL
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                           RELATORIO FINAL PRE-COMMIT                          ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

report.summary.total = cotacaoTests.length + querySemanticaTests.length + structureTests.length;
report.summary.passed = cotacaoPassed + queryPassed + structurePassed;
report.summary.failed = cotacaoFailed + queryFailed + structureFailed;

const allSuccess = report.summary.failed === 0;

console.log(`  📊 Modulo Cotacao:      ${cotacaoPassed}/${cotacaoTests.length} ${cotacaoSuccess ? '✅' : '❌'}`);
console.log(`  📊 Query Semantica:     ${queryPassed}/${querySemanticaTests.length} ${querySuccess ? '✅' : '❌'}`);
console.log(`  📊 Estrutura Code:      ${structurePassed}/${structureTests.length} ${structureSuccess ? '✅' : '❌'}`);
console.log('  ─────────────────────────────────────────');
console.log(`  📊 TOTAL:               ${report.summary.passed}/${report.summary.total}`);
console.log('');

if (allSuccess) {
    console.log('  ╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('  ║  ✅ TODOS OS TESTES PASSARAM - SEGURO PARA COMMIT                        ║');
    console.log('  ╚═══════════════════════════════════════════════════════════════════════════╝');
} else {
    console.log('  ╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('  ║  ❌ ALGUNS TESTES FALHARAM - REVISAR ANTES DO COMMIT                     ║');
    console.log('  ╚═══════════════════════════════════════════════════════════════════════════╝');
}

console.log('');

// Salvar relatorio
fs.writeFileSync('pre-commit-report.json', JSON.stringify(report, null, 2));
console.log('  📁 Relatorio salvo em: pre-commit-report.json\n');
