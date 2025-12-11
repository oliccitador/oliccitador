const { createClient } = require('@supabase/supabase-js');

// Configuração
const supabaseUrl = 'https://bcqusrvpyfirnzsoctvt.supabase.co';
// A chave será passada via variável de ambiente ou editada aqui
const supabaseKey = process.env.SUPABASE_KEY;

async function verifyAuth() {
    console.log('🔍 Iniciando Teste Técnico de Login...');
    console.log('URL:', supabaseUrl);

    if (!supabaseKey) {
        console.error('❌ ERRO: Nenhuma chave API fornecida (process.env.SUPABASE_KEY vazia).');
        return;
    }

    console.log('🔑 Testando chave:', supabaseKey.substring(0, 10) + '...');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Tentativa de login com credenciais falsas
    // O objetivo é ver QUAL erro o Supabase devolve.
    console.log('⚡ Tentando autenticar usuário teste...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'teste_tecnico@exemplo.com',
        password: 'senha_errada_propositalmente'
    });

    if (error) {
        console.log('\n--- RESULTADO ---');
        if (error.message.includes('Invalid login credentials')) {
            console.log('✅ SUCESSO! A Chave API é VÁLIDA.');
            console.log('   (O Supabase aceitou a chave, processou o pedido e respondeu que a senha estava errada. Isso é o esperado.)');
        } else if (error.message.includes('Invalid API key')) {
            console.error('❌ FALHA: A Chave API é INVÁLIDA.');
            console.error('   (O Supabase rejeitou a conexão antes mesmo de verificar a senha.)');
        } else {
            console.log('⚠️ Outro erro:', error.message);
            console.log('   (Verifique se o serviço Auth está ativo no Supabase).');
        }
    } else {
        console.log('❓ Algo estranho aconteceu (Login funcionou com senha falsa?)');
    }
}

verifyAuth();
