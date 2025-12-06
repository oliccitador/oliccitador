
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeWithFlow } from '../lib/gemini.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVerification() {
    console.log("🚀 INICIANDO SUPER VALIDAÇÃO (52 ITENS REAIS)...");

    // Load dataset
    const datasetPath = path.join(__dirname, '../pncp_real_dataset_52.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    let passed = 0;
    let failed = 0;
    const failures = [];

    console.log(`📊 Carregados ${dataset.length} itens para teste exaustivo.\n`);

    for (const [index, testCase] of dataset.entries()) {
        console.log(`\n---------------------------------------------------------`);
        console.log(`🧪 Teste ${index + 1}/${dataset.length}: [${testCase.category}] ${testCase.item}`);
        console.log(`📝 Descrição Real (Suja): "${testCase.raw_description.substring(0, 80)}..."`);

        try {
            // Run analysis (this calls Gemini with the new Cleaning Rule)
            const result = await analyzeWithFlow(testCase.raw_description);
            const cleanDesc = result.descricao_tecnica_limpa;

            if (!cleanDesc) {
                console.error(`❌ FALHA: 'descricao_tecnica_limpa' não foi gerada!`);
                failed++;
                failures.push({ item: testCase.item, reason: "Campo vazio", result });
                continue;
            }

            console.log(`✨ Descrição Limpa Gerada: "${cleanDesc}"`);

            // Verification Logic
            const missingKeywords = testCase.expected_keywords.filter(kw =>
                !cleanDesc.toLowerCase().includes(kw.toLowerCase())
            );

            const foundForbidden = testCase.forbidden_keywords.filter(fk =>
                cleanDesc.toLowerCase().includes(fk.toLowerCase())
            );

            let isSuccess = true;
            if (missingKeywords.length > 0) {
                console.error(`⚠️  Palavras-chave ausentes: ${missingKeywords.join(', ')}`);
                isSuccess = false;
            }
            if (foundForbidden.length > 0) {
                console.error(`⚠️  Lixo jurídico encontrado: ${foundForbidden.join(', ')}`);
                isSuccess = false;
            }

            // Length check (sanity check)
            if (cleanDesc.length < 10) {
                console.error(`⚠️  Descrição muito curta (<10 chars): ${cleanDesc}`);
                isSuccess = false;
            }
            if (cleanDesc.length > 600) {
                console.error(`⚠️  Descrição muito longa (>600 chars): ${cleanDesc}`);
                isSuccess = false;
            }


            if (isSuccess) {
                console.log(`✅ APROVADO`);
                passed++;
            } else {
                console.log(`❌ REPROVADO`);
                failed++;
                failures.push({
                    item: testCase.item,
                    reason: "Falha na validação de conteúdo",
                    cleanDesc,
                    missingKeywords,
                    foundForbidden
                });
            }

        } catch (error) {
            console.error(`💥 ERRO DE EXECUÇÃO:`, error.message);
            failed++;
            failures.push({ item: testCase.item, reason: "Erro de execução", error: error.message });
        }

        // Rate limit protection
        await new Promise(r => setTimeout(r, 800)); // Slightly faster than 1s to save time on 52 items
    }

    console.log(`\n=========================================================`);
    console.log(`📊 RELATÓRIO FINAL (52 ITENS)`);
    console.log(`=========================================================`);
    console.log(`✅ Aprovados: ${passed}`);
    console.log(`❌ Reprovados: ${failed}`);
    console.log(`📈 Taxa de Sucesso: ${((passed / dataset.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log(`\n🚨 ITENS COM FALHA:`);
        failures.forEach(f => {
            console.log(`\n- ${f.item}: ${f.reason}`);
            if (f.missingKeywords && f.missingKeywords.length) console.log(`  Ausentes: ${f.missingKeywords.join(', ')}`);
            if (f.foundForbidden && f.foundForbidden.length) console.log(`  Proibidas: ${f.foundForbidden.join(', ')}`);
            console.log(`  Saída: "${f.cleanDesc}"`);
        });
        process.exit(1);
    } else {
        console.log(`\n🏆 SUCESSO ABSOLUTO! O sistema está limpando perfeitamente os 52 casos reais.`);
        process.exit(0);
    }
}

runVerification();
