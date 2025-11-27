import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    console.log('DEBUG: analyze-test POST called');
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ status: 'ok', email: user.email });
    } catch (e) {
        console.error('ERROR in analyze-test:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
