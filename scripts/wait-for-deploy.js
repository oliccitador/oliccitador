const https = require('https');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';

function httpsRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function getLatestDeploy() {
    const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${SITE_ID}/deploys?per_page=1`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`
        }
    };

    const result = await httpsRequest(options);
    const deploys = JSON.parse(result.body);
    return deploys[0];
}

async function waitForDeploy() {
    console.log('⏳ Aguardando deploy automático do GitHub...\n');

    for (let i = 0; i < 120; i++) {  // Wait up to 10 minutes
        const deploy = await getLatestDeploy();
        const time = new Date().toLocaleTimeString();
        console.log(`[${time}] Status: ${deploy.state} | Branch: ${deploy.branch || 'N/A'}`);

        if (deploy.state === 'ready') {
            console.log(`\n✅ DEPLOY CONCLUÍDO COM SUCESSO!`);
            console.log(`URL: ${deploy.deploy_ssl_url || deploy.url}`);
            console.log(`\n🧪 Agora vou testar o site...`);
            return deploy.url;
        } else if (deploy.state === 'error') {
            console.log('\n❌ DEPLOY FALHOU!');
            console.log(`Error: ${deploy.error_message || 'Unknown'}`);
            return null;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n⏰ Timeout.');
    return null;
}

waitForDeploy().then(url => {
    if (url) {
        console.log('\n🎉 SUCESSO TOTAL! Site está no ar!');
    }
});
