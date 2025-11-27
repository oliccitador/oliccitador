import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { analyzeWithFlow } from '../../../lib/gemini';
import { getCache, setCache } from '../../../lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    console.log('DEBUG: API POST /api/analyze called');
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { description, ca, catmat } = body;
        if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

        const cacheKey = `analyze:${user.id}:${description}:${ca || 'no-ca'}:${catmat || 'no-catmat'}`;
        const cached = await getCache(cacheKey);
        if (cached) return NextResponse.json({ ...cached, cache: true });

        // Use 3-flow system
        console.log(`[API] Analyzing with 3-flow system: CA=${ca}, CATMAT=${catmat}`);
        const result = await analyzeWithFlow(description, ca, catmat);

        // Cache result
        await setCache(cacheKey, result);

        return NextResponse.json({ ...result, cache: false });

    } catch (error) {
        console.error('ERROR in /api/analyze:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
