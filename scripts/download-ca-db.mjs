import https from 'https';
import fs from 'fs';
import path from 'path';

console.log('📥 Downloading official CAEPI database from MTE...');
console.log('Source: ftp://ftp.mtps.gov.br/portal/fiscalizacao/seguranca-e-saude-no-trabalho/caepi/');

// Alternative HTTP URL (some FTP servers also serve via HTTP)
const url = 'https://ftp.mtps.gov.br/portal/fiscalizacao/seguranca-e-saude-no-trabalho/caepi/tgg_export_caepi.txt';

https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`❌ Failed to download: HTTP ${res.statusCode}`);
        console.log('Trying alternative method...');

        // Try with http module or a different approach
        tryAlternativeDownload();
        return;
    }

    let data = '';
    res.setEncoding('utf8');

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`✅ Downloaded ${data.length} bytes`);
        processData(data);
    });

}).on('error', (err) => {
    console.error('❌ Download error:', err.message);
    console.log('\n💡 Tentando método alternativo via fetch...');
    tryFetch();
});

function tryFetch() {
    const url = 'http://ftp.mtps.gov.br/portal/fiscalizacao/seguranca-e-saude-no-trabalho/caepi/tgg_export_caepi.txt';

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(data => {
            console.log(`✅ Downloaded ${data.length} bytes via fetch`);
            processData(data);
        })
        .catch(err => {
            console.error('❌ Fetch error:', err.message);
            console.log('\n⚠️ Unable to download automatically.');
            console.log('Please download manually from:');
            console.log('ftp://ftp.mtps.gov.br/portal/fiscalizacao/seguranca-e-saude-no-trabalho/caepi/tgg_export_caepi.txt');
            process.exit(1);
        });
}

function processData(rawData) {
    console.log('\n🔄 Processing data...');

    const lines = rawData.split('\n').filter(line => line.trim().length > 0);
    console.log(`📊 Total lines: ${lines.length}`);

    // Parse pipe-delimited format
    // Expected columns (may vary, need to verify with actual data):
    // CA | Nome Produto | Fabricante | Descrição | Validade | Situação | etc

    const caDatabase = {};
    let processed = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) { // Skip header (line 0)
        const fields = lines[i].split('|');

        if (fields.length < 6) {
            skipped++;
            continue;
        }

        const ca = fields[0]?.trim();
        const nome = fields[1]?.trim();
        const fabricante = fields[2]?.trim();
        const descricao = fields[3]?.trim();
        const validade = fields[4]?.trim();
        const situacao = fields[5]?.trim();

        if (!ca || ca.length === 0) {
            skipped++;
            continue;
        }

        // Only store valid CAs
        if (situacao && situacao.toLowerCase().includes('valido')) {
            caDatabase[ca] = {
                ca,
                nome_produto: nome,
                fabricante,
                descricao,
                validade,
                normas: [] // This field may need to be parsed from description
            };
            processed++;
        }
    }

    console.log(`✅ Processed: ${processed} CAs`);
    console.log(`⚠️ Skipped: ${skipped} lines`);

    // Save to JSON
    const outputPath = path.join(process.cwd(), 'lib', 'caepi-db.json');
    fs.writeFileSync(outputPath, JSON.stringify(caDatabase, null, 2), 'utf8');

    console.log(`\n💾 Saved to: ${outputPath}`);
    console.log(`📦 Database size: ${Object.keys(caDatabase).length} CAs`);
    console.log('\n✨ Done!');
}

function tryAlternativeDownload() {
    console.log('Alternative download method not implemented.');
    console.log('Please try running with fetch support or download manually.');
    tryFetch();
}
