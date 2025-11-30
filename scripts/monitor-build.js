const https = require('https');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';
const BUILD_ID = '692c5740c2aea28d066a0e9e';

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

async function checkBuildStatus() {
    const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${SITE_ID}/deploys/${BUILD_ID}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`
        }
    };

    const result = await httpsRequest(options);
    const deploy = JSON.parse(result.body);
    return {
        state: deploy.state,
        published_at: deploy.published_at,
        deploy_url: deploy.deploy_url
    };
}

async function waitForBuild() {
    console.log('⏳ Waiting for build to complete...\n');

    for (let i = 0; i < 60; i++) {  // Wait up to 5 minutes
        const status = await checkBuildStatus();
        console.log(`[${new Date().toLocaleTimeString()}] Build status: ${status.state}`);

        if (status.state === 'ready') {
            console.log(`\n✅ BUILD SUCCESSFUL!`);
            console.log(`Published at: ${status.published_at}`);
            console.log(`Site URL: ${status.deploy_url || 'https://lively-bubblegum-0966d6.netlify.app/'}`);
            return true;
        } else if (status.state === 'error') {
            console.log('\n❌ BUILD FAILED!');
            return false;
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    console.log('\n⏰ Timeout waiting for build.');
    return false;
}

waitForBuild();
