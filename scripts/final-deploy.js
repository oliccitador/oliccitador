const https = require('https');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';
const ACCOUNT_ID = 'oliccitador';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcXVzcnZweWZpcm56c29jdHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTk1MjgsImV4cCI6MjA3OTYzNTUyOH0.x09aSU6SgyEu9vHJET68wxf_AEqvguBZO92BILmsvlM';

function httpsRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body, headers: res.headers });
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function setSiteEnvVar() {
    console.log('🔧 SETTING ENVIRONMENT VARIABLE VIA API\n');

    // Use the site env endpoint - different payload format
    const data = JSON.stringify({
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        values: [{
            value: SUPABASE_ANON_KEY,
            context: 'all'
        }]
    });

    console.log('Payload:', data.substring(0, 100) + '...\n');

    const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/accounts/${ACCOUNT_ID}/env`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    console.log(`Endpoint: POST https://api.netlify.com${options.path}\n`);

    try {
        const result = await httpsRequest(options, data);
        console.log(`Response Status: ${result.status}`);
        console.log(`Response Body: ${result.body}\n`);

        if (result.status === 200 || result.status === 201) {
            console.log('✅ SUCCESS! Environment variable set.');
            return true;
        } else {
            console.error('❌ FAILED to set environment variable.');
            return false;
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        return false;
    }
}

async function triggerBuild() {
    console.log('\n🚀 TRIGGERING BUILD...\n');

    const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${SITE_ID}/builds`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const result = await httpsRequest(options, JSON.stringify({ clear_cache: true }));
        if (result.status === 200 || result.status === 201) {
            const build = JSON.parse(result.body);
            console.log(`✅ Build triggered! ID: ${build.id}`);
            console.log(`\nMonitor at: https://app.netlify.com/sites/lively-bubblegum-0966d6/deploys`);
            console.log(`\nOnce complete, test at: https://lively-bubblegum-0966d6.netlify.app/`);
            return true;
        } else {
            console.error(`❌ Build trigger failed: ${result.status}`);
            return false;
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        return false;
    }
}

async function run() {
    const envSet = await setSiteEnvVar();
    if (!envSet) {
        console.log('\n⚠️  Continuing to build anyway...');
    }
    await triggerBuild();
}

run();
