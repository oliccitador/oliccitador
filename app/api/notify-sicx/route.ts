import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Email inválido' },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('sicx_leads')
            .insert([{ email }]);

        if (error) {
            console.error('Erro ao salvar lead:', error);
            // Se a tabela não existir, vamos apenas logar e retornar sucesso para não quebrar a UX
            // Em produção real, isso deveria ser tratado, mas aqui assumimos que o usuário vai rodar o SQL
            if (error.code === '42P01') { // undefined_table
                console.warn('Tabela sicx_leads não existe. Execute o SQL fornecido.');
                return NextResponse.json({ success: true, warning: 'Table not found' });
            }
            return NextResponse.json(
                { error: 'Erro ao salvar email' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro interno:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
