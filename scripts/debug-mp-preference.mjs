
import fetch from 'node-fetch';

const token = "APP_USR-1147734153062362-112808-e90518519c87ad16900b07821a6f40a6-2933979192";

async function testPreference() {
    console.log('Testing Preference Creation...');

    const url = 'https://api.mercadopago.com/checkout/preferences';
    const body = {
        items: [
            {
                title: 'Test Product',
                quantity: 1,
                currency_id: 'BRL',
                unit_price: 10.0
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        console.log('HTTP Status:', response.status);
        const text = await response.text();
        console.log('Body:', text.substring(0, 300));

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testPreference();
