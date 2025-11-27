import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        // Credenciais de teste
        if (email === 'admin@olicitador.com' && password === '2258') {
            // Token simples (poderia ser JWT em produção)
            const token = Buffer.from(`${email}:authenticated`).toString('base64');
            return NextResponse.json({ token }, { status: 200 });
        }
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    } catch (err) {
        return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
    }
}
