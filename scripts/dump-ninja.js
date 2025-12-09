import fs from 'fs';

async function dump() {
    const url = 'https://consultaca.com/40377';
    console.log(`Baixando ${url} com Headers Ninja...`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        console.log(`Status: ${response.status}`);
        const html = await response.text();

        if (html.includes('Just a moment')) {
            console.log('Bloqueado pelo Cloudflare :(');
        } else {
            console.log('SUCESSO! HTML Parece limpo (ou página de erro 404 custom).');
        }

        fs.writeFileSync('ca_40377_ninja.html', html);

    } catch (e) {
        console.error("Erro fetch:", e.message);
    }
}

dump();
