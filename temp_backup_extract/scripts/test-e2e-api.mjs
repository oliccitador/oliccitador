// E2E Test - Real HTTP Request to /api/analyze
const testPayload = {
    description: `Ventilador de Transporte Pulmonar Adulto e Pediátrico * Certificação IPX4 * 
    Compatível com ambulância aérea * 17 modos de ventilação * O2 40% a 100% * 
    Compatível Mainstream EtCO2 tecnologia Respironics * Peso: 5,5 kg * Volume corrente: 20 ml`
};

console.log('🔍 Fazendo requisição POST para http://localhost:3000/api/analyze...');
console.log('Payload:', JSON.stringify(testPayload, null, 2));

try {
    const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
    });

    console.log('\n📊 STATUS:', response.status, response.statusText);

    if (response.ok) {
        const data = await response.json();
        console.log('\n✅ RESPOSTA:');
        console.log(JSON.stringify(data, null, 2));
    } else {
        const errorText = await response.text();
        console.log('\n❌ ERRO:');
        console.log(errorText);
    }
} catch (error) {
    console.error('\n❌ ERRO DE CONEXÃO:', error.message);
}
