import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Memory cache for the database
let catmatDB = null;

/**
 * Consulta CATMAT por código
 * Retorna dados completos: grupo, classe, PDM, descrição
 */
export async function consultarCATMAT(codigo) {
    if (!codigo || codigo.trim().length === 0) {
        return { status: 'CATMAT_NAO_ENCONTRADO', error: 'CATMAT code is required' };
    }

    try {
        console.log(`[CATMAT] Querying code: ${codigo}`);

        // Load DB if not loaded
        if (!catmatDB) {
            console.log('[CATMAT] Loading full database into memory...');
            try {
                const filePath = path.join(process.cwd(), 'lib', 'catmat-db-full.json');
                const fileContent = fs.readFileSync(filePath, 'utf8');
                catmatDB = JSON.parse(fileContent);
            } catch (err) {
                console.error('[CATMAT] Failed to load full DB, trying old DB:', err.message);
                // Fallback para DB antiga
                const filePath = path.join(process.cwd(), 'lib', 'catmat-db.json');
                const fileContent = fs.readFileSync(filePath, 'utf8');
                catmatDB = JSON.parse(fileContent);
            }
        }

        const item = catmatDB[codigo];

        if (!item) {
            console.warn(`[CATMAT] Code ${codigo} not found`);
            return {
                status: 'OK',
                codigo,
                nome: 'Item não catalogado',
                descricao: 'Descrição não disponível',
                classe: 'Não identificada',
                grupo: null,
                pdm: null
            };
        }

        console.log(`[CATMAT] Found: ${item.descricao_item || item.d}`);

        // Retorna formato unificado (suporta DB nova e antiga)
        return {
            status: 'OK',
            codigo: codigo,
            grupo: item.nome_grupo || null,
            classe: item.nome_classe || item.c || null,
            pdm: item.nome_pdm || null,
            descricao_item: item.descricao_item || item.d || 'Não disponível',
            codigo_grupo: item.codigo_grupo || null,
            codigo_classe: item.codigo_classe || null,
            codigo_pdm: item.codigo_pdm || null,
            codigo_ncm: item.codigo_ncm || null
        };

    } catch (error) {
        console.error('[CATMAT] Query failed:', error);
        return {
            status: 'OK',
            codigo,
            nome: 'Erro na consulta',
            descricao: 'Não foi possível validar',
            classe: 'Desconhecida',
            grupo: null,
            pdm: null
        };
    }
}

/**
 * Extrai nome comercial e specs críticas via Gemini
 * @param {string} descricao_item - Descrição técnica do CATMAT
 * @param {string} grupo - Grupo/categoria do item
 */
