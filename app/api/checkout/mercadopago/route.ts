import { NextResponse } from 'next/server';
import MercadoPagoConfig, { Preference } from 'mercadopago';

export const dynamic = 'force-dynamic';

// Plan configuration - Black Friday prices
const PLANS = {
    basico: {
        name: 'Básico',
        price: 19.90,
        quota: 50
    },
    pro: {
        name: 'Pro',
        price: 39.90,
        quota: 150
    },
    premium: {
        name: 'Premium',
        price: 99.90,
        quota: 1000
    }
};

export async function POST(request: Request) {
    try {
        // 1. Get plan and email from request
        const body = await request.json();
        const { plan, email } = body;

        if (!plan || !email) {
            return NextResponse.json({ error: 'Plan and email are required' }, { status: 400 });
        }

        if (!PLANS[plan as keyof typeof PLANS]) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS];

        // 2. Initialize Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
        });

        const preference = new Preference(client);

        // 3. Create preference (One-time payment)
        const preferenceData = {
            items: [
                {
                    id: `plan-${plan}`,
                    title: `Plano ${selectedPlan.name} - O Licitador (30 dias)`,
                    description: `Acesso por 30 dias ao plano ${selectedPlan.name} com ${selectedPlan.quota} análises`,
                    quantity: 1,
                    unit_price: selectedPlan.price,
                    currency_id: 'BRL',
                }
            ],
            payer: {
                email: email,
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/obrigado`,
                failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/pricing?payment=failed`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/obrigado?status=pending`,
            },
            auto_return: 'approved' as const,
            statement_descriptor: 'O LICITADOR',
            external_reference: JSON.stringify({
                plan: plan,
                email: email,
                quota: selectedPlan.quota
            }),
            metadata: {
                plan: plan,
                email: email,
                quota: selectedPlan.quota,
            },
            // Removed payment_methods restriction to allow all defaults (PIX, Boleto, Card)
        };

        const result = await preference.create({ body: preferenceData });

        return NextResponse.json({
            init_point: result.init_point,
            preference_id: result.id
        });

    } catch (error: any) {
        console.error('Mercado Pago Preference Error:', error);
        return NextResponse.json({
            error: error.message || 'Error creating preference'
        }, { status: 500 });
    }
}
