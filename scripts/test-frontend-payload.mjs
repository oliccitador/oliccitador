// Test Frontend Payload Simulation
import { buscarMelhoresPrecos } from '../lib/price-search.js';

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TESTE: SIMULAÇÃO DE PAYLOAD DO FRONTEND (CORRIGIDO)                 ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

// Simulate the payload exactly as the fixed frontend sends it
// Case: T7 Ventilator (No CA detected, so ca_module is null)
const frontendPayload = {
    query: "Ventilador Pulmonar T7", // Fallback query
    has_ca: false,
    ca_numero: undefined,
    ca_nome_comercial: "Ventilador Pulmonar", // Fallback from product reference
    // CRITICAL: This is what we fixed - passing the raw description here
    ca_descricao_tecnica: `Ventilador de Transporte Pulmonar Adulto e Pediátrico Diferenciais * Início rápido com autoteste automático 
    na inicialização * Certificação IPX4: resistente à água e intempéries * Compatível com ambulância aérea * Ventilação 
    pré-configurada para adultos, crianças e bebês * Equipamento leve e portátil, fácil de transportar * Modo RCP conforme 
    diretrizes da AHA & ERC Características Técnicas * Interface intuitiva com bloqueio de tela * 17 modos de ventilação 
    disponíveis * Concentração de O? ajustável de 40% a 100% * Válvula PEEP interna * Alarmes sonoros e visuais para 
    multiparâmetros * Compatível com Mainstream EtCO? (opcional - tecnologia Respironics) Longa autonomia de bateria * 
    Peso: 5,5 kg * Volume corrente (VC): 20 ml`,
    query_semantica: "Ventilador Pulmonar T7"
};

console.log('🔍 Executando buscarMelhoresPrecos com payload simulado...');

try {
    const result = await buscarMelhoresPrecos(frontendPayload);

    console.log('\n📊 RESULTADO FINAL:');
    console.log('  Fonte:', result.fonte);
    console.log('  Origem Descrição:', result.origem_descricao); // Should be 'intelligent_search'
    console.log('  Resultados encontrados:', result.melhores_precos.length);

    if (result.origem_descricao === 'intelligent_search') {
        console.log('  ✅ SUCESSO: Intelligent Search ativada!');
    } else {
        console.log('  ❌ FALHA: Intelligent Search NÃO ativada. Origem:', result.origem_descricao);
    }

} catch (error) {
    console.error('❌ Erro:', error);
}
