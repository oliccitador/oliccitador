/**
 * Session Management API
 * Create and manage WhatsApp conversation sessions
 */

import { NextResponse } from 'next/server';
import { SessionManager } from '../../../lib/whatsapp/session-manager.ts';

export const dynamic = 'force-dynamic';

/**
 * POST - Create new session
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, context, userId, metadata } = body;

        // Validate required fields
        if (!phone || !context) {
            return NextResponse.json(
                { error: 'Missing required fields: phone, context' },
                { status: 400 }
            );
        }

        // Validate context
        if (context !== 'public' && context !== 'operacional') {
            return NextResponse.json(
                { error: 'Invalid context. Must be "public" or "operacional"' },
                { status: 400 }
            );
        }

        // Create session
        const sessionId = await SessionManager.createSession(
            phone,
            context,
            {
                userId,
                page: metadata?.page,
                plan: metadata?.plan
            }
        );

        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Session created: ${sessionId} (${context})`);
        }

        return NextResponse.json({
            sessionId,
            phone,
            context,
            createdAt: new Date().toISOString()
        }, { status: 201 });

    } catch (error: any) {
        console.error('❌ Session creation error:', error);
        return NextResponse.json({
            error: 'Failed to create session',
            message: error.message
        }, { status: 500 });
    }
}

/**
 * GET - Get active session by phone
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const phone = url.searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { error: 'Missing phone parameter' },
                { status: 400 }
            );
        }

        const session = await SessionManager.getActiveSession(phone);

        if (!session) {
            return NextResponse.json(
                { error: 'No active session found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            sessionId: session.id,
            phone: session.phone,
            context: session.context,
            userId: session.userId,
            messageCount: session.messages.length,
            createdAt: session.createdAt.toISOString(),
            lastActivity: session.lastActivity.toISOString(),
            status: session.status
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Session fetch error:', error);
        return NextResponse.json({
            error: 'Failed to fetch session',
            message: error.message
        }, { status: 500 });
    }
}
