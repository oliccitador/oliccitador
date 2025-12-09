// Complete E2E Test - Price Search with SerpApi
// Tests the FULL flow: description → intelligent search → SerpApi → results
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
        console.log('✅ SERPAPI_KEY loaded from .env.local\n');
    }
}

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TESTE E2E COMPLETO: T7 VENTILATOR + SERPAPI                         ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

const t7Description = `Ventilador de Transporte Pulmonar Adulto e Pediátrico
Diferenciais
* Início rápido com autoteste automático na inicialização
* Certificação IPX4: resistente à água e intempéries
* Compatível com ambulância aérea
* Ventilação pré-configurada para adultos, crianças e bebês
* Equipamento leve e portátil, fácil de transportar
* Modo RCP conforme diretrizes da AHA & ERC
Características Técnicas
* Interface intuitiva com bloqueio de tela
* 17 modos de ventilação disponíveis
* Concentração de O₂ ajustável de 40% a 100%
* Válvula PEEP interna
* Alarmes sonoros e visuais para multiparâmetros
* Compatível com Mainstream EtCO₂ (opcional - tecnologia Respironics)
Longa autonomia de bateria
* Peso: 5,5 kg
* Volume corrente (VC): 20 ml`;

console.log('📋 Descrição Técnica:');
console.log(t7Description.substring(0, 200) + '...\n');

console.log('🔍 Executando busca completa...\n');

try {
    const result = await buscarMelhoresPrecos({
        ca_descricao_tecnica: t7Description,
        ca_nome_comercial: 'Ventilador Pulmonar T7 Amoul',
        has_ca: false
    });

    console.log('\n📊 RESULTADO COMPLETO:');
    console.log('═'.repeat(80));
    console.log(`Query Gerada: ${result.produto}`);
    console.log(`Origem: ${result.origem_descricao}`);
    console.log(`Fonte: ${result.fonte}`);
    console.log(`Resultados Encontrados: ${result.melhores_precos.length}`);
    console.log('═'.repeat(80));

    if (result.melhores_precos.length > 0) {
        console.log('\n💰 TOP 3 PREÇOS:\n');
        result.melhores_precos.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.titulo}`);
            console.log(`   Loja: ${item.loja}`);
            console.log(`   Preço: ${item.preco_formatado || `R$ ${item.preco.toFixed(2)}`}`);
            console.log(`   Link: ${item.link}`);
            console.log('');
        });

        // Validation: Check if we got specialized suppliers (not generic)
        const stores = result.melhores_precos.map(p => p.loja.toLowerCase());
        const hasSpecialized = stores.some(store =>
            store.includes('hospitalar') ||
            store.includes('med') ||
            store.includes('saude') ||
            store.includes('instramed') ||
            store.includes('dormed')
        );

        console.log('✅ VALIDAÇÃO:');
        console.log(`   Intelligent Search Ativada: ${result.origem_descricao === 'intelligent_search' ? '✅' : '❌'}`);
        console.log(`   Resultados Encontrados: ${result.melhores_precos.length >= 3 ? '✅' : '❌'}`);
        console.log(`   Fornecedores Especializados: ${hasSpecialized ? '✅' : '❌'}`);

        if (result.origem_descricao === 'intelligent_search' && result.melhores_precos.length >= 3 && hasSpecialized) {
            console.log('\n🎉 TESTE PASSOU! Resultado equivalente ao esperado.');
        } else {
            console.log('\n⚠️  TESTE PARCIAL: Resultados encontrados mas não ideais.');
        }

    } else {
        console.log('\n❌ NENHUM RESULTADO ENCONTRADO!');
        if (result.erro) {
            console.log(`   Erro: ${result.erro}`);
        }
    }

    // Save detailed report
    fs.writeFileSync('t7-test-report.json', JSON.stringify(result, null, 2));
    console.log('\n📁 Relatório completo salvo em: t7-test-report.json');

} catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error.stack);
}
