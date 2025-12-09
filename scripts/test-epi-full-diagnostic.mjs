// DIAGNÓSTICO COMPLETO: EPI Search Quality
// Testa os 3 cenários EXATOS fornecidos pelo usuário

import { buscarMelhoresPrecos } from '../lib/price-search.js';
import { intelligentProductSearch } from '../lib/intelligent-search.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) {
        process.env.SERPAPI_KEY = match[1].trim();
    }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('   DIAGNÓSTICO COMPLETO: EPI SEARCH QUALITY');
console.log('═══════════════════════════════════════════════════════════\n');

const testCases = [
    {
        name: 'CASO 1: Óculos Policarbonato (SEM CA)',
        description: `Especificação
Óculos de proteção com armação e visor em peça única de policarbonato incolor.
Apoio nasal em resina termoplástica.
Hastes tipo espátula, confeccionadas em duas peças: uma do visor e outra em borracha (azul ou preta).
Tratamento antiembaçante.`,
        ca_nome_comercial: '',
        has_ca: false,
        query_semantica: 'Óculos Proteção Policarbonato Incolor Antiembaçante'
    },
    {
        name: 'CASO 2: Óculos Genebra (COM CA) - BEBIDA BUG',
        description: `Especificação
Óculos de segurança do tipo ampla visão, com armação em peça única de PVC flexível e visor de acetato incolor.
Tirante elástico ajustável e formato anatômico para cobrir toda a região ao redor dos olhos.
Referência:
Produtos com as características e qualidade igual ou superior aos do modelo Genebra, da marca KALIPSO, que atendam, no mínimo, às especificações do CA nº 39506.`,
        ca_nome_comercial: 'Genebra', // SIMULA QUE TEM CA
        has_ca: true,
        query_semantica: 'Óculos Ampla Visão PVC Flexível Acetato Incolor'
    },
    {
        name: 'CASO 3: Óculos Ampla Visão (SEM CA)',
        description: `Especificação
Óculos de segurança do tipo ampla visão, com armação em peça única de PVC flexível e visor de acetato incolor.
Tirante elástico ajustável e formato anatômico para cobrir toda a região ao redor dos olhos.`,
        ca_nome_comercial: '',
        has_ca: false,
        query_semantica: 'Óculos Segurança Ampla Visão PVC Flexível Visor Acetato Incolor'
    }
];

const results = [];

for (const testCase of testCases) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${testCase.name}`);
    console.log(`${'═'.repeat(60)}\n`);

    try {
        // STEP 1: Test Intelligent Search alone
        console.log('📋 STEP 1: Intelligent Search Extraction\n');
        const intelligentResult = await intelligentProductSearch(
            testCase.description,
            testCase.ca_nome_comercial
        );

        console.log('Specs Extracted:');
        console.log(`  Model: ${intelligentResult.specs.model || '(none)'}`);
        console.log(`  Brand: ${intelligentResult.specs.brand || '(none)'}`);
        console.log(`  Category: ${intelligentResult.specs.category || '(none)'}`);
        console.log(`  Numerical: [${intelligentResult.specs.numerical.join(', ') || '(none)'}]`);
        console.log(`  Certifications: [${intelligentResult.specs.certifications.join(', ') || '(none)'}]`);
        console.log(`\n  Generated Query: "${intelligentResult.query}"\n`);

        // STEP 2: Full price search
        console.log('💰 STEP 2: Full Price Search\n');
        const priceResult = await buscarMelhoresPrecos({
            ca_descricao_tecnica: testCase.description,
            ca_nome_comercial: testCase.ca_nome_comercial,
            has_ca: testCase.has_ca,
            query_semantica: testCase.query_semantica
        });

        console.log(`Query Used: "${priceResult.produto}"`);
        console.log(`Origin: ${priceResult.origem_descricao}`);
        console.log(`Results Found: ${priceResult.melhores_precos.length}\n`);

        if (priceResult.melhores_precos.length > 0) {
            console.log('Top 3 Results:');
            priceResult.melhores_precos.forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.titulo}`);
                console.log(`     Loja: ${item.loja}`);
                console.log(`     Preço: R$ ${item.preco.toFixed(2)}`);
                console.log(`     Link: ${item.link ? '✅' : '❌'}\n`);
            });
        } else {
            console.log('❌ NENHUM RESULTADO ENCONTRADO\n');
        }

        // Store for report
        results.push({
            name: testCase.name,
            intelligentResult,
            priceResult,
            success: priceResult.melhores_precos.length > 0,
            isBebida: priceResult.melhores_precos.some(p =>
                p.titulo.toLowerCase().includes('genebra') &&
                (p.titulo.toLowerCase().includes('bebida') || p.titulo.toLowerCase().includes('aperitivo'))
            )
        });

    } catch (error) {
        console.error(`\n❌ ERRO NO TESTE: ${error.message}\n`);
        results.push({
            name: testCase.name,
            error: error.message,
            success: false
        });
    }
}

