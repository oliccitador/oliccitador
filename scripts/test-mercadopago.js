// Test Mercado Pago Integration
const MercadoPagoConfig = require('mercadopago').default;
const { Preference } = require('mercadopago');

const TEST_TOKEN = 'TEST-3083395143570139-112620-61c22ecdc134782508be4c5e964c3952-2505773059';

async function testCheckout() {
    try {
        console.log('🧪 Testing Mercado Pago Checkout...\n');

        // Initialize client
        const client = new MercadoPagoConfig({
            accessToken: TEST_TOKEN,
        });

        const preference = new Preference(client);

        // Test data
        const preferenceData = {
            items: [
                {
                    id: 'plan-basico',
                    title: 'Plano Básico - O Licitador',
                    description: 'Assinatura mensal do plano Básico com 50 análises/mês',
                    quantity: 1,
                    unit_price: 49.90,
                    currency_id: 'BRL',
                }
            ],
            payer: {
                email: 'teste@oliccitador.com.br',
            },
            back_urls: {
                success: 'https://oliccitador.com.br/obrigado',
                failure: 'https://oliccitador.com.br/pricing?payment=failed',
                pending: 'https://oliccitador.com.br/obrigado?status=pending',
            },
            auto_return: 'approved',
            statement_descriptor: 'O LICITADOR',
            metadata: {
                plan: 'basico',
                email: 'teste@oliccitador.com.br',
                quota: 50,
            },
            payment_methods: {
                excluded_payment_types: [],
                installments: 1,
            },
        };

        console.log('📦 Creating preference...');
        const result = await preference.create({ body: preferenceData });

        console.log('\n✅ SUCCESS! Checkout created:\n');
        console.log('Preference ID:', result.id);
        console.log('Checkout URL:', result.init_point);
        console.log('Sandbox URL:', result.sandbox_init_point);

        console.log('\n🎯 Next steps:');
        console.log('1. Open the sandbox URL in your browser');
        console.log('2. Use test card: 5031 4332 1540 6351 (Mastercard - APRO)');
        console.log('3. CVV: any 3 digits');
        console.log('4. Expiry: any future date\n');

        return result;

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.cause) {
            console.error('\nDetails:', JSON.stringify(error.cause, null, 2));
        }
        process.exit(1);
    }
}

testCheckout();
