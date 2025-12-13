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

        if (!cnpj) {
            return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
        }

        const cnpjClean = sanitizeCNPJ(cnpj);
        if (!isValidCNPJ(cnpjClean)) {
            return NextResponse.json({ error: 'CNPJ inválido. Deve conter 14 dígitos.' }, { status: 400 });
        }

        // ✅ 1. Tentar Cache (DB) - Fail-safe
        let profile = null;
        try {
            profile = await prisma.companyProfile.findUnique({ where: { cnpj: cnpjClean } });
        } catch (dbError) {
            console.warn('[API] Banco de dados indisponível ou erro de conexão. Pulando cache.', (dbError as any).message);
        }

        if (profile) {
            console.log(`[API] CNPJ ${cnpjClean} encontrado no cache`);
            return NextResponse.json({
                ...profile,
                cnaes: profile.cnaes ? JSON.parse(profile.cnaes) : [],
                cached: true,
            });
        }

        // ✅ 2. Consultar Receita
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

        // ✅ 3. Tentar Persistir (DB) - Fail-safe
        try {
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
        } catch (dbError) {
            console.warn('[API] Não foi possível salvar no banco de dados (provável falta de conexão). Retornando dados em memória.', (dbError as any).message);
            // Cria um objeto fake do profile para retorno
            profile = {
                id: 'preview-id',
                cnpj: cnpjClean,
                razaoSocial: receitaData.razaoSocial,
                cnaes: JSON.stringify(receitaData.cnaes),
                porte: receitaData.porte,
                situacaoCadastral: receitaData.situacaoCadastral,
                source: 'receita',
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

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
