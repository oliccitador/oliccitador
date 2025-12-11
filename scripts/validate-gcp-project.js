// Teste para validar qual projeto a GOOGLE_API_KEY pertence
import fs from 'fs';
import path from 'path';

// Load .env.local
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

console.log('\n🔍 VALIDAÇÃO DE PROJETO GCP\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Chaves configuradas:');
console.log(`GOOGLE_API_KEY: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NÃO CONFIGURADA'}`);
console.log(`GOOGLE_SEARCH_CX: ${SEARCH_CX || 'NÃO CONFIGURADA'}`);

console.log('\n═══════════════════════════════════════════════════════════\n');

// Teste 1: Gemini API (para identificar projeto)
console.log('1️⃣ TESTANDO GEMINI API (para identificar projeto):\n');

async function testGemini() {
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
            console.log('   ✅ GOOGLE_API_KEY é VÁLIDA\n');
            return true;
        } else {
            const error = await response.json();
            console.error('   ❌ GOOGLE_API_KEY INVÁLIDA');
            console.error(`   Erro: ${error.error?.message || 'Desconhecido'}\n`);
            return false;
        }
    } catch (err) {
        console.error('   ❌ Erro:', err.message, '\n');
        return false;
    }
}

// Teste 2: Custom Search API
console.log('2️⃣ TESTANDO CUSTOM SEARCH API:\n');

async function testCustomSearch() {
    if (!SEARCH_CX) {
        console.error('   ❌ GOOGLE_SEARCH_CX não configurada\n');
        return false;
    }

    const query = 'CA 40677 ficha técnica';
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_CX}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (response.ok) {
            console.log('   ✅ CUSTOM SEARCH API ESTÁ FUNCIONANDO!\n');
            console.log(`   Resultados encontrados: ${json.items?.length || 0}\n`);

            if (json.items && json.items.length > 0) {
                console.log('   📄 Exemplo de resultado:');
                console.log(`   Título: ${json.items[0].title}`);
                console.log(`   Link: ${json.items[0].link}\n`);
            }

            return true;
        } else {
            console.error('   ❌ CUSTOM SEARCH API RETORNOU ERRO:\n');
            console.error(`   Status: ${response.status}`);
            console.error(`   Código: ${json.error?.code || 'Desconhecido'}`);
            console.error(`   Mensagem: ${json.error?.message || 'Desconhecido'}\n`);

            if (json.error?.code === 403) {
                console.error('   🚨 ERRO 403 - Possíveis causas:');
                console.error('   1. API não está ativada no projeto correto');
                console.error('   2. Chave pertence a projeto diferente');
                console.error('   3. Aguardar propagação (até 15 minutos)\n');

                // Tentar identificar o projeto
                if (json.error?.details) {
                    const projectInfo = json.error.details.find(d => d.containerInfo);
                    if (projectInfo) {
                        console.error(`   📌 Projeto identificado no erro: ${projectInfo.containerInfo}\n`);
                    }
                }
            }

            return false;
        }
    } catch (err) {
        console.error('   ❌ Erro:', err.message, '\n');
        return false;
    }
}

// Executar testes
(async () => {
    const geminiOK = await testGemini();
    const searchOK = await testCustomSearch();

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 RESUMO:\n');
    console.log(`   Gemini API: ${geminiOK ? '✅ OK' : '❌ ERRO'}`);
    console.log(`   Custom Search API: ${searchOK ? '✅ OK' : '❌ ERRO'}`);
    console.log('\n═══════════════════════════════════════════════════════════\n');

    if (searchOK) {
        console.log('🎉 SUCESSO! M2 está funcional!\n');
        console.log('Próximos passos:');
        console.log('1. Testar na aplicação local (npm run dev)');
        console.log('2. Validar busca de CA 40677');
        console.log('3. Se tudo OK → Deploy controlado (1 único)\n');
    } else {
        console.log('⚠️ AÇÃO NECESSÁRIA:\n');
        console.log('Você ativou a Custom Search API no projeto: gen-lang-client-0037020000');
        console.log('Mas a GOOGLE_API_KEY pode pertencer a outro projeto.\n');
        console.log('Verifique se a chave pertence ao projeto gen-lang-client-0037020000\n');
    }
})();
