import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.SERPAPI_KEY;

        // Step 1: Check if API key exists
        if (!apiKey) {
            return NextResponse.json({
                status: 'ERROR',
                message: 'SERPAPI_KEY not found in environment variables',
                env_check: {
                    SERPAPI_KEY: '❌ NOT SET',
                    NODE_ENV: process.env.NODE_ENV
                }
            }, { status: 500 });
        }

        // Step 2: Test simple API call
        const testQuery = 'capacete seguranca';
        const params = new URLSearchParams({
            engine: "google_shopping",
            q: testQuery,
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: apiKey
        });

        const apiUrl = `https://serpapi.com/search.json?${params.toString()}`;

        console.log('[TEST-SERPAPI] Making test request...');
        const response = await fetch(apiUrl);

        // Step 3: Check response status
        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
                status: 'API_ERROR',
                message: 'SerpAPI returned error',
                http_status: response.status,
                error_body: errorText,
                api_key_length: apiKey.length,
                api_key_preview: `${apiKey.substring(0, 8)}...`
            }, { status: response.status });
        }

        const data = await response.json();

        // Step 4: Return diagnostic info
        return NextResponse.json({
            status: 'SUCCESS',
            message: 'SerpAPI is working correctly',
            env_check: {
                SERPAPI_KEY: '✅ SET',
                NODE_ENV: process.env.NODE_ENV,
                api_key_length: apiKey.length
            },
            api_response: {
                search_metadata: data.search_metadata,
                result_count: data.shopping_results?.length || 0,
                first_result: data.shopping_results?.[0] || null
            }
        });

    } catch (error) {
        return NextResponse.json({
            status: 'EXCEPTION',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