// GENERATE REPORT
console.log('\n\n');
console.log('═'.repeat(60));
console.log('   RELATÓRIO FINAL');
console.log('═'.repeat(60));

let reportContent = `# Relatório de Diagnóstico: EPI Search Quality

## Resumo dos Testes

| Caso | Resultado | Problema Detectado |
|------|-----------|-------------------|
`;

results.forEach(r => {
    const status = r.success ? '✅ Sucesso' : '❌ Falha';
    const problem = r.isBebida ? '🚨 RETORNOU BEBIDA' : (r.success ? 'OK' : 'Zero resultados');
    reportContent += `| ${r.name} | ${status} | ${problem} |\n`;

    console.log(`\n${r.name}:`);
    console.log(`  Status: ${status}`);
    console.log(`  Problema: ${problem}`);
});

reportContent += `\n## Análise Detalhada\n\n`;

results.forEach((r, idx) => {
    if (r.error) {
        reportContent += `### ${r.name}\n**ERRO:** ${r.error}\n\n`;
        return;
    }

    reportContent += `### ${r.name}\n\n`;
    reportContent += `**Specs Extraídos:**\n`;
    reportContent += `- Model: \`${r.intelligentResult.specs.model || 'NENHUM'}\`\n`;
    reportContent += `- Category: \`${r.intelligentResult.specs.category || 'NENHUM'}\`\n`;
    reportContent += `- Brand: \`${r.intelligentResult.specs.brand || 'NENHUM'}\`\n\n`;
    reportContent += `**Query Gerada:** \`${r.intelligentResult.query}\`\n\n`;
    reportContent += `**Query Usada na Busca:** \`${r.priceResult.produto}\`\n\n`;
    reportContent += `**Origem:** \`${r.priceResult.origem_descricao}\`\n\n`;
    reportContent += `**Resultados:** ${r.priceResult.melhores_precos.length}\n\n`;

    if (r.isBebida) {
        reportContent += `> [!CAUTION]\n> **BUG CRÍTICO:** Sistema retornou BEBIDA ALCOÓLICA em vez de EPI!\n\n`;
    }

    if (r.priceResult.melhores_precos.length > 0) {
        reportContent += `**Top 3:**\n`;
        r.priceResult.melhores_precos.forEach((item, i) => {
            reportContent += `${i + 1}. ${item.titulo} - R$ ${item.preco.toFixed(2)} (${item.loja})\n`;
        });
        reportContent += `\n`;
    } else {
        reportContent += `> [!WARNING]\n> Nenhum resultado encontrado.\n\n`;
    }

    reportContent += `---\n\n`;
});

// Save report
const reportPath = path.join(__dirname, '..', 'epi_diagnostic_report.md');
fs.writeFileSync(reportPath, reportContent);

console.log(`\n✅ Relatório salvo em: epi_diagnostic_report.md\n`);
