const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createWebhook() {
    try {
        console.log('Creating Webhook Endpoint...');
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: 'https://olicitador.netlify.app/api/webhooks/stripe',
            enabled_events: ['checkout.session.completed'],
        });
        console.log('Webhook created successfully!');
        console.log('Signing Secret:', webhookEndpoint.secret);
    } catch (error) {
        console.error('Error creating webhook:', error.message);
    }
}

createWebhook();
