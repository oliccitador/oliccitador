import { NextResponse } from 'next/server';
import { SessionManager } from '../../../lib/whatsapp/session-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    if (!phone) {
        return NextResponse.json({ error: 'Missing phone' }, { status: 400 });
    }
    const session = await SessionManager.getSession(phone);
    return NextResponse.json(session);
}

export async function POST(request: Request) {
    const { phone, message } = await request.json();
    if (!phone || !message) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    await SessionManager.saveMessage(phone, message);
    return NextResponse.json({ status: 'ok' });
}
