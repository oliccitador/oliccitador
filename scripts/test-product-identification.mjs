// TESTE: Identificação de Produto via Web Search (SEM CA)
// Simula o fluxo: Descrição Bruta → Limpeza → Web Search → Identificação → Cotação

import { searchGoogleAPI } from '../lib/serpapi.js';
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
console.log('   TESTE: IDENTIFICAÇÃO DE PRODUTO VIA WEB SEARCH');
console.log('═══════════════════════════════════════════════════════════\n');

// SIMULAÇÃO: O que o Gemini faria
function cleanDescription(rawDescription) {
    // Remove lixo jurídico
    let cleaned = rawDescription
        .replace(/Especificação/gi, '')
        .replace(/O produto deverá.*/gi, '')
        .replace(/conforme normas vigentes.*/gi, '')
        .replace(/Referência:.*/gi, '')
        .replace(/que atendam.*às especificações.*/gi, '')
        .trim();

    return cleaned;
}

const testCases = [
    {
        name: 'Óculos Policarbonato',
        raw: `Especificação
Óculos de proteção com armação e visor em peça única de policarbonato incolor.
Apoio nasal em resina termoplástica.
Hastes tipo espátula, confeccionadas em duas peças: uma do visor e outra em borracha (azul ou preta).
Tratamento antiembaçante.`,
        expectedProduct: 'Óculos de segurança policarbonato (similar a 3M, Kalipso, etc)'
    },
    {
        name: 'Óculos Genebra',
        raw: `Especificação
Óculos de segurança do tipo ampla visão, com armação em peça única de PVC flexível e visor de acetato incolor.
Tirante elástico ajustável e formato anatômico para cobrir toda a região ao redor dos olhos.
Referência:
Produtos com as características e qualidade igual ou superior aos do modelo Genebra, da marca KALIPSO, que atendam, no mínimo, às especificações do CA nº 39506.`,
        expectedProduct: 'Kalipso Genebra ou similar'
    },
    {
        name: 'Óculos Ampla Visão',
        raw: `Especificação
Óculos de segurança do tipo ampla visão, com armação em peça única de PVC flexível e visor de acetato incolor.
Tirante elástico ajustável e formato anatômico para cobrir toda a região ao redor dos olhos.`,
        expectedProduct: 'Óculos ampla visão PVC (similar a 3M SG-28, Kalipso Genebra, etc)'
    }
];

async function testProductIdentification(testCase) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`TESTE: ${testCase.name}`);
    console.log(`${'═'.repeat(60)}\n`);

    // STEP 1: Limpeza
    const cleaned = cleanDescription(testCase.raw);
    console.log('📋 STEP 1: Limpeza da Descrição\n');
    console.log('ANTES (primeiras 100 chars):');
    console.log(`  "${testCase.raw.substring(0, 100)}..."\n`);
    console.log('DEPOIS:');
    console.log(`  "${cleaned}"\n`);

    // STEP 2: Web Search para Identificação
    console.log('🔍 STEP 2: Busca Web para Identificação\n');

    // Monta query de identificação (palavras-chave técnicas)
    const identificationQuery = cleaned
        .split('\n')
        .filter(line => line.length > 10)
        .join(' ')
        .substring(0, 200) // Limita tamanho
        .replace(/\s+/g, ' ');

    console.log(`Query de Identificação: "${identificationQuery}"\n`);

    try {
        // Usa SerpApi Google Organic para encontrar catálogos, PDFs, sites técnicos
        const webResults = await searchGoogleAPI(identificationQuery);

        console.log(`Resultados Encontrados: ${webResults.length}\n`);

        if (webResults.length > 0) {
            console.log('Top 5 Resultados (para análise de identificação):\n');
            webResults.slice(0, 5).forEach((result, idx) => {
                console.log(`${idx + 1}. ${result.titulo}`);
                console.log(`   Fonte: ${result.loja}`);
                console.log(`   Preço: ${result.preco_formatado || 'N/A'}`);
                console.log(`   Link: ${result.link}\n`);
            });

            // SIMULA: O que a IA faria ao analisar esses resultados
            console.log('💡 ANÁLISE SIMULADA (o que Gemini faria):\n');

            const titles = webResults.map(r => r.titulo.toLowerCase());
            const brands = new Set();
            const models = new Set();

            // Detecta marcas comuns
            ['3m', 'kalipso', 'epi', 'protecamp', 'danny'].forEach(brand => {
                if (titles.some(t => t.includes(brand))) {
                    brands.add(brand);
                }
            });

            // Detecta modelos
            ['genebra', 'sg-28', 'sg28', 'ampla visão'].forEach(model => {
                if (titles.some(t => t.includes(model))) {
                    models.add(model);
                }
            });

            console.log(`  Marcas Identificadas: ${Array.from(brands).join(', ') || '(nenhuma)'}`);
            console.log(`  Modelos Identificados: ${Array.from(models).join(', ') || '(nenhum)'}\n`);

            // Monta descrição enriquecida
            let enrichedDescription = cleaned;
            if (brands.size > 0) {
                enrichedDescription += ` (Marcas de referência: ${Array.from(brands).join(', ')})`;
            }
            if (models.size > 0) {
                enrichedDescription += ` (Modelos similares: ${Array.from(models).join(', ')})`;
            }

            console.log('📝 DESCRIÇÃO TÉCNICA ENRIQUECIDA:');
            console.log(`  "${enrichedDescription}"\n`);

            console.log(`✅ Produto Esperado: ${testCase.expectedProduct}`);
            console.log(`✅ Identificação: ${brands.size > 0 || models.size > 0 ? 'SUCESSO' : 'PARCIAL'}\n`);

        } else {
            console.log('❌ NENHUM RESULTADO ENCONTRADO na busca web\n');
        }

    } catch (error) {
        console.error(`❌ ERRO na busca web: ${error.message}\n`);
    }
}

// Executa testes
(async () => {
    for (const testCase of testCases) {
        await testProductIdentification(testCase);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('   CONCLUSÃO DO TESTE');
    console.log('═'.repeat(60));
    console.log('\nEsse teste simula o fluxo que seria implementado:');
    console.log('1. ✅ Limpeza da descrição (remove lixo jurídico)');
    console.log('2. ✅ Busca web para identificação (catálogos, PDFs, sites)');
    console.log('3. ✅ Análise dos resultados (detecta marcas/modelos)');
    console.log('4. ✅ Enriquece descrição técnica');
    console.log('5. → Essa descrição enriquecida seria enviada para cotação\n');
})();
