// Test Global Fallback Logic (EPI Case)
// Ensures semantic query is used when Intelligent Search fails to identify specific specs

import { buscarMelhoresPrecos } from '../lib/price-search.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/SERPAPI_KEY=(.+)/);
    if (match) {
        process.env.SERPAPI_KEY = match[1].trim();
    }
}

// SIMULATED PAYLOAD (from Frontend) for "Capacete"
const epiPayload = {
    // Description is clear but category "CAPACETE" might be missing in dictionary
    ca_descricao_tecnica: `Capacete de segurança classe B, com aba frontal tipo II, moldado em polietileno de alta resistência.
Suspensão com quatro ou seis pontos de fixação, com tiras em tecido e carneira em polietileno.
Tira de absorção de suor removível e lavável.
O produto deverá atender às exigências de segurança previstas nas normas vigentes.`,

    // Frontend now sends EMPTY string instead of "Produto"
    ca_nome_comercial: '',

    has_ca: false,

    // This MUST be the chosen query
    query_semantica: 'Capacete Segurança Classe B Aba Frontal Polietileno'
};

console.log('🧪 TESTE DE FALLBACK SEMÂNTICO (EPI)');
console.log('--------------------------------------------------');
console.log('Payload Simulado:', epiPayload);
console.log('--------------------------------------------------\n');

try {
    const result = await buscarMelhoresPrecos(epiPayload);

    console.log('\n📊 RESULTADO:');
    console.log(`Query Final Usada: "${result.produto}"`);
    console.log(`Origem da Query: "${result.origem_descricao}"`);
    console.log(`Fonte de Dados: "${result.fonte}"`);

    // VALIDAÇÃO
    const usedSemantic = result.produto === epiPayload.query_semantica;
    const originCorrect = result.origem_descricao === 'semantic_over_intelligent_generic' || result.origem_descricao === 'intelligent_fallback_semantic';

    console.log('\n🔍 ANÁLISE DO TESTE:');
    if (usedSemantic) {
        console.log('✅ SUCESSO! Sistema usou Query Semântica.');
    } else {
        console.log(`❌ FALHA! Sistema usou: "${result.produto}"`);
    }

    if (result.melhores_precos.length > 0) {
        console.log(`✅ Retornou ${result.melhores_precos.length} preços.`);
        console.log('Top 3:');
        result.melhores_precos.slice(0, 3).forEach(p => console.log(`   - ${p.titulo} (R$ ${p.preco})`));
    } else {
        console.log('⚠️ Nenhum preço encontrado (pode ser esperado dependendo da API, mas a query importa mais).');
    }

} catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
}
