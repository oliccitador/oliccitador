/**
 * SerpApi Integration
 * Uses SerpApi.com for reliable Google Shopping results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if SERPAPI_KEY not in environment
if (!process.env.SERPAPI_KEY) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/SERPAPI_KEY=(.+)/);
        if (match) {
            process.env.SERPAPI_KEY = match[1].trim();
        }
    }
}

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search.json';

/**
 * Search Google Shopping via SerpApi
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of products { titulo, preco, loja, link }
 */
export async function searchGoogleShoppingAPI(query) {
    if (!SERPAPI_KEY) {
        console.error('[SERPAPI] API Key not configured');
        return [];
    }

    try {
        console.log(`[SERPAPI] Searching: "${query}"`);

        const params = new URLSearchParams({
            engine: "google_shopping",
            q: query,
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: SERPAPI_KEY
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SERPAPI] API Error ${response.status}: ${errorText}`);
            return [];
        }

        const data = await response.json();
        const results = [];

        const shoppingResults = data.shopping_results || [];
        console.log(`[SERPAPI] Raw shopping_results count: ${shoppingResults.length}`);

        if (shoppingResults.length > 0) {
            console.log(`[SERPAPI] First item keys:`, Object.keys(shoppingResults[0]));
        }

        for (const item of shoppingResults.slice(0, 10)) {
            // FILTRO: Ignorar produtos usados/recondicionados
            if (item.second_hand_condition) {
                console.log(`[SERPAPI] ⏭️ Ignorando (usado): ${item.title?.substring(0, 40)}...`);
                continue;
            }

            // FILTRO: Palavras-chave de produtos usados no título
            const tituloLower = (item.title || '').toLowerCase();
            const palavrasUsado = ['usado', 'recondicionado', 'refurbished', 'seminovo', 'segunda mao'];
            if (palavrasUsado.some(palavra => tituloLower.includes(palavra))) {
                console.log(`[SERPAPI] ⏭️ Ignorando (palavra usado): ${item.title?.substring(0, 40)}...`);
                continue;
            }

            // Try multiple price fields
            let priceStr = item.price || item.extracted_price || '';

            console.log(`[SERPAPI] Item: ${item.title?.substring(0, 40)}... | Price: ${priceStr}`);

            if (priceStr) {
                // Price usually comes as "R$ 1.234,56" or just a number
                const cleanPrice = String(priceStr).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
                const priceVal = parseFloat(cleanPrice);

                if (priceVal && !isNaN(priceVal) && priceVal > 0) {
                    results.push({
                        titulo: item.title,
                        preco: priceVal,
                        preco_formatado: typeof priceStr === 'string' ? priceStr : `R$ ${priceVal.toFixed(2)}`,
                        loja: item.source || item.merchant?.name || 'Loja Online',
                        link: item.product_link || item.link,
                        fonte: 'serpapi_shopping'
                    });
                    console.log(`[SERPAPI] ✅ Added: ${item.title?.substring(0, 30)}... - R$ ${priceVal}`);
                }
            }
        }

        console.log(`[SERPAPI] Found ${results.length} valid results`);
        return results;

    } catch (error) {
        console.error('[SERPAPI] Error:', error.message);
        return [];
    }
}

/**
 * Fallback: Direct Google Search via SerpApi
 */
export async function searchGoogleAPI(query) {
    if (!SERPAPI_KEY) {
        return [];
    }

    try {
        console.log(`[SERPAPI] Google Search: "${query}"`);

        const params = new URLSearchParams({
            engine: "google",
            q: query + " preço comprar",
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: SERPAPI_KEY
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);
        const data = await response.json();
        const results = [];

        const organicResults = data.organic_results || [];

        for (const item of organicResults.slice(0, 5)) {
            // Try to extract price from rich snippet or snippet
            let priceVal = null;
            let priceStr = '';

            // Check for rich snippet price
            if (item.rich_snippet?.top?.detected_extensions?.price) {
                priceVal = item.rich_snippet.top.detected_extensions.price;
                priceStr = `R$ ${priceVal}`;
            }
            // Regex on snippet
            else if (item.snippet) {
                const match = item.snippet.match(/R\$\s*([\d.,]+)/);
                if (match) {
                    priceStr = match[0];
                    priceVal = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
                }
            }

            if (priceVal) {
                results.push({
                    titulo: item.title,
                    preco: priceVal,
                    preco_formatado: priceStr,
                    loja: new URL(item.link).hostname.replace('www.', ''),
                    link: item.link,
                    fonte: 'serpapi_google'
                });
            }
        }

        return results;

    } catch (error) {
        console.error('[SERPAPI] Google Search Error:', error.message);
        return [];
    }
}

/**
 * Generic Web Search (M2 / Verification)
 * Returns organic results with snippets for technical analysis
 */
export async function searchGoogleWeb(query) {
    if (!SERPAPI_KEY) {
        console.error('[SERPAPI] API Key not configured for Web Search');
        return {};
    }

    try {
        console.log(`[SERPAPI] Web Searching: "${query}"`);

        const params = new URLSearchParams({
            engine: "google",
            q: query,
            google_domain: "google.com.br",
            gl: "br",
            hl: "pt-br",
            api_key: SERPAPI_KEY
        });

        const response = await fetch(`${BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            console.error(`[SERPAPI] Web API Error: ${response.status}`);
            return {};
        }

        const data = await response.json();

        // Map and FILTER to Brazilian sites only
        const allItems = (data.organic_results || []).map(r => ({
            title: r.title,
            snippet: r.snippet,
            link: r.link
        }));

        // Filter: Keep only Brazilian domains and known BR marketplaces
        const items = allItems.filter(item => {
            if (!item.link) return false;
            const url = item.link.toLowerCase();

            // Accept .br domains
            if (url.includes('.br')) return true;

            // Accept known Brazilian sites (even without .br)
            const brSites = ['mercadolivre.com', 'americanas.com', 'magazineluiza.com',
                'casasbahia.com', 'extra.com', 'consultaca.com'];
            return brSites.some(site => url.includes(site));
        });

        console.log(`[SERPAPI] Filtered ${allItems.length} -> ${items.length} Brazilian results`);
        return { items };

    } catch (error) {
        console.error('[SERPAPI] Web Search Error:', error.message);
        return {};
    }
}
