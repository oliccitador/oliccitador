import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
        }

        // Create admin client for password reset
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // BLOQUEIO: Verificar se é usuário de feedback com senha bloqueada
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.users?.find((u) => u.email === email);

        if (user?.user_metadata?.password_locked === true) {
            console.log(`🔒 Bloqueio: Tentativa de reset de senha bloqueada para usuário de feedback: ${email}`);
            return NextResponse.json({
                error: 'Senha bloqueada. Esta é uma conta de teste/feedback com senha pré-estabelecida. Entre em contato com o administrador.'
            }, { status: 403 });
        }

        // Send password reset email
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/definir-senha`
        });

        if (error) {
            console.error('Password reset error:', error);
            // Don't reveal if email exists or not (security)
            return NextResponse.json({
                message: 'Se o email estiver cadastrado, você receberá instruções de recuperação em breve.'
            });
        }

        return NextResponse.json({
            message: 'Email de recuperação enviado com sucesso!'
        });

    } catch (error: any) {
        console.error('Reset password API error:', error);
        return NextResponse.json({
            error: 'Erro ao processar solicitação'
        }, { status: 500 });
    }
}
