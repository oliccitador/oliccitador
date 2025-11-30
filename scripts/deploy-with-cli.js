const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcXVzcnZweWZpcm56c29jdHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTk1MjgsImV4cCI6MjA3OTYzNTUyOH0.x09aSU6SgyEu9vHJET68wxf_AEqvguBZO92BILmsvlM';

async function run() {
    console.log('🤖 AUTOMATED DEPLOYMENT WITH NETLIFY CLI\n');
    console.log('='.repeat(50) + '\n');

    try {
        // Step 1: Set environment variable
        console.log('📝 Step 1: Setting NEXT_PUBLIC_SUPABASE_ANON_KEY...');
        const envCmd = `netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "${SUPABASE_ANON_KEY}" --site-id ${SITE_ID} --auth ${NETLIFY_TOKEN}`;
        const { stdout: envOut, stderr: envErr } = await execPromise(envCmd);
        if (envErr) console.error('stderr:', envErr);
        console.log(envOut);
        console.log('✅ Environment variable set!\n');

        // Step 2: Trigger deploy
        console.log('🚀 Step 2: Triggering deployment...');
        const deployCmd = `netlify deploy --build --prod --site-id ${SITE_ID} --auth ${NETLIFY_TOKEN}`;
        const { stdout: deployOut, stderr: deployErr } = await execPromise(deployCmd);
        if (deployErr) console.error('stderr:', deployErr);
        console.log(deployOut);

        console.log('\n' + '='.repeat(50));
        console.log('✅ DEPLOYMENT COMPLETED!');
        console.log('\nSite: https://lively-bubblegum-0966d6.netlify.app/');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stdout) console.log('stdout:', error.stdout);
        if (error.stderr) console.error('stderr:', error.stderr);
    }
}

run();
