/**
 * Cliente API PNCP / Compras.gov.br
 * Encapsula a lógica complexa de busca híbrida e tratamento de erros
 * Versão: BLINDADA V2 (Cache Expandido + Sanity Check + Fallback Temporal)
 */

import fetch from 'node-fetch';

const BASE_URL_COMPRAS = 'https://dadosabertos.compras.gov.br';
const BASE_URL_PNCP = 'https://pncp.gov.br/api/consulta/v1';

// Cache expandido com itens mais comuns em licitações (Top 50 Pareto)
const CATMAT_CACHE = {
    // Informática e Eletrônicos
    'COMPUTADOR': '400508',
    'NOTEBOOK': '401838',
    'LAPTOP': '401838',
    'TABLET': '449419',
    'MONITOR': '441050',
    'IMPRESSORA': '436359',
    'PROJETOR': '435305',
    'SERVIDOR': '435311',
    'NOBREAK': '444158',
    'ESTABILIZADOR': '404659',
    'MOUSE': '442651',
    'TECLADO': '451006',

    // Mobiliário
    'CADEIRA': '444269',
    'MESA': '399065',
    'ARMARIO': '399069',
    'ESTANTE': '150917',

    // Material de Escritório
    'PAPEL': '21975', // A4
    'CANETA': '11002',
    'LAPIS': '12497',
    'BORRACHA': '445207',
    'GRAMPEADOR': '407842',
    'CLIPS': '446979',

    // Alimentos e Bebidas
    'CAFE': '150036',
    'ACUCAR': '150117',
    'AGUA': '445479', // Mineral
    'LEITE': '463876',

    // Limpeza
    'DETERGENTE': '150570',
    'SABAO': '244849',
    'AGUA SANITARIA': '150537',
    'ALCOOL': '438692',
    'PAPEL HIGIENICO': '150592',
    'VASSOURA': '150650',

    // Climatização
    'AR CONDICIONADO': '150644',
    'VENTILADOR': '150654',

    // Veículos e Acessórios
    'PNEU': '412580', // Genérico passeio
    'BATERIA': '404690', // Automotiva
    'OLEO': '150906', // Lubrificante

    // Outros
    'EXTINTOR': '459145',
    'LAMPADA': '445217'
};

export class PncpClient {

    /**
     * Busca preços de referência para um item
     * @param {string} descricao - Descrição do item (ex: "Notebook i7")
     */
    async buscarPrecos(descricao) {
        console.log(`[PncpClient] Iniciando busca para: "${descricao}"`);

        let resultados = [];
        let codigoCatmat = null;

        // 1. Tentar resolver CATMAT
        codigoCatmat = await this._resolverCatmat(descricao);

        // 2. Se tiver CATMAT, buscar no Módulo de Preços (Fonte Ouro)
        if (codigoCatmat) {
            console.log(`[PncpClient] Buscando preços para CATMAT: ${codigoCatmat}...`);
            // Passamos a descricao original para validar os resultados (Sanity Check)
            const precos = await this._buscarPrecosPorCodigo(codigoCatmat, descricao);
            if (precos && precos.length > 0) {
                return this._normalizarResultados(precos, 'COMPRAS_PRECO');
            }
        }

        // 3. Fallback: Busca genérica no PNCP (Fonte Prata)
        // Só usamos se a busca principal falhar
        console.log(`[PncpClient] Fallback para busca textual no PNCP...`);
        const contratacoes = await this._buscarContratacoesPncp(descricao);

        if (contratacoes && contratacoes.length > 0) {
            return this._normalizarResultados(contratacoes, 'PNCP_GERAL');
        }

        return [];
    }

    /**
     * Resolve a descrição para um código CATMAT
     */
    async _resolverCatmat(descricao) {
        // 1. Tentar cache estático e dinâmico
        const termoUpper = descricao.toUpperCase().split(' ')[0]; // Pega primeira palavra chave
        if (CATMAT_CACHE[termoUpper]) {
            console.log(`[PncpClient] CATMAT encontrado no cache: ${CATMAT_CACHE[termoUpper]}`);
            return CATMAT_CACHE[termoUpper];
        }

        // 2. Buscar na API de Itens (Tentativa Melhorada com filtros textuais)
        try {
            // OBS: tamanhoPagina=10 é CRÍTICO para evitar erro 400
            const url = `${BASE_URL_COMPRAS}/modulo-material/4_consultarItemMaterial?descricaoItem=${encodeURIComponent(termoUpper)}&tamanhoPagina=10`;
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                if (data.resultado && data.resultado.length > 0) {
                    return data.resultado[0].codigoItem;
                }
            }
        } catch (e) {
            console.warn(`[PncpClient] Erro ao resolver CATMAT: ${e.message}`);
        }

