const https = require('https');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';
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

async function setEnvVarViaBuildHook() {
    console.log('🔧 TRYING ALTERNATIVE: netlify.toml approach\n');

    // Instead of API, let's update netlify.toml with build.environment
    console.log('Creating netlify.toml with environment config...\n');

    const fs = require('fs');
    const netlifyToml = `[build]
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  included_files = ["lib/catmat-db.json"]
`;

    fs.writeFileSync('netlify.toml', netlifyToml);
    console.log('✅ netlify.toml updated with environment variable!\n');
    return true;
}

async function triggerBuild() {
    console.log('🚀 TRIGGERING BUILD...\n');

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

async function commitAndPush() {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    console.log('\n📤 Committing and pushing netlify.toml...\n');

    try {
        await execPromise('git add netlify.toml');
        await execPromise('git commit -m "Add SUPABASE_ANON_KEY to netlify.toml"');
        await execPromise('git push origin master');
        console.log('✅ Pushed to GitHub!\n');
        return true;
    } catch (err) {
        console.error('Git push error:', err.message);
        return false;
    }
}

async function run() {
    await setEnvVarViaBuildHook();
    const pushed = await commitAndPush();
    if (pushed) {
        console.log('⏳ Netlify will auto-deploy from GitHub push...\n');
        console.log('Monitor at: https://app.netlify.com/sites/lively-bubblegum-0966d6/deploys');
    }
}

run();
