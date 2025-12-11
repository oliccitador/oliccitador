// Test Health Function - Diagnostica configuração de ambiente
exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: {
                hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                nodeVersion: process.version,
                platform: process.platform
            },
            message: 'Netlify Function is working correctly'
        })
    };
};
