import { NextResponse } from 'next/server';
import { buscarMelhoresPrecos } from '../../../lib/price-search';
import { buscarMelhoresPrecosM24 } from '../../../lib/m24-quotation';

export async function POST(request) {
    try {
        const body = await request.json();
        const { query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica, use_m24 } = body;

        if (process.env.NODE_ENV !== 'production') console.log('[API/PRICES] Received request:', { query: query?.substring(0, 50), has_ca, use_m24 });

        let result;

        // Routing Logic
        if (use_m24) {
            console.log('[API/PRICES] Routing to M24 (Hybrid Engine)');
            result = await buscarMelhoresPrecosM24({
                query,
                has_ca,
                ca_numero,
                ca_descricao_tecnica,
                ca_nome_comercial,
                query_semantica
            });
        } else {
            console.log('[API/PRICES] Routing to M4 (Core Engine)');
            result = await buscarMelhoresPrecos({
                query,
                has_ca,
                ca_numero,
                ca_descricao_tecnica,
                ca_nome_comercial,
                query_semantica
            });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('[API/PRICES] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prices' },
            { status: 500 }
        );
    }
}
