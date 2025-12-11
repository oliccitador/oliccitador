// Teste M2 RADICAL - Leitura direta do .env e teste de API
import fs from 'fs';
import path from 'path';

// 1. Ler credenciais diretamente do arquivo (bypassing process.env cache)
const envContent = fs.readFileSync('.env.local', 'utf8');

// Extrair valores com regex para garantir que estamos pegando o que está escrito
const apiKeyMatch = envContent.match(/GOOGLE_SEARCH_API_KEY_M2=(.*)/);
const cxMatch = envContent.match(/GOOGLE_SEARCH_CX=(.*)/);

const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;
const CX = cxMatch ? cxMatch[1].trim() : null;

console.log('\n🧪 TESTE RADICAL M2\n');
console.log(`Chave Lida do Arquivo: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'NÃO ENCONTRADA'}`);
console.log(`CX Lido do Arquivo:   ${CX ? CX : 'NÃO ENCONTRADO'}\n`);

if (!API_KEY || !CX) {
    console.error('❌ Falha ao ler credenciais do .env.local');
    process.exit(1);
}

// 2. Fazer chamada direta (sem bibliotecas)
async function testDirect() {
    const query = 'Brasil';
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;

    console.log(`Testando URL: https://www.googleapis.com/customsearch/v1?key=...&cx=${CX}&q=...`);

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (response.ok) {
            console.log('\n🎉 SUCESSO! API RESPONDEU 200 OK');
            console.log(`Resultados: ${json.items?.length || 0}`);
            if (json.items?.[0]) {
                console.log(`Primeiro resultado: ${json.items[0].title}`);
            }
        } else {
            console.error('\n❌ ERRO NA API:');
            console.error(JSON.stringify(json.error, null, 2));
        }
    } catch (e) {
        console.error('\n❌ ERRO DE REDE:', e);
    }
}

testDirect();