export async function extrairEspecificacoes(descricao_item, grupo) {
    if (!GOOGLE_API_KEY) {
        console.error('[CATMAT] GOOGLE_API_KEY not configured');
        return {
            nome_comercial: descricao_item.substring(0, 100) + '...',
            query_busca: descricao_item.substring(0, 50),
            specs_criticas: {}
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
Você é especialista em BUSCA DE PRODUTOS para licitações públicas.

DESCRIÇÃO TÉCNICA:
"${descricao_item}"

TAREFA:
Crie uma query CURTA e OBJETIVA para buscar este produto no Google Shopping.

REGRAS CRÍTICAS:
1. Query deve ter NO MÁXIMO 6-8 PALAVRAS
2. FOQUE em specs que REALMENTE importam para identificar o produto
3. REMOVA palavras genéricas: "até", "acima de", "sistema operacional", "alimentação", "garantia", "bivolt"
4. EXTRAIA apenas: marca (se tiver), modelo principal, specs PRINCIPAIS
5. Use APENAS números e unidades EXATAS

EXEMPLOS DE BOAS QUERIES:

CATMAT: "NOTEBOOK, TELA:ATÉ 14 POL, MEMÓRIA RAM:ATÉ 4 GB, ARMAZENAMENTO HDD:ATÉ 500 GB..."
Query: "Notebook 14 polegadas 4GB HDD 500GB" ✅

CATMAT: "IMPRESSORA MULTIFUNCIONAL, JATO TINTA, 300X300 DPI, 4 PPM, 110/220V..."
Query CERTA: "Multifuncional jato tinta nova" ✅
Query ERRADA: "Multifuncional 300x300 DPI 4 PPM" ❌ NUNCA!

CATMAT: "IMPRESSORA LASER, 600X600 DPI, 12 PPM P&B, 3 PPM COLORIDA..."
Query CERTA: "Impressora laser colorida nova" ✅
Query ERRADA: "Impressora laser 12ppm 3ppm" ❌ NUNCA!

CATMAT: "CADEIRA ESCRITÓRIO, TUBO AÇO, ENCOSTO ALTO, COM BRAÇOS, AZUL..."
Query: "Cadeira escritório encosto alto azul" ✅

CATMAT: "APONTADOR LÁPIS, PLÁSTICO, MESA, AZUL, MÉDIO"
Query: "Apontador lápis mesa azul" ✅

CATMAT: "DISTRIBUIDOR ASFALTO"
Query: "Distribuidor asfalto" ✅

REGRAS POR CATEGORIA:

**NOTEBOOKS:**
- Tamanho tela + RAM + Armazenamento
- Ex: "Notebook 14pol 8GB SSD 256GB"
- IGNORE: sistema operacional, garantia, bateria, voltagem

**IMPRESSORAS:**
- Tipo + característica +  "nova" ou "profissional" (para evitar usadas)
- Ex: "Impressora laser nova"
- Ex: "Multifuncional jato tinta nova"
- Ex: "Impressora laser colorida profissional"
- IGNORE SEMPRE: DPIs, PPM, voltagem, capacidade papel

**MÓVEIS:**
- Tipo + Material + Cor principal
- Ex: "Cadeira escritório aço preta"
-IGNORE: dimensões exatas, acabamento

**ELETRÔNICOS:**
- Tipo + Especificação principal
- Ex: "Monitor LED 24 polegadas"
- IGNORE: voltagem, conectores

IMPORTANTE:
- NÃO invente especificações que não estão no texto
- Se não tem specs, use apenas o nome do produto
- Mantenha a query SIMPLES e BUSCÁVEL

RETORNE APENAS JSON (sem markdown):
{
  "nome_comercial": "Nome curto do produto",
  "query_busca": "Query curta 6-8 palavras máximo",
  "specs_criticas": {
    "spec_principal": "valor"
  }
}
`;

        console.log('[CATMAT] Chamando Gemini para extrair specs...');
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanedText);
            console.log('[CATMAT] ✅ Specs extraídas:', parsed.nome_comercial);
            return parsed;
        } catch (parseError) {
            console.error('[CATMAT] Parse error, using fallback');
            return {
                nome_comercial: descricao_item.substring(0, 100),
                query_busca: descricao_item.substring(0, 50),
                specs_criticas: {}
            };
        }

    } catch (error) {
        console.error('[CATMAT] Gemini error:', error.message);
        return {
            nome_comercial: descricao_item.substring(0, 100),
            query_busca: descricao_item.substring(0, 50),
            specs_criticas: {}
        };
    }
}

/**
 * Consulta COMPLETA: Busca + Extração de Specs
 * Combina consultarCATMAT + extrairEspecificacoes
 */
export async function consultarCATMATCompleto(codigo) {
    // 1. Buscar no DB
    const dadosCATMAT = await consultarCATMAT(codigo);

    if (dadosCATMAT.status !== 'OK') {
        return dadosCATMAT;
    }

    // 2. Extrair specs via Gemini
    const specs = await extrairEspecificacoes(
        dadosCATMAT.descricao_item,
        dadosCATMAT.grupo
    );

    // 3. Retornar tudo junto
    return {
        ...dadosCATMAT,
        nome_comercial: specs.nome_comercial,
        query_busca: specs.query_busca,
        specs_criticas: specs.specs_criticas
    };
}

// Mantém funções antigas para compatibilidade
export function prepararQueryPNCP(descricaoTR, catmatData) {
    const parts = [];
    if (catmatData.nome_comercial) parts.push(catmatData.nome_comercial);
    else if (catmatData.descricao_item) parts.push(catmatData.descricao_item);

    const tokens = descricaoTR.split(/\s+/).slice(0, 5);
    parts.push(...tokens);

    return parts.join(' ').trim();
}

export function detectarConflito(catmatData, pncpResults) {
    if (!pncpResults || pncpResults.length === 0) return null;
    // Implementação simplificada
    return null;
}

export function consolidarDescricao(catmatData, pncpResults) {
    const parts = [];
    if (catmatData.nome_comercial) parts.push(catmatData.nome_comercial);
    if (catmatData.descricao_item) parts.push(catmatData.descricao_item);
    return parts.join('. ').trim();
}
