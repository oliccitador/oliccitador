// Test Mercado Pago Access Token
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testMercadoPago() {
    console.log("=== TESTING MERCADO PAGO ACCESS TOKEN ===\n");

    // Hardcoded token from user request (LICCITADOR V2 - TEST)
    const accessToken = "TEST-1147734153062362-112808-e028c297a84bfec677f8e80055ed040c-293397192";
    console.log("Access Token:", accessToken ? `${accessToken.substring(0, 20)}...` : "NOT FOUND");

    if (!accessToken) {
        console.error("❌ MERCADOPAGO_ACCESS_TOKEN not found in .env.local");
        return;
    }

    try {
        const client = new MercadoPagoConfig({
            accessToken: accessToken,
        });

        const preference = new Preference(client);

        console.log("\nCreating test preference...");
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'test-item',
                        title: 'Test Product',
                        quantity: 1,
                        unit_price: 10.00,
                        currency_id: 'BRL',
                    }
                ],
                payer: {
                    email: 'test@example.com',
                },
            }
        });

        console.log("\n✅ SUCCESS! Token is valid!");
        console.log("Preference ID:", result.id);
        console.log("Init Point:", result.init_point);

    } catch (error) {
        console.error("\n❌ ERROR:");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Cause:", error.cause);

        if (error.message?.includes('invalid') || error.message?.includes('token')) {
            console.log("\n⚠️  POSSIBLE ISSUES:");
            console.log("1. Token may be from TEST environment (use PRODUCTION token)");
            console.log("2. Account may need to complete verification");
            console.log("3. Token may have been revoked");
            console.log("\n📝 Check: https://www.mercadopago.com.br/developers/panel/app");
        }
    }
}

testMercadoPago();
