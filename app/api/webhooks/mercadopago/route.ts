import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getWelcomeEmailTemplate } from '../../../../lib/email-templates';

export const dynamic = 'force-dynamic';

// Plan configuration
const PLANS = {
    basico: { name: 'Básico', quota: 50 },
    pro: { name: 'Pro', quota: 150 },
    premium: { name: 'Premium', quota: 1000 }
};

export async function POST(req: Request) {
    try {
        // Initialize services
        const resend = new Resend(process.env.RESEND_API_KEY);
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const body = await req.json();
        if (process.env.NODE_ENV !== 'production') console.log('Mercado Pago Webhook received:', body);

        // Mercado Pago sends notifications with different types
        const { type, data } = body;

        // We're interested in payment notifications
        if (type === 'payment') {
            // Fetch payment details
            const paymentId = data.id;

            // Get payment info from Mercado Pago
            const mpResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                    }
                }
            );

            if (!mpResponse.ok) {
                console.error('Failed to fetch payment from MP');
                return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
            }

            const payment = await mpResponse.json();
            if (process.env.NODE_ENV !== 'production') console.log('Payment details:', payment);

            // Only process approved payments
            if (payment.status !== 'approved') {
                if (process.env.NODE_ENV !== 'production') console.log(`Payment status is ${payment.status}, skipping`);
                return NextResponse.json({ received: true });
            }

            // Extract metadata
            let metadata = payment.metadata || {};
            let email = metadata.email || payment.payer?.email;
            let planCode = metadata.plan;

            // Fallback: Check external_reference (used in Subscriptions/PreApproval)
            if ((!email || !planCode) && payment.external_reference) {
                try {
                    const externalRef = JSON.parse(payment.external_reference);
                    if (externalRef.email) email = externalRef.email;
                    if (externalRef.plan) planCode = externalRef.plan;
                    if (process.env.NODE_ENV !== 'production') console.log('Recovered metadata from external_reference:', externalRef);
                } catch (e) {
                    console.warn('Failed to parse external_reference:', payment.external_reference);
                }
            }

            if (!email || !planCode) {
                console.error('Missing email or plan in payment metadata/external_reference');
                return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
            }

            const planDetails = PLANS[planCode as keyof typeof PLANS];
            if (!planDetails) {
                console.error('Invalid plan:', planCode);
                return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
            }

            if (process.env.NODE_ENV !== 'production') console.log(`Processing payment for ${email}, plan: ${planCode}`);

            // Check if user exists
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

            let userId: string;
            let isNewUser = false;
            let actionUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/login`;

            if (existingUser) {
                userId = existingUser.id;
                if (process.env.NODE_ENV !== 'production') console.log(`User already exists: ${userId}`);
            } else {
                isNewUser = true;
                // Create new user
                const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        plan: planCode,
                        created_via: 'mercadopago'
                    }
                });

                if (createError) {
                    console.error('Error creating user:', createError);
                    return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
                }

                userId = newUser.user.id;
                if (process.env.NODE_ENV !== 'production') console.log(`Created new user: ${userId}`);

                // Generate password reset link
                const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'recovery',
                    email: email,
                    options: {
                        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://oliccitador.com.br'}/definir-senha`
                    }
                });

                if (linkError) {
                    console.error('Error generating link:', linkError);
                }

                if (linkData?.properties?.action_link) {
                    actionUrl = linkData.properties.action_link;
                    if (process.env.NODE_ENV !== 'production') console.log('Generated recovery link successfully');
                }
            }

            // Create or update subscription
            const { error: subError } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: planCode,
                    quota_limit: planDetails.quota,
                    quota_used: 0,
                    status: 'active',
                    updated_at: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (subError) {
                console.error('Error updating subscription:', subError);
                return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
            }

            if (process.env.NODE_ENV !== 'production') console.log(`Subscription activated for user ${userId}`);

            // Send Welcome/Confirmation Email
            try {
                await resend.emails.send({
                    from: 'O Licitador <contato@oliccitador.com.br>',
                    to: email,
                    subject: isNewUser ? 'Bem-vindo ao O Licitador! Defina sua senha' : 'Pagamento Confirmado - O Licitador',
                    html: getWelcomeEmailTemplate(planDetails.name, actionUrl, isNewUser)
                });
                if (process.env.NODE_ENV !== 'production') console.log(`Email sent to ${email}`);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
