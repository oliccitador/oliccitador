const https = require('https');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';

function httpsRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body, headers: res.headers });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function getLatestDeployLogs() {
    console.log('🔍 Fetching latest deploy...');

    // Get latest deploy
    const deployOptions = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${SITE_ID}/deploys?per_page=1`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`
        }
    };

    const deployResult = await httpsRequest(deployOptions);
    if (deployResult.status !== 200) {
        console.error(`❌ Failed to fetch deploys. Status: ${deployResult.status}`);
        return;
    }

    const deploys = JSON.parse(deployResult.body);
    const latestDeploy = deploys[0];

    console.log('Latest Deploy Info:');
    console.log(`  ID: ${latestDeploy.id}`);
    console.log(`  State: ${latestDeploy.state}`);
    console.log(`  Error: ${latestDeploy.error_message || 'N/A'}`);
    console.log(`  Created: ${latestDeploy.created_at}`);
    console.log('');

    // Get build log
    console.log(`🔍 Fetching logs for deploy ${latestDeploy.id}...`);
    const logOptions = {
        hostname: 'api.netlify.com',
        path: `/api/v1/deploys/${latestDeploy.id}/log`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`
        }
    };

    const logResult = await httpsRequest(logOptions);

    if (logResult.status !== 200) {
        console.error(`❌ Failed to fetch logs. Status: ${logResult.status}`);
        console.error('Response Body:', logResult.body);
        return;
    }

    // Find error lines
    const logLines = logResult.body.split('\n');
    const errorLines = [];

    for (let i = 0; i < logLines.length; i++) {
        const line = logLines[i];
        if (line.includes('error') || line.includes('Error') || line.includes('ERROR') ||
            line.includes('failed') || line.includes('Failed') || line.includes('FAILED')) {
            // Get context (5 lines before and after)
            const start = Math.max(0, i - 5);
            const end = Math.min(logLines.length, i + 5);
            errorLines.push(`\n--- Error Context (line ${i}) ---`);
            for (let j = start; j < end; j++) {
                errorLines.push(`${j === i ? '>>> ' : '    '}${logLines[j]}`);
            }
        }
    }

    if (errorLines.length > 0) {
        console.log('ERROR DETAILS:');
        console.log(errorLines.slice(0, 50).join('\n')); // Limit output
    } else {
        console.log('No specific error found. Showing last 50 lines:');
        console.log(logLines.slice(-50).join('\n'));
    }
}

getLatestDeployLogs();
