// Script para verificar qual projeto GCP a GOOGLE_API_KEY pertence
import fs from 'fs';
import path from 'path';

// Load .env.local manual
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_CX = process.env.GOOGLE_SEARCH_CX;

console.log('\n🔍 VERIFICAÇÃO DE CHAVES DE API\n');
console.log('═══════════════════════════════════════════════════════════\n');

// 1. Verificar se as chaves existem
console.log('1️⃣ VERIFICANDO EXISTÊNCIA DAS CHAVES:\n');
console.log(`   GOOGLE_API_KEY: ${API_KEY ? '✅ Configurada' : '❌ NÃO configurada'}`);
console.log(`   GOOGLE_SEARCH_CX: ${SEARCH_CX ? '✅ Configurada' : '❌ NÃO configurada'}`);

if (API_KEY) {
    console.log(`\n   Primeiros 20 caracteres: ${API_KEY.substring(0, 20)}...`);
}

console.log('\n═══════════════════════════════════════════════════════════\n');

// 2. Testar a chave com uma chamada simples à API do Gemini (que sabemos que funciona)
console.log('2️⃣ TESTANDO GOOGLE_API_KEY COM GEMINI API:\n');

if (!API_KEY) {
    console.error('   ❌ Não posso testar sem a chave.\n');
    process.exit(1);
}

async function testGeminiAPI() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Responda apenas: OK' }]
                }]
            })
        });

        if (response.ok) {
            console.log('   ✅ GOOGLE_API_KEY é VÁLIDA para Gemini API\n');
            return true;
        } else {
            const error = await response.json();
            console.error('   ❌ GOOGLE_API_KEY INVÁLIDA para Gemini API');
            console.error(`   Erro: ${error.error?.message || 'Desconhecido'}\n`);
            return false;
        }
    } catch (err) {
        console.error('   ❌ Erro ao testar Gemini API:', err.message, '\n');
        return false;
    }
}

// 3. Testar a chave com Custom Search API
async function testCustomSearchAPI() {
    console.log('3️⃣ TESTANDO GOOGLE_API_KEY COM CUSTOM SEARCH API:\n');

    if (!SEARCH_CX) {
        console.error('   ❌ GOOGLE_SEARCH_CX não configurada. Não posso testar.\n');
        return false;
    }

    const query = 'test';
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_CX}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (response.ok) {
            console.log('   ✅ CUSTOM SEARCH API ESTÁ FUNCIONANDO!\n');
            console.log(`   Resultados encontrados: ${json.items?.length || 0}\n`);
            return true;
        } else {
            console.error('   ❌ CUSTOM SEARCH API RETORNOU ERRO:\n');
            console.error(`   Status: ${response.status}`);
            console.error(`   Mensagem: ${json.error?.message || 'Desconhecido'}`);

            if (json.error?.code === 403) {
                console.error('\n   🚨 ERRO 403: API NÃO ESTÁ ATIVADA ou CHAVE NÃO TEM PERMISSÃO\n');

                if (json.error.message.includes('has not been used')) {
                    console.error('   📌 A API precisa ser ativada no projeto GCP.\n');
                    console.error('   📌 Ou você precisa aguardar a propagação (até 15 minutos).\n');
                }
            }

            console.error(`\n   Detalhes completos do erro:`);
            console.error(JSON.stringify(json.error, null, 2));
            console.log('\n');
            return false;
        }
    } catch (err) {
        console.error('   ❌ Erro ao testar Custom Search API:', err.message, '\n');
        return false;
    }
}

// Executar testes
(async () => {
    const geminiOK = await testGeminiAPI();
    const searchOK = await testCustomSearchAPI();

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 RESUMO:\n');
    console.log(`   Gemini API: ${geminiOK ? '✅ Funcionando' : '❌ Com problemas'}`);
    console.log(`   Custom Search API: ${searchOK ? '✅ Funcionando' : '❌ Com problemas'}`);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    if (!searchOK) {
        console.log('🔧 PRÓXIMOS PASSOS:\n');
        console.log('   1. Verifique se você REALMENTE ativou a Custom Search API');
        console.log('   2. Aguarde até 15 minutos para propagação');
        console.log('   3. Se o erro persistir, você pode precisar:');
        console.log('      - Criar um NOVO projeto GCP');
        console.log('      - Gerar uma NOVA chave de API');
        console.log('      - Ativar a Custom Search API no novo projeto');
        console.log('\n');
    }
})();
