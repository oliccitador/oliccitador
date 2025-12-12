import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const userId = 'dev'; // Placeholder até auth existir

        // Buscar últimos 20 batches do usuário
        const batches = await prisma.analysisBatch.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
            select: {
                id: true,
                status: true,
                createdAt: true,
                ocrQualityAvg: true,
                documentsTotal: true,
                documentsProcessed: true,
                preAnalise: true, // Para pegar órgão
            },
        });

        // Mapear batches com órgão extraído
        const batchesFormatted = batches.map(batch => {
            let orgao = 'N/A';

            try {
                const preAnalise = JSON.parse(batch.preAnalise);
                orgao = preAnalise.metadados?.orgao || 'N/A';
            } catch (e) {
                // Ignorar erros de parse
            }

            return {
                id: batch.id,
                status: batch.status,
                createdAt: batch.createdAt.toISOString(),
                ocrQualityAvg: batch.ocrQualityAvg,
                documentsTotal: batch.documentsTotal,
                documentsProcessed: batch.documentsProcessed,
                orgao: orgao,
            };
        });

        return NextResponse.json({ batches: batchesFormatted });

    } catch (error: any) {
        console.error('Erro no GET /api/history:', error);

        return NextResponse.json(
            {
                error: 'Erro ao buscar histórico',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
