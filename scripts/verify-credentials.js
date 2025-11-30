const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const NETLIFY_TOKEN = 'nfp_SdcaoVnmedKeBdYntrz19dh3NtPiKZYvce72';
const SITE_ID = 'be123d53-ba30-416d-afc5-549e66ddac5c';
const SUPABASE_KEY = 'sb_publishable_t8nr5bp9Lylw99U4QcLPcQ_XmHkSqkj';
const SUPABASE_URL = 'https://bcqusrvpyfirnzsoctvt.supabase.co';

async function testNetlify() {
    console.log('🔍 Testing Netlify Connection...');
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.netlify.com',
            path: `/api/v1/sites/${SITE_ID}/env`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NETLIFY_TOKEN}`,
                'User-Agent': 'MyApp/1.0.0'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`Netlify Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('✅ Netlify Token & Site ID are VALID.');
                resolve(true);
            } else {
                console.error('❌ Netlify Failed. Check Token or Site ID.');
                resolve(false);
            }
        });

        req.on('error', (e) => {
            console.error(`❌ Netlify Error: ${e.message}`);
            resolve(false);
        });
        req.end();
    });
}

async function testSupabase() {
    console.log('\n🔍 Testing Supabase Key...');
    console.log(`Key format check: ${SUPABASE_KEY.startsWith('ey') ? 'Looks like JWT' : 'DOES NOT look like JWT (Suspicious)'}`);

    try {
        // Direct fetch to avoid client-side validation issues
        const response = await fetch(`${SUPABASE_URL}/rest/v1/catmat_data?select=count`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            console.log('✅ Supabase Key is VALID.');
            return true;
        } else {
            console.error(`❌ Supabase Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(`Response: ${text}`);
            return false;
        }
    } catch (err) {
        console.error('❌ Supabase Network Error:', err.message);
        return false;
    }
}

async function run() {
    await testNetlify();
    await testSupabase();
}

run();
