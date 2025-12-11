/**
 * DIAGNÓSTICO SIMPLIFICADO - CORRIGIDO
 * Ajustes: tamanhoPagina=10 e correção de variáveis
 */

import fetch from 'node-fetch';
import fs from 'fs';

const LOG_FILE = 'diagnostico-detalhado.log';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// Limpar log anterior
if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
}

log("=".repeat(80));
log("🔍 DIAGNÓSTICO ENDPOINT POR ENDPOINT (CORRIGIDO)");
log("=".repeat(80));

async function testar() {

    // TESTE 1: Módulo Material
    log("\n📦 TESTE 1: Buscar código CATMAT para 'COMPUTADOR PORTATIL'");
    log("-".repeat(80));

    // CORREÇÃO: tamanhoPagina=10
    const url1 = 'https://dadosabertos.compras.gov.br/modulo-material/4_consultarItemMaterial?descricaoItem=COMPUTADOR%20PORTATIL&tamanhoPagina=10';
    log(`URL: ${url1}`);

    try {
        const res1 = await fetch(url1);
        log(`Status: ${res1.status}`);

        if (res1.ok) {
            const data1 = await res1.json(); // CORREÇÃO: usar res1
            log(`✅ SUCESSO!`);
            log(`Total de resultados: ${data1.resultado?.length || 0}`);

            if (data1.resultado && data1.resultado.length > 0) {
                log(`\nPRIMEIRO ITEM COMPLETO:`);
                log(JSON.stringify(data1.resultado[0], null, 2));
            }
        } else {
            const text = await res1.text();
            log(`❌ FALHA`);
            log(`Resposta: ${text.substring(0, 300)}`);
        }
    } catch (error) {
        log(`❌ ERRO: ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 2000));

    // TESTE 2: Pesquisa de Preço
    log("\n\n💰 TESTE 2: Pesquisa de Preço (código 401838 - Notebook)");
    log("-".repeat(80));

    const url2 = 'https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?codigoItemCatalogo=401838&tamanhoPagina=10';
    log(`URL: ${url2}`);

    try {
        const res2 = await fetch(url2);
        log(`Status: ${res2.status}`);

        if (res2.ok) {
            const data2 = await res2.json();
            log(`✅ SUCESSO!`);
            log(`Total de resultados: ${data2.resultado?.length || 0}`);

            if (data2.resultado && data2.resultado.length > 0) {
                log(`\nPRIMEIRO ITEM COMPLETO:`);
                log(JSON.stringify(data2.resultado[0], null, 2));
            }
        } else {
            const text = await res2.text();
            log(`❌ FALHA`);
            log(`Resposta: ${text.substring(0, 300)}`);
        }
    } catch (error) {
        log(`❌ ERRO: ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 2000));

    // TESTE 3: API PNCP - Contratações
    log("\n\n🏛️ TESTE 3: API PNCP - Contratações Nov/2024");
    log("-".repeat(80));

    const url3 = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=20241101&dataFinal=20241130&codigoModalidadeContratacao=6&pagina=1&tamanhoPagina=10';
    log(`URL: ${url3}`);

    try {
        const res3 = await fetch(url3);
        log(`Status: ${res3.status}`);

        if (res3.ok) {
            const data3 = await res3.json();
            log(`✅ SUCESSO!`);
            log(`Total de resultados: ${data3.data?.length || data3.items?.length || 0}`);

            const items = data3.data || data3.items || [];
            if (items.length > 0) {
                log(`\nPRIMEIRO ITEM COMPLETO:`);
                log(JSON.stringify(items[0], null, 2));
            }
        } else {
            const text = await res3.text();
            log(`❌ FALHA`);
            log(`Resposta: ${text.substring(0, 300)}`);
        }
    } catch (error) {
        log(`❌ ERRO: ${error.message}`);
    }

    log("\n" + "=".repeat(80));
    log("✅ DIAGNÓSTICO CONCLUÍDO");
    log("=".repeat(80));
}

testar();
