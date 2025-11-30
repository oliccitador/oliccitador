const https = require('https');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcXVzcnZweWZpcm56c29jdHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTk1MjgsImV4cCI6MjA3OTYzNTUyOH0.x09aSU6SgyEu9vHJET68wxf_AEqvguBZO92BILmsvlM';
const SUPABASE_URL = 'https://bcqusrvpyfirnzsoctvt.supabase.co';

async function testSupabaseKey() {
    console.log('🔍 Step 1: Verifying Supabase Key...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (response.ok || response.status === 404) {
        console.log('✅ Supabase Key is VALID!\n');
        return true;
    } else {
        console.error(`❌ Supabase Key Failed: ${response.status}`);
        return false;
    }
}

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

async function getAccountId() {
    console.log('🔍 Step 2: Getting Account ID...');
    const options = {
        hostname: 'api.netlify.com',
        path: `/api/v1/sites/${SITE_ID}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`
        }
    };

    try {
        const result = await httpsRequest(options);
        if (result.status === 200) {
            const site = JSON.parse(result.body);
            console.log(`✅ Account ID: ${site.account_slug}\n`);
            return site.account_slug;
        } else {
            console.error(`❌ Failed to get account: ${result.status}\n`);
            return null;
        }
    } catch (err) {
        console.error(`❌ Error: ${err.message}\n`);
        return null;
    }
}

async function updateNetlifyEnvVar(key, value) {
    console.log(`📝 Updating ${key} (site-level)...`);
    const data = JSON.stringify({
        return false;
    }
    } catch (err) {
    console.error(`❌ Error: ${err.message}\n`);
    return false;
}
}

async function triggerDeploy() {
    console.log('🚀 Step 4: Triggering Deployment...');
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
            console.log(`✅ Deploy triggered! Build ID: ${build.id}\n`);
            return build.id;
        } else {
            console.error(`❌ Deploy failed: ${result.status}\n`);
            return null;
        }
    } catch (err) {
        console.error(`❌ Error: ${err.message}\n`);
        return null;
    }
}

async function run() {
    console.log('🤖 AUTOMATED DEPLOYMENT SCRIPT\n');
    console.log('='.repeat(50) + '\n');

    // Step 1: Verify Supabase key
    const keyValid = await testSupabaseKey();
    if (!keyValid) {
        console.error('❌ Supabase key invalid. Aborting.');
        return;
    }

    // Step 2: Get account ID
    const accountId = await getAccountId();
    if (!accountId) {
        console.error('❌ Failed to get account ID. Aborting.');
        return;
    }

    // Step 3: Update environment variable
    console.log('📝 Step 3: Updating Netlify Environment Variables...');
    const updated = await updateNetlifyEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY);
    if (!updated) {
        console.error('❌ Failed to update env vars. Aborting.');
        return;
    }

    // Step 4: Trigger deployment
    const buildId = await triggerDeploy();
    if (!buildId) {
        console.error('❌ Failed to trigger deployment.');
        return;
    }

    console.log('='.repeat(50));
    console.log('✅ ALL STEPS COMPLETED!');
    console.log('');
    console.log('Next: Monitor the build at:');
    console.log(`https://app.netlify.com/sites/lively-bubblegum-0966d6/deploys`);
    console.log('');
    console.log('Once the build completes, test at:');
    console.log('https://lively-bubblegum-0966d6.netlify.app/');
}

run();
