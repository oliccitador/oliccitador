
// Script para validar a priorização de CA na busca de preços
import { buscarMelhoresPrecos } from '../lib/price-search.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testPriority() {
    console.log("--- INICIANDO TESTE DE PRIORIDADE CA ---");

    const params = {
        query: "Botina de Segurança Nobuck Estival", // Fallback
        has_ca: true,
        ca_numero: "40377",
        ca_nome_comercial: "BOTINA DE SEGURANÇA NOBUCK",
        ca_descricao_tecnica: "Descrição longa...",
        query_semantica: "Botina de segurança nobuck estival"
    };

    console.log("Parâmetros:", JSON.stringify(params, null, 2));

    try {
        const resultado = await buscarMelhoresPrecos(params);

        console.log("\n--- RESULTADO ---");
        console.log("Produto/Query Final:", resultado.produto);
        console.log("Fonte da Query:", resultado.origem_descricao);
        console.log("Total Preços:", resultado.melhores_precos.length);

        if (resultado.produto.includes("40377")) {
            console.log("✅ SUCESSO: O número do CA foi incluído na busca!");
        } else {
            console.warn("⚠️ AVISO: O número do CA NÃO aparece na query final (pode ser fallback).");
        }

    } catch (error) {
        console.error("Erro no teste:", error);
    }
}

testPriority();
