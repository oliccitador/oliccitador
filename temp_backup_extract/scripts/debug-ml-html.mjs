// Debug script para analisar HTML do Mercado Livre (GELADEIRA)
import fs from 'fs';

const query = "GELADEIRA FROST FREE 400L";
const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

console.log(`Fetching: ${searchUrl}\n`);

try {
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9'
        }
    });

    if (!response.ok) {
        console.error(`Error: ${response.status}`);
        process.exit(1);
    }

    const html = await response.text();
    console.log(`HTML Length: ${html.length}`);

    // Salvar HTML para análise
    fs.writeFileSync('ml-debug-geladeira.html', html);
    console.log('HTML saved to ml-debug-geladeira.html');

    // Testar regex de items
    const itemRegex = /<li[^>]*class="[^"]*ui-search-layout__item[^"]*"[^>]*>(.*?)<\/li>/gs;
    const items = Array.from(html.matchAll(itemRegex));
    console.log(`\nItems found: ${items.length}`);

    if (items.length > 0) {
        console.log('\n--- Analyzing first item ---');
        const firstItem = items[0][1];
        fs.writeFileSync('ml-first-item-geladeira.html', firstItem);

        // TENTATIVA 1: Layout NOVO (Poly/Grid)
        console.log('Testing Poly Layout (Grid)...');
        const titleMatchPoly = firstItem.match(/<a[^>]*class="[^"]*poly-component__title[^"]*"[^>]*>([^<]+)<\/a>/i);
        console.log(`Poly Title: ${titleMatchPoly ? titleMatchPoly[1] : 'NO'}`);

        // TENTATIVA 2: Layout ANTIGO/LISTA (UI)
        console.log('Testing UI Layout (List)...');
        const titleMatchUI = firstItem.match(/<h2[^>]*class="[^"]*ui-search-item__title[^"]*"[^>]*>([^<]+)<\/h2>/i);
        console.log(`UI Title: ${titleMatchUI ? titleMatchUI[1] : 'NO'}`);

        // Link
        const linkMatch = firstItem.match(/href="([^"]+)"/);
        console.log(`Link found: ${linkMatch ? 'YES' : 'NO'}`);
    }

} catch (error) {
    console.error('Error:', error.message);
}
