/**
 * POST /api/batches/[batchId]/context
 * 
 * Salva contexto operacional da empresa para um batch
 * 
 * @module app/api/batches/[batchId]/context
 * @sprint Sprint 3 - CNPJ/Contexto
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos válidos para os enums
const VALID_ESTOQUE = ['PRONTO', 'SOB_ENCOMENDA', 'NAO_TENHO'];
const VALID_APETITE_RISCO = ['BAIXO', 'MEDIO', 'ALTO'];

export async function POST(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    try {
        const { batchId } = await params;
        const body = await request.json();

        const {
            companyProfileId,
            estoque,
            alcanceLogisticoKm,
            apetiteRisco,
            observacoes,
        } = body;

        // ✅ Validações
        if (!companyProfileId) {
            return NextResponse.json(
                { error: 'companyProfileId é obrigatório' },
                { status: 400 }
            );
        }

        if (!estoque || !VALID_ESTOQUE.includes(estoque)) {
            return NextResponse.json(
                { error: `estoque deve ser um de: ${VALID_ESTOQUE.join(', ')}` },
                { status: 400 }
            );
        }

        if (!apetiteRisco || !VALID_APETITE_RISCO.includes(apetiteRisco)) {
            return NextResponse.json(
                { error: `apetiteRisco deve ser um de: ${VALID_APETITE_RISCO.join(', ')}` },
                { status: 400 }
            );
        }

        // ✅ Verificar se batch existe
        const batch = await prisma.analysisBatch.findUnique({
            where: { id: batchId },
            select: { id: true }
        });

        if (!batch) {
            return NextResponse.json(
                { error: 'Batch não encontrado' },
                { status: 404 }
            );
        }

        // ✅ Verificar se companyProfile existe
        const profile = await prisma.companyProfile.findUnique({
            where: { id: companyProfileId },
            select: { id: true }
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'CompanyProfile não encontrado' },
                { status: 404 }
            );
        }

        // ✅ Verificar se já existe contexto (1 por batch)
        const existing = await prisma.batchCompanyContext.findUnique({
            where: { batchId }
        });

        let context;

        if (existing) {
            // Atualizar existente
            context = await prisma.batchCompanyContext.update({
                where: { batchId },
                data: {
                    companyProfileId,
                    estoque,
                    alcanceLogisticoKm: alcanceLogisticoKm || null,
                    apetiteRisco,
                    observacoes: observacoes || null,
                }
            });
            console.log(`[API] Contexto atualizado para batch ${batchId}`);
        } else {
            // Criar novo
            context = await prisma.batchCompanyContext.create({
                data: {
                    batchId,
                    companyProfileId,
                    estoque,
                    alcanceLogisticoKm: alcanceLogisticoKm || null,
                    apetiteRisco,
                    observacoes: observacoes || null,
                }
            });
            console.log(`[API] Contexto criado para batch ${batchId}`);
        }

        return NextResponse.json(context);

    } catch (error: any) {
        console.error('[API] Erro ao salvar contexto:', error);
        return NextResponse.json(
            {
                error: 'Erro ao salvar contexto operacional',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/batches/[batchId]/context
 * 
 * Recupera contexto operacional de um batch
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ batchId: string }> }
) {
    try {
        const { batchId } = await params;

        const context = await prisma.batchCompanyContext.findUnique({
            where: { batchId },
            include: {
                companyProfile: true,
            }
        });

        if (!context) {
            return NextResponse.json(
                { error: 'Contexto não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(context);

    } catch (error: any) {
        console.error('[API] Erro ao buscar contexto:', error);
        return NextResponse.json(
            {
                error: 'Erro ao buscar contexto operacional',
                details: error.message
            },
            { status: 500 }
        );
    }
}
