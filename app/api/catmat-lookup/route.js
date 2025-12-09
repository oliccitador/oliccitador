import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache global para evitar recarregamento do JSON de 46MB em lambdas quentes
let catmatDB = global.catmatDB || null;

function loadDB() {
    if (catmatDB) return;

    console.log('[CATMAT-API] Loading DB from disk...');
    try {
        const filePath = path.join(process.cwd(), 'lib', 'catmat-db.json');

        // Em Vercel/Netlify, o arquivo pode estar em outro lugar.
        // Adicionar fallback paths se necessário

        const raw = fs.readFileSync(filePath, 'utf8');
        catmatDB = JSON.parse(raw);
        global.catmatDB = catmatDB; // Persist in global scope
        console.log(`[CATMAT-API] DB Loaded. ${Object.keys(catmatDB).length} items.`);
    } catch (error) {
        console.error('[CATMAT-API] Error loading DB:', error);
        throw new Error('Database not available');
    }
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Garante que o DB está carregado
        loadDB();

        const cleanQuery = query.toString().trim();
        const results = [];

        // ESTRATÉGIA DE BUSCA

        // 1. Busca Exata por Código (Se for numérico)
        if (/^\d+$/.test(cleanQuery)) {
            const item = catmatDB[cleanQuery];
            if (item) {
                results.push({
                    codigo: cleanQuery,
                    descricao: item.d,
                    classe: item.c,
                    unidade: item.u || 'UN', // Fallback se não existir
                    match_type: 'exact_code'
                });
            }
        }

        // 2. Busca Textual (Scan - Expensive but necessary)
        // Só executa se não achou por código OU se o usúario pediu texto explicitamente
        if (results.length === 0 && cleanQuery.length > 2) {
            const searchTerms = cleanQuery.toUpperCase().split(' ').filter(t => t.length > 1);

            // Limitar a varredura se possível, ou scan com break
            let count = 0;
            const maxResults = 20;

            for (const [code, item] of Object.entries(catmatDB)) {
                if (count >= maxResults) break;

                const text = (item.d + ' ' + (item.c || '')).toUpperCase();

                // Verifica se TODOS os termos estão presentes
                const match = searchTerms.every(term => text.includes(term));

                if (match) {
                    results.push({
                        codigo: code,
                        descricao: item.d,
                        classe: item.c,
                        unidade: item.u || 'UN',
                        match_type: 'text_match'
                    });
                    count++;
                }
            }
        }

        return NextResponse.json({
            query: cleanQuery,
            results: results,
            total: results.length
        });

    } catch (error) {
        console.error('[CATMAT-API] Error processing request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
