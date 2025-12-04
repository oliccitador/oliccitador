// Scale Test - Intelligent Search (50 Products)
import { intelligentProductSearch } from '../lib/intelligent-search.js';
import fs from 'fs';

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          TESTE DE ESCALA: PESQUISA INTELIGENTE (50 PRODUTOS)                 ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

const testCases = [
    // === MÉDICO & HOSPITALAR (1-10) ===
    { category: 'Ventilador', desc: 'Ventilador Pulmonar T7 Amoul 5,5kg 17 modos IPX4' },
    { category: 'Desfibrilador', desc: 'Desfibrilador Externo Automático DEA CMOS Drake Bifásico com bateria de lítio longa duração' },
    { category: 'Oxímetro', desc: 'Oxímetro de Pulso Portátil de Dedo com Curva Pletismográfica e Alarme MD300' },
    { category: 'Maca', desc: 'Maca Hospitalar Hidráulica com Grades Laterais e Rodízios 150mm Capacidade 250kg' },
    { category: 'Autoclave', desc: 'Autoclave Vertical 21 Litros Volare Med Digital Inox Bivolt para esterilização' },
    { category: 'Cadeira de Rodas', desc: 'Cadeira de Rodas Motorizada D1000 Dellamed Dobrável Bateria Lítio Autonomia 20km' },
    { category: 'Monitor', desc: 'Monitor Multiparâmetro 12 polegadas ECG SPO2 PNI TEMP RESP Bateria 4h' },
    { category: 'Bomba Infusão', desc: 'Bomba de Infusão Universal Volumétrica Samtronic ST550 Equipo Padrão' },
    { category: 'Eletrocautério', desc: 'Bisturi Eletrônico Eletrocautério 150W BP150 Emai Transcutâneo' },
    { category: 'Foco Cirúrgico', desc: 'Foco Cirúrgico de Teto LED 120.000 Lux Bivolt com Braço Articulado' },

    // === TI & ELETRÔNICOS (11-20) ===
    { category: 'Notebook', desc: 'Notebook Dell Latitude 3420 Intel Core i5 1135G7 8GB RAM SSD 256GB Windows 11 Pro 14"' },
    { category: 'Monitor', desc: 'Monitor Gamer LG UltraGear 27 polegadas IPS 144Hz 1ms HDMI DisplayPort HDR10' },
    { category: 'Impressora', desc: 'Impressora Multifuncional Laser Brother DCP-1617NW Wi-Fi 110V Monocromática' },
    { category: 'Servidor', desc: 'Servidor Dell PowerEdge T150 Intel Xeon E-2314 16GB RAM 2TB HDD Torre' },
    { category: 'Switch', desc: 'Switch Gigabit 24 Portas TP-Link TL-SG1024D Rack 10/100/1000 Mbps' },
    { category: 'Nobreak', desc: 'Nobreak SMS Station II 1200VA Bivolt 6 Tomadas Bateria Selada' },
    { category: 'Tablet', desc: 'Tablet Samsung Galaxy Tab S6 Lite 64GB 4GB RAM Tela 10.4" Caneta S-Pen Cinza' },
    { category: 'Projetor', desc: 'Projetor Epson PowerLite E20 3400 Lumens HDMI XGA 3LCD para salas de aula' },
    { category: 'HD Externo', desc: 'HD Externo Portátil Seagate Expansion 4TB USB 3.0 Preto STEA4000400' },
    { category: 'Webcam', desc: 'Webcam Logitech C920s Pro Full HD 1080p com Proteção de Privacidade e Microfone' },

    // === ESCRITÓRIO & PAPELARIA (21-30) ===
    { category: 'Cadeira', desc: 'Cadeira de Escritório Presidente Ergonômica Tela Mesh Preta Ajuste Lombar Relax' },
    { category: 'Fragmentadora', desc: 'Fragmentadora de Papel 12 Folhas Corte em Partículas CD Cartão 110V Menno' },
    { category: 'Quadro Branco', desc: 'Quadro Branco Magnético 120x90cm Moldura Alumínio com Kit Instalação' },
    { category: 'Calculadora', desc: 'Calculadora Científica Casio fx-82MS 240 Funções 2 Linhas Bateria' },
    { category: 'Guilhotina', desc: 'Guilhotina de Papel Facão A4 33cm Capacidade 10 Folhas Base Metal' },
    { category: 'Plastificadora', desc: 'Plastificadora Poliseladora A4 A3 Ofício Crachá Bivolt com Reverso' },
    { category: 'Rotulador', desc: 'Rotulador Eletrônico Brother PT-70BM Portátil Fita M 9mm e 12mm' },
    { category: 'Cofre', desc: 'Cofre Eletrônico Digital Senha e Chave 30x38x30cm para Notebook Documentos' },
    { category: 'Relógio Ponto', desc: 'Relógio de Ponto Biométrico Digital Henry Prism Super Fácil Homologado Portaria 1510' },
    { category: 'Ar Condicionado', desc: 'Ar Condicionado Split Inverter 12000 BTU Frio Samsung WindFree 220V' },

    // === CONSTRUÇÃO & FERRAMENTAS (31-40) ===
    { category: 'Furadeira', desc: 'Furadeira Parafusadeira Impacto Bateria 20V Dewalt DCD776C2 Maleta Carregador' },
    { category: 'Serra', desc: 'Serra Circular Manual Makita 185mm 7.1/4" 1800W 5007N 220V com Disco' },
    { category: 'Lixadeira', desc: 'Lixadeira Orbital Bosch GSS 140 220W com Coletor de Pó 127V' },
    { category: 'Betoneira', desc: 'Betoneira 400 Litros Motor 2CV Monofásico 220V CSM Rental Profissional' },
    { category: 'Escada', desc: 'Escada Articulada Multifuncional 4x3 12 Degraus Alumínio 3,39m Botafogo' },
    { category: 'Gerador', desc: 'Gerador de Energia Gasolina 3.1KVA Partida Manual TG3100CXR Toyama Bivolt' },
    { category: 'Compressor', desc: 'Compressor de Ar 24 Litros Motocompressor 8,2 Pés 2HP 110V Schulz' },
    { category: 'Trena', desc: 'Trena Laser Digital Medidor de Distância 50 Metros Bosch GLM 50 C Bluetooth' },
    { category: 'Martelete', desc: 'Martelete Perfurador Rompedor SDS Plus 800W 2.7J HR2470 Makita Maleta' },
    { category: 'EPI', desc: 'Capacete de Segurança Aba Frontal Classe B com Jugular Ajuste Carneira Branco' },

    // === DIVERSOS & GERAIS (41-50) ===
    { category: 'Geladeira', desc: 'Geladeira Frost Free Brastemp 375 Litros Inox BRM45 Duplex' },
    { category: 'Microondas', desc: 'Micro-ondas Electrolux 31 Litros Painel Integrado MI41S Prata Espelhado' },
    { category: 'Bebedouro', desc: 'Bebedouro de Coluna Esmaltec EGC35B Água Gelada e Natural Garrafão 20L Branco' },
    { category: 'Cafeteira', desc: 'Cafeteira Expresso Oster PrimaLatte II Vermelha 19 Bar Bomba Italiana Leite' },
    { category: 'Ventilador', desc: 'Ventilador de Parede 60cm Oscilante Ventisol Bivolt Grade Aço Preto 200W' },
    { category: 'Extintor', desc: 'Extintor de Incêndio Pó Químico ABC 4kg com Suporte Parede Validade 5 Anos' },
    { category: 'Pneu', desc: 'Pneu 175/70 R13 82T Formula Evo Pirelli para Carro de Passeio' },
    { category: 'Bateria Carro', desc: 'Bateria Automotiva Moura 60Ah M60GD 12V Livre de Manutenção Polo Direito' },
    { category: 'Ração', desc: 'Ração Golden Special Cães Adultos Frango e Carne 15kg Premium Especial' },
    { category: 'Papel A4', desc: 'Papel Sulfite A4 75g Chamex Branco Caixa com 10 Resmas 5000 Folhas' },
];

const results = [];
let successCount = 0;

for (const test of testCases) {
    // Use category as fallback to simulate global behavior
    const result = await intelligentProductSearch(test.desc, test.category);

    // Validation Logic
    const hasCategory = !!result.specs.category;
    const hasNumerics = result.specs.numerical.length > 0;
    const hasQuery = result.query.length > 10;
    const passed = hasCategory && hasQuery;

    if (passed) successCount++;

    results.push({
        input: test.desc,
        fallback: test.category,
        detectedCategory: result.specs.category,
        query: result.query,
        specs: result.specs,
        passed: passed
    });

    // Visual feedback for console
    console.log(`[${passed ? '✅' : '❌'}] ${test.category}: ${result.query.substring(0, 60)}...`);
}

const report = {
    total: testCases.length,
    passed: successCount,
    failed: testCases.length - successCount,
    rate: `${((successCount / testCases.length) * 100).toFixed(1)}%`,
    details: results
};

fs.writeFileSync('scale-test-report.json', JSON.stringify(report, null, 2));
console.log(`\n📊 RELATÓRIO FINAL: ${report.passed}/${report.total} (${report.rate})`);
console.log('📁 Detalhes salvos em: scale-test-report.json');
