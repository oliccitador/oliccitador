
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function debugToken() {
    // Hardcoded token from user request to verify validity
    const token = "APP_USR-2072404613630533-112712-64a86a417af28ed95f530cee921be8407-293397192";
    console.log('Testing Token:', token ? token.substring(0, 15) + '...' : 'NONE');
    console.log('Token Length:', token ? token.length : 0);
    if (token) {
        console.log('Char codes:', token.split('').map(c => c.charCodeAt(0)).join(', '));
    }

    if (!token) {
        console.error('No token found!');
        return;
    }

    try {
        const response = await fetch('https://api.mercadopago.com/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.status === 200) {
            console.log('✅ Token is VALID. User ID:', data.id);
        } else {
            console.log('❌ Token is INVALID or has restricted permissions.');
        }

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

debugToken();
