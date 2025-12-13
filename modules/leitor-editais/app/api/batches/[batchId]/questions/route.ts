/**
 * POST /api/batches/[batchId]/questions
 * 
 * Processa perguntas (PRE ou POST) usando corpus e resultados salvos
 * 
 * @module app/api/batches/[batchId]/questions
 * @sprint Sprint 3 - Perguntas Pós-Análise
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { QuestionRouter } from '@/lib/question-router';

const prisma = new PrismaClient();

const VALID_MODES = ['PRE', 'POST'];

export async function POST(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    try {
        const { batchId } = await params;
        const body = await request.json();

        const { mode, questions } = body;

        // ✅ Validações
        if (!mode || !VALID_MODES.includes(mode)) {
            return NextResponse.json(
                { error: `mode deve ser um de: ${VALID_MODES.join(', ')}` },
                { status: 400 }
            );
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { error: 'questions deve ser um array não-vazio' },
                { status: 400 }
            );
        }

        // ✅ Carregar batch + corpus + context
        const batch = await prisma.analysisBatch.findUnique({
            where: { id: batchId },
            include: {
                integratedCorpus: true,
                batchCompanyContext: {
                    include: {
                        companyProfile: true,
                    }
                }
            }
        });

        if (!batch) {
            return NextResponse.json(
                { error: 'Batch não encontrado' },
                { status: 404 }
            );
        }

        // ✅ Modo PRE: não precisa de corpus (perguntas gerais)
        if (mode === 'PRE') {
            const answers = [];

            for (const q of questions) {
                const { category, questionText } = q;

                if (!category || !questionText) {
                    continue;
                }

                // Salvar pergunta sem resposta (respondida depois)
                const saved = await prisma.batchQuestion.create({
                    data: {
                        batchId,
                        mode,
                        category,
                        questionText,
                        answerText: null, // Respondida após análise
                        evidence: null,
                        status: 'OK',
                        answerFormat: 'TEXT',
                    }
                });

                answers.push({
                    questionId: saved.id,
                    questionText: saved.questionText,
                    answerText: 'Pergunta registrada. Será respondida após a análise completa.',
                    evidence: [],
                    status: 'OK',
                    answerFormat: 'TEXT',
                });
            }

            console.log(`[API] ${answers.length} perguntas PRE registradas para batch ${batchId}`);

            return NextResponse.json({ mode, answers });
        }

        // ✅ Modo POST: precisa de corpus e results
        if (!batch.integratedCorpus || !batch.results) {
            return NextResponse.json(
                {
                    error: 'Análise não concluída. Execute a análise antes de fazer perguntas POST.',
                    hint: 'Use mode=PRE para perguntas pré-análise.'
                },
                { status: 400 }
            );
        }

        // Parsear corpus e results
        const corpus = batch.integratedCorpus.globalLines
            ? JSON.parse(batch.integratedCorpus.globalLines)
            : null;

        const results = batch.results ? JSON.parse(batch.results) : null;
        const context = batch.batchCompanyContext || null;

        if (!corpus || !results) {
            return NextResponse.json(
                {
                    error: 'Corpus ou resultados inválidos. Re-execute a análise.',
                },
                { status: 500 }
            );
        }

        // ✅ Processar perguntas com QuestionRouter
        const router = new QuestionRouter(corpus, results, context);
        const answers = [];

        for (const q of questions) {
            const { category, questionText } = q;

            if (!category || !questionText) {
                continue;
            }

            // Rotear pergunta
            const answer = router.route(category, questionText);

            // Salvar no DB
            const saved = await prisma.batchQuestion.create({
                data: {
                    batchId,
                    mode,
                    category,
                    questionText,
                    answerText: answer.answerText,
                    evidence: JSON.stringify(answer.evidence),
                    status: answer.status,
                    answerFormat: answer.answerFormat,
                }
            });

            answers.push({
                questionId: saved.id,
                category,
                questionText,
                answerText: answer.answerText,
                evidence: answer.evidence,
                status: answer.status,
                answerFormat: answer.answerFormat,
            });
        }

        console.log(`[API] ${answers.length} perguntas POST processadas para batch ${batchId}`);

        return NextResponse.json({ mode, answers });

    } catch (error: any) {
        console.error('[API] Erro ao processar perguntas:', error);
        return NextResponse.json(
            {
                error: 'Erro ao processar perguntas',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/batches/[batchId]/questions
 * 
 * Recupera todas as perguntas de um batch (ordenadas por data)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    try {
        const { batchId } = await params;
        const url = new URL(request.url);
        const mode = url.searchParams.get('mode'); // Filtrar por PRE ou POST

        const where: any = { batchId };
        if (mode && VALID_MODES.includes(mode)) {
            where.mode = mode;
        }

        const questions = await prisma.batchQuestion.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Parsear evidence (JSON)
        const parsed = questions.map(q => ({
            ...q,
            evidence: q.evidence ? JSON.parse(q.evidence) : [],
        }));

        return NextResponse.json({ questions: parsed });

    } catch (error: any) {
        console.error('[API] Erro ao buscar perguntas:', error);
        return NextResponse.json(
            {
                error: 'Erro ao buscar perguntas',
                details: error.message
            },
            { status: 500 }
        );
    }
}
