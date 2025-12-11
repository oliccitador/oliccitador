// Script de Validação Rigorosa do CATMAT (Simulando Produção)
import fs from 'fs';
import path from 'path';
import { consultarCATMAT } from '../lib/catmat.js'; // Importa o código REAL de produção

console.log('\n🔍 VALIDAÇÃO RIGOROSA DO MÓDULO CATMAT (M3)\n');
console.log('═══════════════════════════════════════════════════════════\n');

// 1. Carregar DB para sortear códigos (usando path relativo seguro)
const dbPath = path.join(process.cwd(), 'lib/catmat-db.json');
if (!fs.existsSync(dbPath)) {
    console.error(`❌ DB não encontrado em: ${dbPath}`);
    process.exit(1);
}

const rawDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const allKeys = Object.keys(rawDB);
console.log(`✅ Base de Dados carregada: ${allKeys.length} itens.`);

// 2. Sortear 5 códigos aleatórios
const samples = [];
for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * allKeys.length);
    const code = allKeys[randomIndex];
    samples.push({ code, expected: rawDB[code] });
}

console.log('✅ 5 Códigos de amostra selecionados aleatoriamente.\n');

// 3. Testar Integração
(async () => {
    let passed = 0;

    for (const sample of samples) {
        console.log(`🧪 Testando Código: ${sample.code}`);
        console.log(`   Esperado: ${JSON.stringify(sample.expected)}`);

        try {
            // Chama a função REAL do sistema
            const result = await consultarCATMAT(sample.code);

            // Validação
            const descriptionMatch = result.descricao === (sample.expected.d || 'Descrição não disponível');
            const classMatch = result.classe === (sample.expected.c || 'Classe não disponível');
            const statusOK = result.status === 'OK';

            if (statusOK && descriptionMatch && classMatch) {
                console.log(`   Resultado: ✅ SUCESSO (Dados idênticos)`);
                passed++;
            } else {
                console.error(`   Resultado: ❌ FALHA DE INTEGRIDADE`);
                console.error(`   Recebido: ${JSON.stringify(result, null, 2)}`);
            }

        } catch (e) {
            console.error(`   Resultado: ❌ ERRO DE EXECUÇÃO: ${e.message}`);
        }
        console.log('---');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log(`RESULTADO FINAL: ${passed}/5 APROVADOS`);

    if (passed === 5) {
        console.log('🎉 O Módulo CATMAT está 100% ÍNTEGRO e FUNCIONAL.');
    } else {
        console.error('🚨 Módulo apresenta falhas de integridade.');
        process.exit(1);
    }

})();
