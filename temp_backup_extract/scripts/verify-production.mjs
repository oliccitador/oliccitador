/**
 * VERIFICAÇÃO DE PRODUÇÃO (8 GRUPOS)
 * Testa a API de preços em produção real
 */

import fetch from 'node-fetch';

const URL_PROD = "https://oliccitador.com.br";

async function testeProducao() {
    console.log(`🚀 INICIANDO BATERIA DE 8 TESTES EM PRODUÇÃO`);
    console.log(`🎯 Alvo: ${URL_PROD}\n`);

    const casos = [
        { grupo: "1. Informática", query: "Notebook Core i7 16GB SSD 512GB", desc: "Notebook alto desempenho" },
        { grupo: "2. Veículos", query: "Pneu 175/70 R13", desc: "Pneu para carros leves" },
        { grupo: "3. Mobiliário", query: "Cadeira Giratória Executiva", desc: "Cadeira escritório" },
        { grupo: "4. Alimentos", query: "Café em pó 500g", desc: "Café tradicional" },
        { grupo: "5. Limpeza", query: "Água Sanitária 5 Litros", desc: "Material de limpeza" },
        { grupo: "6. Saúde", query: "Luva de Procedimento Látex M", desc: "Material hospitalar" },
        { grupo: "7. Construção", query: "Cimento CP II 50kg", desc: "Material construção" },
        { grupo: "8. Item Raro", query: "Drone Fotogrametria Profissional", desc: "Equipamento específico" }
    ];

    let sucessos = 0;

    for (const caso of casos) {
        process.stdout.write(`⏳ Testando ${caso.grupo} ("${caso.query}")... `);

        try {
            const start = Date.now();
            const res = await fetch(`${URL_PROD}/api/prices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: caso.query,
                    start_time: Date.now() // Telemetria simples
                })
            });

            const duration = (Date.now() - start) / 1000;

            if (res.ok) {
                const data = await res.json();

                const googleCount = data.melhores_precos?.length || 0;
                const pncpCount = data.referencias_governamentais?.length || 0;

                console.log(`✅ OK (${duration.toFixed(1)}s)`);
                console.log(`   🛒 Google: ${googleCount} itens | 🏛️ PNCP: ${pncpCount} itens`);

                if (googleCount > 0) {
                    console.log(`      Ex: ${data.melhores_precos[0].titulo.substring(0, 40)}... - R$ ${data.melhores_precos[0].preco}`);
                }

                if (pncpCount > 0) {
                    const pncpItem = data.referencias_governamentais[0];
                    console.log(`      Ex: [${pncpItem.fonte}] ${pncpItem.descricao.substring(0, 40)}... - R$ ${pncpItem.preco}`);
                } else {
                    console.log(`      ⚠️ PNCP vazio (Fallback pode não ter achado ou filtrado)`);
                }

                sucessos++;

            } else {
                console.log(`❌ ERRO HTTP ${res.status}`);
            }

        } catch (e) {
            console.log(`❌ EXCEÇÃO: ${e.message}`);
        }

        console.log("-".repeat(50));
        // Pause para não estourar rate limit (se houver)
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n📊 RELATÓRIO FINAL: ${sucessos}/8 Testes Concluídos com Sucesso HTTP.`);
}

testeProducao();
