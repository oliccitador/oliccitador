/**
 * POST /api/company/lookup
 * 
 * Consulta e persiste dados de CNPJ da Receita Federal
 * 
 * @module app/api/company/lookup
 * @sprint Sprint 3 - CNPJ/Contexto
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { consultarReceita, sanitizeCNPJ, isValidCNPJ } from '@/lib/services/receita';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cnpj } = body;

        // Validação básica
        if (!cnpj) {
            return NextResponse.json(
                { error: 'CNPJ é obrigatório' },
                { status: 400 }
            );
        }

        // Sanitizar
        const cnpjClean = sanitizeCNPJ(cnpj);

        // Validar formato
        if (!isValidCNPJ(cnpjClean)) {
            return NextResponse.json(
                { error: 'CNPJ inválido. Deve conter 14 dígitos.' },
                { status: 400 }
            );
        }

        // ✅ Cache: verificar se já existe no DB
        let profile = await prisma.companyProfile.findUnique({
            where: { cnpj: cnpjClean }
        });

        if (profile) {
            console.log(`[API] CNPJ ${cnpjClean} encontrado no cache`);
            return NextResponse.json({
                ...profile,
                cnaes: profile.cnaes ? JSON.parse(profile.cnaes) : [],
                cached: true,
            });
        }

        // ✅ Consultar Receita
        console.log(`[API] Consultando CNPJ ${cnpjClean} na Receita...`);

        let receitaData;
        try {
            receitaData = await consultarReceita(cnpjClean);
        } catch (error: any) {
            console.error('[API] Erro ao consultar Receita:', error);
            return NextResponse.json(
                {
                    error: 'Erro ao consultar Receita Federal. Tente novamente em alguns instantes.',
                    details: error.message,
                    retry: true,
                },
                { status: 503 }
            );
        }

        // ✅ Persistir no DB
        profile = await prisma.companyProfile.create({
            data: {
                cnpj: cnpjClean,
                razaoSocial: receitaData.razaoSocial,
                cnaes: JSON.stringify(receitaData.cnaes),
                porte: receitaData.porte,
                situacaoCadastral: receitaData.situacaoCadastral,
                source: 'receita',
            }
        });

        console.log(`[API] CNPJ ${cnpjClean} salvo no DB com sucesso`);

        return NextResponse.json({
            ...profile,
            cnaes: JSON.parse(profile.cnaes || '[]'),
            cached: false,
        });

    } catch (error: any) {
        console.error('[API] Erro inesperado:', error);
        return NextResponse.json(
            {
                error: 'Erro interno ao processar consulta',
                details: error.message
            },
            { status: 500 }
        );
    }
}
