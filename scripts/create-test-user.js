const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bcqusrvpyfirnzsoctvt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcXVzcnZweWZpcm56c29jdHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTk1MjgsImV4cCI6MjA3OTYzNTUyOH0.x09aSU6SgyEu9vHJET68wxf_AEqvguBZO92BILmsvlM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
    const email = 'teste@olicitador.com.br';
    const password = 'Teste@123';

    console.log('🔐 Criando usuário de teste...');
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('\n❌ Erro ao criar usuário:', error.message);
        console.log('\n💡 Solução: Registre-se manualmente em http://localhost:3000/register');
        console.log(`   Use o email: ${email}`);
        console.log(`   Use a senha: ${password}`);
    } else {
        console.log('\n✅ Usuário criado com sucesso!');
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Senha: ${password}`);
        console.log(`\n🌐 Acesse: http://localhost:3000/login`);
    }
}

createTestUser();
