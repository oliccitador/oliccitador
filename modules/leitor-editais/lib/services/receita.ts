/**
 * Serviço de consulta CNPJ na Receita Federal
 * 
 * @module lib/services/receita
 * @sprint Sprint 3 - CNPJ/Contexto
 */

export interface ReceitaResponse {
    cnpj: string;
    razaoSocial: string;
    cnaes: string[];
    porte?: string;
    situacaoCadastral?: string;
}

/**
 * Sanitiza um CNPJ removendo caracteres não-numéricos
 */
export function sanitizeCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

/**
 * Valida formato de CNPJ (14 dígitos)
 */
export function isValidCNPJ(cnpj: string): boolean {
    const clean = sanitizeCNPJ(cnpj);
    return clean.length === 14 && /^\d{14}$/.test(clean);
}

/**
 * Consulta CNPJ na Receita Federal
 * 
 * NOTA MVP: Implementação mock para desenvolvimento
 * TODO: Integrar com API oficial Receita ou serviço terceiro
 * 
 * @param cnpj - CNPJ já sanitizado (14 dígitos)
 * @returns Dados da empresa
 * @throws Error se CNPJ inválido ou serviço indisponível
 */
export async function consultarReceita(cnpj: string): Promise<ReceitaResponse> {
    // Validar formato
    if (!isValidCNPJ(cnpj)) {
        throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }

    const cnpjClean = sanitizeCNPJ(cnpj);

    // TODO: Integração real
    // Opções:
    // 1. API Receita Federal (se disponível)
    // 2. ReceitaWS.com.br (grátis, limites)
    // 3. BrasilAPI (grátis, open source)
    // 4. Serviço pago (SerpAPI, etc)

    // MOCK PARA MVP:
    // Simula dados realistas baseados no CNPJ
    const mockData: ReceitaResponse = {
        cnpj: cnpjClean,
        razaoSocial: `EMPRESA EXEMPLO ${cnpjClean.substring(0, 4)} LTDA`,
        cnaes: ['4744-0/01', '4741-5/00'], // Comércio varejista
        porte: 'ME', // ME, EPP, NORMAL
        situacaoCadastral: 'ATIVA',
    };

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[Receita Mock] CNPJ ${cnpjClean} consultado com sucesso`);
    return mockData;
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
    const clean = sanitizeCNPJ(cnpj);
    if (clean.length !== 14) return cnpj;

    return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12, 14)}`;
}
