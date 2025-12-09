import fs from 'fs';

async function dump() {
    const url = 'https://consultaca.com/40377';
    console.log(`Baixando ${url}...`);
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const html = await response.text();
    fs.writeFileSync('ca_40377_dump.html', html);
    console.log('Salvo em ca_40377_dump.html');
}

dump();
