import { NextRequest, NextResponse } from 'next/server';
import MasterLicitator from '@/lib/orchestrator/masterLicitator.js';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'Nenhum arquivo foi enviado' },
                { status: 400 }
            );
        }

        // Converter Files para formato esperado pelo MasterLicitator
        const filesForAnalysis = await Promise.all(
            files.map(async (file) => {
                const buffer = Buffer.from(await file.arrayBuffer());

                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    arrayBuffer: async () => buffer.buffer,
                    _buffer: buffer, // Guardar para SHA256
                };
            })
        );

        // Executar MasterLicitator
        const orchestrator = new MasterLicitator();
        const result = await orchestrator.execute(
            filesForAnalysis,
            [], // userQuestions (Sprint 2)
            {}, // userContext (Sprint 2)
            undefined // CNPJ (Sprint 2)
        ) as any; // TypeScript cast temporário para build

        // ✅ PERSISTIR NO DB
        const userId = 'dev'; // Placeholder até auth existir

        // 1. Criar analysis_batch
        const batch = await prisma.analysisBatch.create({
            data: {
                id: result.batch_id,
                userId: userId,
                status: result.status || 'success',
                totalDurationSeconds: result.total_duration_seconds || 0,
                pipelineSummary: JSON.stringify(result.pipeline_summary || {}),
                pipelineWarnings: JSON.stringify(result.pipeline_warnings || []),
                preAnalise: JSON.stringify(result.pre_analise || {}),
                results: JSON.stringify(result.results || {}),
                agents: JSON.stringify(result.agents || {}),
                blackBox: JSON.stringify(result.black_box || {}),
                ocrQualityAvg: result.pipeline_summary?.ocr_quality_avg || 0,
                documentsTotal: result.pipeline_summary?.documents_total || files.length,
                documentsProcessed: result.pipeline_summary?.documents_processed || files.length,
                pipelineVersion: '1.0',
            },
        });

        // 2. Persistir uploaded_documents
        await Promise.all(
            filesForAnalysis.map(async (file: any) => {
                const sha256 = crypto.createHash('sha256').update(file._buffer).digest('hex');

                await prisma.uploadedDocument.create({
                    data: {
                        batchId: batch.id,
                        filenameOriginal: file.name,
                        docType: 'nucleo_certame', // Classificação básica
                        storageUrl: `/uploads/${batch.id}/${file.name}`, // Path local
                        filesize: file.size,
                        sha256: sha256,
                        ocrQuality: 0, // Placeholder
                        needsReview: false,
                    },
                });
            })
        );

        // 3. Persistir integrated_corpus
        if (result.corpo_integrado || result._corpus) {
            const corpus = result.corpo_integrado || result._corpus;

            await prisma.integratedCorpus.create({
                data: {
                    batchId: batch.id,
                    textoCompleto: corpus.textoCompleto?.substring(0, 1000000) || null, // Limitar 1MB
                    globalLines: JSON.stringify(corpus.globalLines || []),
                    segments: JSON.stringify(corpus.segments || []),
                    lineMap: JSON.stringify(corpus.lineMap || {}),
                    metadata: JSON.stringify(corpus.metadata || {}),
                },
            });
        }

        // ✅ Retornar resultado completo
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Erro no /api/analyze:', error);

        return NextResponse.json(
            {
                error: 'Erro ao processar análise',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
