// Teste reduzido - Salva resultados em JSON
import { buscarMelhoresPrecos } from '../lib/price-search.js';
import fs from 'fs';

const testCases = [
    { id: 1, cat: "ELETRO", query: "GELADEIRA FROST FREE 400L" },
    { id: 2, cat: "ELETRO", query: "MICROONDAS 30L INOX" },
    { id: 3, cat: "ELETRONICO", query: "NOTEBOOK I5 8GB SSD" },
    { id: 4, cat: "MOVEL", query: "CADEIRA ESCRITORIO ERGONOMICA" },
    { id: 5, cat: "MEDICO", query: "CADEIRA RODAS DOBRAVEL" },
];

const results = [];
let sucessos = 0;

for (const test of testCases) {
    console.log(`Testing ${test.id}/${testCases.length}: ${test.query}`);

    try {
        const resultado = await buscarMelhoresPrecos({
            query: test.query,
            has_ca: false,
            ca_numero: null,
            ca_descricao_tecnica: null,
            ca_nome_comercial: null,
            query_semantica: test.query
        });

        const numResultados = resultado.melhores_precos?.length || 0;
        const sucesso = numResultados >= 2;

        if (sucesso) sucessos++;

        results.push({
            id: test.id,
            categoria: test.cat,
            query: test.query,
            numResultados: numResultados,
            sucesso: sucesso,
            top3: resultado.melhores_precos?.slice(0, 3).map(p => ({
                preco: p.preco_formatado,
                titulo: p.titulo.substring(0, 60),
                loja: p.loja
            })) || []
        });

        console.log(`  -> ${sucesso ? 'OK' : 'FALHA'} (${numResultados} resultados)`);

    } catch (error) {
        results.push({
            id: test.id,
            categoria: test.cat,
            query: test.query,
            erro: error.message,
            sucesso: false
        });
        console.log(`  -> ERRO: ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 1000));
}

// Salvar JSON
const report = {
    timestamp: new Date().toISOString(),
    totalTestes: testCases.length,
    sucessos: sucessos,
    taxaSucesso: ((sucessos / testCases.length) * 100).toFixed(1) + '%',
    resultados: results
};

fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));

console.log('\n=== RESUMO ===');
console.log(`Total: ${testCases.length}`);
console.log(`Sucessos: ${sucessos} (${report.taxaSucesso})`);
console.log('\nResultados salvos em test-report.json');
