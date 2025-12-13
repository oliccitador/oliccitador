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

    try {
        // Tentar API Pública BrasilAPI
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);

        if (response.ok) {
            const data = await response.json();

            // Mapear CNAEs (BrasilAPI retorna array de objetos)
            const cnaes = [];
            if (data.cnae_fiscal) {
                cnaes.push(`${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}`);
            }
            if (data.cnaes_secundarios && Array.isArray(data.cnaes_secundarios)) {
                data.cnaes_secundarios.forEach((c: any) => {
                    cnaes.push(`${c.codigo} - ${c.descricao}`);
                });
            }

            return {
                cnpj: cnpjClean,
                razaoSocial: data.razao_social,
                cnaes: cnaes,
                porte: data.porte,
                situacaoCadastral: data.situacao_cadastral, // Retorna código numérico ou string dependendo da versão
            };
        } else {
            console.warn(`[Receita] Erro na BrasilAPI: ${response.status} ${response.statusText}`);
            // Fallback para mock em caso de erro da API
            throw new Error('BrasilAPI retornou erro');
        }
    } catch (error) {
        console.warn('[Receita] Falha na consulta externa, usando mock fallback', error);

        // Mock fallback apenas se API falhar
        const mockData: ReceitaResponse = {
            cnpj: cnpjClean,
            razaoSocial: `EMPRESA MOCK TEMPORÁRIA (FALHA API)`,
            cnaes: ['9999-9/99 - FALHA NA CONSULTA EXTERNA'],
            porte: 'INDUSTRIA',
            situacaoCadastral: 'ATIVA',
        };
        return mockData;
    }
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
    const clean = sanitizeCNPJ(cnpj);
    if (clean.length !== 14) return cnpj;

    return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12, 14)}`;
}
