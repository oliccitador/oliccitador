import { NextResponse } from 'next/server';
import { buscarMelhoresPrecos } from '../../../lib/price-search';

export async function POST(request) {
    try {
        const body = await request.json();
        const { query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica } = body;

        if (process.env.NODE_ENV !== 'production') console.log('[API/PRICES] Received request:', { query, has_ca, ca_numero });

        const result = await buscarMelhoresPrecos({
            query,
            has_ca,
            ca_numero,
            ca_descricao_tecnica,
            ca_nome_comercial,
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
