const { createClient } = require('@supabase/supabase-js');

// Credentials from netlify_env_import.txt
const supabaseUrl = 'https://bcqusrvpyfirnzsoctvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcXVzcnZweWZpcm5rhRb90gVfQcm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA1OTUyOCwiZXhwIjoyMDc5NjM1NTI4fQ.4orkCV1Kl85kV3XqDUxtiusOSVPqhmH41r';

async function verify() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/catmat_data?select=count`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('❌ REST API Failed:', response.status, response.statusText);
            console.error('Response:', text);
        } else {
            console.log('✅ REST API Successful!');
            const json = await response.json();
            console.log('Data:', json);
        }
    } catch (err) {
        console.error('❌ Network Error:', err);
    }
}

verify();
