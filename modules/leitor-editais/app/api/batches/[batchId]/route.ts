import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ batchId: string }> }
) {
    try {
        const { batchId } = await params;
        const userId = 'dev'; // Placeholder até auth existir

        // Buscar batch com ownership
        const batch = await prisma.analysisBatch.findFirst({
            where: {
                id: batchId,
                userId: userId, // Ownership
            },
            include: {
                uploadedDocuments: true,
                integratedCorpus: true,
                generatedArtifacts: true,
            },
        });

        if (!batch) {
            return NextResponse.json(
                { error: 'Batch não encontrado ou acesso negado' },
                { status: 404 }
            );
        }

        // Montar resposta no formato esperado pelo dashboard
        const response = {
            batch_id: batch.id,
            status: batch.status,
            timestamp: batch.createdAt.toISOString(),
            total_duration_seconds: batch.totalDurationSeconds,

            pipeline_summary: JSON.parse(batch.pipelineSummary),
            pipeline_warnings: JSON.parse(batch.pipelineWarnings),
            pre_analise: JSON.parse(batch.preAnalise),

            results: JSON.parse(batch.results),
            agents: JSON.parse(batch.agents),

            black_box: JSON.parse(batch.blackBox),

            // Corpus (se existir)
            corpo_integrado: batch.integratedCorpus ? {
                textoCompleto: batch.integratedCorpus.textoCompleto,
                globalLines: JSON.parse(batch.integratedCorpus.globalLines || '[]'),
                segments: JSON.parse(batch.integratedCorpus.segments || '[]'),
                lineMap: JSON.parse(batch.integratedCorpus.lineMap || '{}'),
                metadata: JSON.parse(batch.integratedCorpus.metadata || '{}'),
            } : null,

            // Documentos
            uploaded_documents: batch.uploadedDocuments.map(doc => ({
                filename: doc.filenameOriginal,
                doc_type: doc.docType,
                size: doc.filesize,
                sha256: doc.sha256,
                ocr_quality: doc.ocrQuality,
            })),

            // Artefatos gerados
            artifacts: batch.generatedArtifacts.map(art => ({
                type: art.type,
                storage_url: art.storageUrl,
                size_bytes: art.sizeBytes,
                created_at: art.createdAt.toISOString(),
            })),
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Erro no GET /api/batches/:batchId:', error);

        return NextResponse.json(
            {
                error: 'Erro ao buscar batch',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
