// Debug script for Market Search
// Debug script for Market Search
// require('dotenv').config({ path: '.env.local' }); 

// Mock fetch if running in node environment without global fetch (older node versions)
// But recent node has fetch. Let's assume node 18+

const MERCADO_LIVRE_API_KEY = process.env.MERCADO_LIVRE_API_KEY || "7g9DGsllzCxQiH3IE3uIBCKS41ZGZNTT";

async function searchMercadoLivre(query) {
    console.log(`[DEBUG] Searching ML for: "${query}"`);
    console.log(`[DEBUG] Using API Key: ${MERCADO_LIVRE_API_KEY ? 'Yes (configured)' : 'No'}`);

    try {
        const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=5`;
        console.log(`[DEBUG] URL: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`[DEBUG] Response Status: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`[DEBUG] Error Body: ${text}`);
            return;
        }

        const data = await response.json();
        console.log(`[DEBUG] Results Found: ${data.results?.length || 0}`);

        if (data.results && data.results.length > 0) {
            console.log('[DEBUG] First Item:', JSON.stringify(data.results[0], null, 2));
        }

    } catch (error) {
        console.error('[DEBUG] Exception:', error);
    }
}

// Test with a simple query
searchMercadoLivre("Luva de segurança");
