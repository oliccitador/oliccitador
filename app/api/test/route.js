import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Test endpoint called');

        // Test 1: cookies()
        const cookieStore = await cookies();
        console.log('Cookies obtained');

        // Test 2: environment variables
        const envCheck = {
            GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'present' : 'missing',
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
        };
        console.log('Env check:', envCheck);

        return NextResponse.json({
            status: 'ok',
            message: 'All tests passed',
            envCheck,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Test endpoint error:', error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            name: error.name,
            stack: error.stack
        }, { status: 500 });
    }
}
