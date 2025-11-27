const fs = require('fs');
const path = require('path');
const stripePackage = require('stripe');

// Read .env.local to get the secret key
// const envPath = path.join(__dirname, '..', '.env.local');
// const envContent = fs.readFileSync(envPath, 'utf8');

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
    console.error('Could not find STRIPE_SECRET_KEY in .env.local');
    process.exit(1);
}

const stripe = stripePackage(secretKey);

async function setupStripe() {
    console.log('Starting Stripe Setup...');

    const products = [
        {
            name: 'O Licitador - Básico',
            description: '50 análises por mês',
            price: 1990, // R$ 19,90 in cents
            metadata: { plan_code: 'basico', quota: '50' }
        },
        {
            name: 'O Licitador - Pro',
            description: '150 análises por mês',
            price: 3990, // R$ 39,90 in cents
            metadata: { plan_code: 'pro', quota: '150' }
        },
        {
            name: 'O Licitador - Premium',
            description: '1000 análises por mês',
            price: 9990, // R$ 99,90 in cents
            metadata: { plan_code: 'premium', quota: '1000' }
        }
    ];

    const results = {};

    for (const p of products) {
        console.log(`Creating product: ${p.name}...`);

        // Create Product
        const product = await stripe.products.create({
            name: p.name,
            description: p.description,
            metadata: p.metadata
        });

        // Create Price
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: p.price,
            currency: 'brl',
            recurring: { interval: 'month' },
        });

        console.log(`Created! Price ID: ${price.id}`);
        results[p.metadata.plan_code] = price.id;
    }

    console.log('\n--- SETUP COMPLETE ---');
    console.log('Add these Price IDs to your .env.local or code:');
    console.log(JSON.stringify(results, null, 2));
}

setupStripe().catch(console.error);
