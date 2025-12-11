/**
 * DESCOBERTA DE URL DE ITENS
 * Tenta múltiplas variações de URL para encontrar os itens
 */
import fetch from 'node-fetch';

async function descobrirUrl() {
    console.log("🕵️ DESCOBRINDO URL DE ITENS\n");

    // Dados de uma contratação real que sabemos que existe (do teste anterior)
    const cnpj = "87849923000109";
    const ano = "2024";
    const sequencial = "350"; // Sequencial da compra anterior
    const idPncp = "87849923000109-1-000350/2024";

    const patterns = [
        `https://pncp.gov.br/api/consulta/v1/contratacoes/${idPncp}/itens`,
        `https://pncp.gov.br/api/consulta/v1/contratacoes/${idPncp}/arquivos`, // Teste de controle
        `https://pncp.gov.br/api/consulta/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}/itens`,
        `https://pncp.gov.br/api/consulta/v1/orgaos/${cnpj}/contratacoes/${ano}/${sequencial}/itens`
    ];

    for (const url of patterns) {
        console.log(`Tentando: ${url}`);
        try {
            const res = await fetch(url);
            console.log(`   Status: ${res.status}`);
            if (res.ok) {
                console.log("   ✅ SUCESSO!");
                const data = await res.json();
                console.log(`   Itens: ${data.length}`);
                if (data.length > 0) console.log(data[0]);
                break; // Achamos!
            }
        } catch (e) {
            console.log(`   Erro: ${e.message}`);
        }
    }
}

descobrirUrl();