        return null;
    }

    /**
     * Busca preços no módulo detalhado usando CATMAT
     * Com filtro de sanidade (Sanity Check)
     */
    async _buscarPrecosPorCodigo(codigo, termoOriginal = "") {
        try {
            const url = `${BASE_URL_COMPRAS}/modulo-pesquisa-preco/1_consultarMaterial?codigoItemCatalogo=${codigo}&tamanhoPagina=20`; // Aumentado para 20
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                let resultados = data.resultado || [];

                // Sanity Check: Se temos termo original, filtrar descrições desconexas
                if (termoOriginal && resultados.length > 0) {
                    // Pega a primeira palavra chave significativa (> 2 chars)
                    const palavrasChave = termoOriginal.toUpperCase().split(' ').filter(p => p.length > 2);

                    if (palavrasChave.length > 0) {
                        const palavraPrincipal = palavrasChave[0]; // Geralmente o substantivo (NOTEBOOK, PNEU)

                        // Guarda tamanho original para log
                        const totalAntes = resultados.length;

                        resultados = resultados.filter(item => {
                            const desc = (item.descricaoItem || "").toUpperCase();
                            return desc.includes(palavraPrincipal);
                        });

                        // Log se houve filtragem
                        if (resultados.length < totalAntes) {
                            console.log(`[PncpClient] Sanity Check: Filtrou ${totalAntes - resultados.length} itens irrelevantes.`);
                        }
                    }
                }

                return resultados;
            }
        } catch (e) {
            console.warn(`[PncpClient] Erro na busca de preços: ${e.message}`);
        }
        return null;
    }

    /**
     * Busca contratações no PNCP (Dados menos detalhados)
     * Fallback: Busca últimas contratações e filtra por texto na memória
     * Substitui endpoint /atas (que falhava sem CNPJ)
     */
    async _buscarContratacoesPncp(termo) {
        try {
            // PNCP não tem busca textual global pública fácil.
            // Estratégia: Pegar contratações dos últimos 30 dias (Pregão) e filtrar texto na memória.

            const hoje = new Date();
            const dataFinal = hoje.toISOString().split('T')[0].replace(/-/g, '');
            const dataInicial = new Date(hoje.setDate(hoje.getDate() - 365)).toISOString().split('T')[0].replace(/-/g, '');

            // Endpoint de publicações 
            // modalidade 6 = Pregão Eletrônico (mais comum)
            const url = `${BASE_URL_PNCP}/contratacoes/publicacao?dataInicial=${dataInicial}&dataFinal=${dataFinal}&codigoModalidadeContratacao=6&pagina=1&tamanhoPagina=100`;

            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                const itens = data.data || [];

                // Filtrar na memória pelo termo (Intelligent Token Match)
                if (itens.length > 0 && termo) {
                    const termoUpper = termo.toUpperCase();
                    // Quebra em tokens significantes (> 2 letras) para evitar preposições como 'de', 'e', 'com'
                    const tokens = termoUpper.split(' ').filter(t => t.length > 2);

                    return itens.filter(i => {
                        const alvo = (i.objetoCompra || "").toUpperCase();
                        if (!alvo) return false;

                        // Conta quantos tokens da query estão presentes no alvo (AND soft)
                        // Ex: "Notebook i7 16GB" (3 tokens) encontraria "Notebook Dell i7" (2 tokens ok)
                        const matches = tokens.filter(token => alvo.includes(token)).length;

                        // Aceita se tiver pelo menos 75% dos tokens
                        // Se tiver 1 ou 2 tokens, exige 100% para evitar falso positivo em palavras genéricas
                        const threshold = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.75);

                        return matches >= threshold;
                    });
                }

                return itens;
            } else {
                // Log discreto para debug
                // const txt = await res.text();
                // console.log(`[PncpClient] Erro Fallback: ${res.status}`);
            }
        } catch (e) {
            console.warn(`[PncpClient] Erro no PNCP Fallback: ${e.message}`);
        }
        return null;
    }

    /**
     * Normaliza dados de diferentes fontes para formato único
     */
    _normalizarResultados(dados, fonte) {
        if (fonte === 'COMPRAS_PRECO') {
            return dados.map(item => ({
                descricao: item.descricaoItem,
                marca: item.marca || 'GENÉRICO',
                modelo: '', // Extração futura via NLP
                fornecedor: item.nomeFornecedor,
                cnpj: item.niFornecedor,
                orgao: item.nomeUasg,
                preco: item.precoUnitario,
                data: item.dataResultado,
                fonte: 'Compras.gov (Ref)',
                id_referencia: item.idItemCompra
            }));
        }

        if (fonte === 'PNCP_GERAL') {
            // Estrutura do PNCP Publicações
            return dados.map(item => ({
                descricao: item.objetoCompra || "Contratação PNCP",
                marca: 'VER EDITAL',
                modelo: '',
                fornecedor: 'Licitação em Aberto/Recente',
                cnpj: item.orgaoEntidade?.cnpj,
                orgao: item.orgaoEntidade?.razaoSocial || 'Órgão Público',
                preco: item.valorTotalHomologado || item.valorTotalEstimado || 0, // Valor TOTAL da contratação (não unitário)
                data: item.dataPublicacaoPncp || item.dataInclusao,
                fonte: 'PNCP (Edital)',
                id_referencia: item.numeroControlePNCP
            }));
        }

        return [];
    }
}

// Export singleton para uso direto
export const pncpClient = new PncpClient();
