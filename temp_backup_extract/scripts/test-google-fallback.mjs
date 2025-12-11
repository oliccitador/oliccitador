// Test Google Shopping Fallback
import { buscarMelhoresPrecos } from '../lib/price-search.js';

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TESTE: FALLBACK GOOGLE SHOPPING                                     ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

// Use a specific query that might yield few results on ML but should exist on Google
// "Ventilador Pulmonar T7 Amoul" is a good candidate based on the lab test
const ventiladorDesc = `Ventilador de Transporte Pulmonar Adulto e Pediátrico Diferenciais * Início rápido com autoteste automático 
na inicialização * Certificação IPX4: resistente à água e intempéries * Compatível com ambulância aérea * Ventilação 
pré-configurada para adultos, crianças e bebês * Equipamento leve e portátil, fácil de transportar * Modo RCP conforme 
diretrizes da AHA & ERC Características Técnicas * Interface intuitiva com bloqueio de tela * 17 modos de ventilação 
disponíveis * Concentração de O? ajustável de 40% a 100% * Válvula PEEP interna * Alarmes sonoros e visuais para 
multiparâmetros * Compatível com Mainstream EtCO? (opcional - tecnologia Respironics) Longa autonomia de bateria * 
Peso: 5,5 kg * Volume corrente (VC): 20 ml`;

console.log('🔍 Executando buscarMelhoresPrecos com descrição técnica (Ventilador T7)...');

try {
    const result = await buscarMelhoresPrecos({
        query: null,
        has_ca: false,
        ca_numero: null,
        ca_descricao_tecnica: ventiladorDesc,
        ca_nome_comercial: "Ventilador Pulmonar",
        query_semantica: "Ventilador Pulmonar"
    });

    console.log('\n📊 RESULTADO FINAL:');
    console.log('  Fonte:', result.fonte);
    console.log('  Resultados encontrados:', result.melhores_precos.length);

    if (result.melhores_precos.length > 0) {
        console.log('\n  🏆 TOP 3 PREÇOS:');
        result.melhores_precos.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.loja} - ${item.preco_formatado}`);
            console.log(`     Link: ${item.link.substring(0, 60)}...`);
        });
    } else {
        console.log('  ❌ Nenhum resultado encontrado.');
    }

    // Check if Google Shopping was used (inferred from logs or source)
    // Since we don't expose internal logs easily here, we rely on the console output during run

} catch (error) {
    console.error('❌ Erro:', error);
}
