/**
 * SCANNER DE DESCOBERTA DE ENDPOINTS
 * Tenta descobrir onde está a busca real testando URLs comuns
 */

import fetch from 'node-fetch';

async function scanEndpoints() {
    console.log("📡 SCANNER DE ENDPOINTS DE BUSCA\n");

    const termo = "NOTEBOOK";

    const candidates = [
        // Compras.gov (Variações)
        `https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/5_consultarPrecoMaterial?descricao=${termo}`,
        `https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/busca?termo=${termo}`,

        // PNCP (Variações Search)
        `https://pncp.gov.br/api/search/v1/items?q=${termo}`,
        `https://pncp.gov.br/api/consulta/v1/itens?q=${termo}`,
        `https://pncp.gov.br/api/consulta/v1/itens/busca?termo=${termo}`,

        // PNCP (Atas - Novamente, com variação)
        `https://pncp.gov.br/api/consulta/v1/atas?objeto=${termo}`,
    ];

    for (const url of candidates) {
        try {
            const res = await fetch(url);
            console.log(`[${res.status}] ${url}`);
            if (res.ok) {
                console.log("   ✅ SUCESSO! Conteúdo encontrado.");
                const txt = await res.text();
                // Tenta parsear pra ver se tem dados
                try {
                    const json = JSON.parse(txt);
                    console.log(`   Items: ${Array.isArray(json) ? json.length : (json.data?.length || 0)}`);
                } catch (e) { console.log("   (Não é JSON)"); }
            }
        } catch (e) {
            console.log(`[ERR] ${url}: ${e.message}`);
        }
    }
}

scanEndpoints();
