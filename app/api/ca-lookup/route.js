import { NextResponse } from 'next/server';
import { buscarDadosCA } from '../../../lib/ca-real-search';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { ca } = body;

        if (!ca) {
            return NextResponse.json({ error: 'CA number is required' }, { status: 400 });
        }

        console.log(`[API] Looking up CA: ${ca}`);
        const data = await buscarDadosCA(ca);

        if (!data) {
            return NextResponse.json({ error: 'CA not found' }, { status: 404 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('[API] CA Lookup Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
