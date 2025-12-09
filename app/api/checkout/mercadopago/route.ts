import { NextResponse } from 'next/server';
import MercadoPagoConfig, { Preference } from 'mercadopago';
import logger from '../../../../lib/logger';

export const dynamic = 'force-dynamic';

// Plan configuration
const PLANS = {
    basico: {
        name: 'Básico',
        price: 29.90,
        item_quota: 100,
        edital_quota: 50
    },
    profissional: {
        name: 'Profissional',
        price: 59.90,
        item_quota: -1, // ilimitado
        edital_quota: 500
    },
    anual: {
        name: 'Anual',
        price: 297.00,
        item_quota: -1, // ilimitado
        edital_quota: 350,
        billing_period: 'yearly'
    }
};

export async function POST(request: Request) {
    logger.debug('CHECKOUT/MP', 'API called');

    try {
        // 1. Get plan and email from request
        const body = await request.json();
        const { plan, email } = body;
        logger.info('CHECKOUT/MP', 'Request data:', { plan, email });

        if (!plan || !email) {
            console.error('❌ Missing required fields:', { plan, email });
            return NextResponse.json({ error: 'Plan and email are required' }, { status: 400 });
        }

        if (!PLANS[plan as keyof typeof PLANS]) {
            console.error('❌ Invalid plan:', plan);
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const selectedPlan = PLANS[plan as keyof typeof PLANS];
        logger.debug('CHECKOUT/MP', 'Selected plan:', selectedPlan);

        // Environment validation (dev only warning)
        if (!process.env.NEXT_PUBLIC_BASE_URL && process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ NEXT_PUBLIC_BASE_URL not set, using fallback URL');
        }

        // 2. Initialize Mercado Pago
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (process.env.NODE_ENV !== 'production') console.log('🔑 Access Token check:', {
            exists: !!accessToken,
            length: accessToken?.length,
            prefix: accessToken?.substring(0, 10) + '...'
        });

        if (!accessToken) {
            console.error('❌ MERCADOPAGO_ACCESS_TOKEN not configured');
            return NextResponse.json({
                error: 'Payment service not configured. Please contact support.'
            }, { status: 500 });
        }

        const client = new MercadoPagoConfig({
            accessToken: accessToken,
        });
        logger.success('CHECKOUT/MP', 'Client initialized');

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
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 1
            }
        };

        logger.debug('CHECKOUT/MP', 'Creating preference with data:', JSON.stringify(preferenceData, null, 2));
        const result = await preference.create({ body: preferenceData });
        logger.success('CHECKOUT/MP', 'Preference created:', { id: result.id, init_point: result.init_point });

        return NextResponse.json({
            init_point: result.init_point,
            preference_id: result.id
        });

    } catch (error: any) {
        console.error('❌ CHECKOUT API ERROR:', {
            name: error.name,
            message: error.message,
            status: error.status,
            cause: error.cause,
            stack: error.stack
        });
        return NextResponse.json({
            error: error.message || 'Error creating preference'
        }, { status: 500 });
    }
}
