
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLocalhostValidation() {
    console.log("🚀 INICIANDO VALIDAÇÃO LOCALHOST (20 ITENS ORIGINAIS)...\n");
    console.log("📍 Target: http://localhost:3000/api/analyze\n");

    // Load dataset
    const datasetPath = path.join(__dirname, '../pncp_real_dataset_20.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    let passed = 0;
    let failed = 0;
    const failures = [];
    const results = [];

    console.log(`📊 Dataset carregado: ${dataset.length} itens\n`);
    console.log("=".repeat(80));

    for (const [index, testCase] of dataset.entries()) {
        console.log(`\n🧪 TESTE ${index + 1}/${dataset.length}: [${testCase.category}] ${testCase.item}`);
        console.log(`📝 Descrição: "${testCase.raw_description.substring(0, 60)}..."`);

        try {
            // Call localhost API
            const response = await fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: testCase.raw_description
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const cleanDesc = result.descricao_tecnica_limpa;

            if (!cleanDesc) {
                console.error(`❌ FALHA: Campo 'descricao_tecnica_limpa' ausente!`);
                failed++;
                failures.push({
                    item: testCase.item,
                    reason: "Campo vazio na resposta da API",
                    response: result
                });
                continue;
            }

            console.log(`✨ Resposta recebida: "${cleanDesc.substring(0, 80)}..."`);

            // Verification Logic (same as automated test)
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

            // Length check
            if (cleanDesc.length < 10) {
                console.error(`⚠️  Descrição muito curta (<10 chars)`);
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
                    category: testCase.category,
                    cleanDesc,
                    missingKeywords,
                    foundForbidden
                });
            }

            results.push({
                index: index + 1,
                item: testCase.item,
                category: testCase.category,
                status: isSuccess ? "PASS" : "FAIL",
                cleanDesc: cleanDesc
            });

        } catch (error) {
            console.error(`💥 ERRO NA REQUISIÇÃO:`, error.message);
            failed++;
            failures.push({
                item: testCase.item,
                reason: "Erro de requisição",
                error: error.message
            });
        }

        // Rate limit (give API time to breathe)
        await new Promise(r => setTimeout(r, 500));
    }

    console.log("\n" + "=".repeat(80));
    console.log(`📊 RELATÓRIO FINAL - VALIDAÇÃO LOCALHOST`);
    console.log("=".repeat(80));
    console.log(`✅ Aprovados: ${passed}`);
    console.log(`❌ Reprovados: ${failed}`);
    console.log(`📈 Taxa de Sucesso: ${((passed / dataset.length) * 100).toFixed(1)}%`);
    console.log(`🎯 Endpoint: http://localhost:3000/api/analyze`);

    if (failed > 0) {
        console.log(`\n🚨 ITENS COM FALHA:`);
        failures.forEach((f, idx) => {
            console.log(`\n${idx + 1}. ${f.item} (${f.category || 'N/A'})`);
            if (f.reason) console.log(`   Razão: ${f.reason}`);
            if (f.missingKeywords?.length) console.log(`   ⚠️  Ausentes: ${f.missingKeywords.join(', ')}`);
            if (f.foundForbidden?.length) console.log(`   ⚠️  Proibidas: ${f.foundForbidden.join(', ')}`);
            if (f.cleanDesc) console.log(`   📝 Saída: "${f.cleanDesc.substring(0, 100)}..."`);
        });
    }

    // Save detailed results to file
    const reportPath = path.join(__dirname, '../localhost_validation_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: 'http://localhost:3000/api/analyze',
        total: dataset.length,
        passed,
        failed,
        successRate: ((passed / dataset.length) * 100).toFixed(1) + '%',
        results,
        failures
    }, null, 2));

    console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);

    if (failed > 0) {
        console.log(`\n❌ Validação FALHOU! ${failed} itens não passaram no teste.`);
        process.exit(1);
    } else {
        console.log(`\n🏆 SUCESSO TOTAL! Todos os 20 itens do dataset original passaram na validação localhost!`);
        console.log(`✅ O frontend está 100% consistente com os testes automatizados.`);
        process.exit(0);
    }
}

runLocalhostValidation().catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
