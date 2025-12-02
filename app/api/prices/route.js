import { NextResponse } from 'next/server';
import { buscarMelhoresPrecos } from '@/lib/price-search';

export async function POST(request) {
    try {
        const body = await request.json();
        const { has_ca, ca_numero, ca_descricao_tecnica, query_semantica } = body;

        console.log('[API/PRICES] Received request:', { has_ca, ca_numero, query_semantica });

        const result = await buscarMelhoresPrecos({
            has_ca,
            ca_numero,
            ca_descricao_tecnica,
            query_semantica
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('[API/PRICES] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prices' },
            { status: 500 }
        );
    }
}
