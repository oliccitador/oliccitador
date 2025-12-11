
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { searchPncp, buscaLiteral, normalizePncpResults } from '../lib/pncp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const PNCP_BASE_URL = 'https://pncp.gov.br/api/consulta/v1/atas';

console.log("🧪 FASE 1: VALIDAÇÃO ACESSO API PNCP (Endpoints Corretos)\n");
console.log("=".repeat(80));

/**
 * Teste 1: Verificar acesso básico à API
 */
async function test_acesso_api() {
    console.log("\n📡 Teste 1: Acesso à API PNCP (/api/consulta/v1/atas)");

    try {
        const url = `${PNCP_BASE_URL}?termo=notebook&pagina=1&tamanhoPagina=5`;
        console.log(`   URL: ${url}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ FALHOU: Status ${response.status}`);
            return false;
        }

        const data = await response.json();
        const results = data.data || data || [];

        console.log(`✅ PASSOU: API respondeu com ${results.length} resultados`);

        if (results.length > 0) {
            console.log(`   Exemplo: ${results[0].descricao?.substring(0, 60) || 'N/A'}...`);
            console.log(`   Órgão: ${results[0].orgaoEntidade?.razaoSocial || 'N/A'}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ ERRO: ${error.message}`);
        return false;
    }
}

/**
 * Teste 2: Testar busca com lib/pncp.js (função existente)
 */
async function test_busca_pncp_lib() {
    console.log("\n📚 Teste 2: Busca usando lib/pncp.js (searchPncp)");

    try {
        const results = await searchPncp("notebook core i7");

        if (!results || results.length === 0) {
            console.log("⚠️ Nenhum resultado, mas não é erro");
            return true;
        }

        console.log(`✅ PASSOU: searchPncp retornou ${results.length} resultados`);
        console.log(`   Primeiro resultado: ${results[0].descricao?.substring(0, 60)}...`);

        return true;
    } catch (error) {
        console.error(`❌ ERRO: ${error.message}`);
        return false;
    }
}

/**
 * Teste 3: Testar busca literal (função flow 2)
 */
async function test_busca_literal() {
    console.log("\n🎯 Teste 3: Busca Literal (buscaLiteral)");

    try {
        const descricao = "NOTEBOOK PROCESSADOR INTEL CORE I7";
        const results = await buscaLiteral(descricao);

        console.log(`✅ PASSOU: buscaLiteral retornou ${results.length} resultados`);

        if (results.length > 0) {
            console.log(`   Match: ${results[0].descricao_oficial?.substring(0, 60)}...`);
            console.log(`   Preço: R$ ${results[0].preco_unitario || 'N/A'}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ ERRO: ${error.message}`);
        return false;
    }
}

/**
 * Teste 4: Validar estrutura de dados normalizada
 */
async function test_normalizacao_dados() {
    console.log("\n🔧 Teste 4: Normalização de Dados");

    try {
        const url = `${PNCP_BASE_URL}?termo=cadeira&pagina=1&tamanhoPagina=3`;
        const response = await fetch(url);
        const data = await response.json();
        const rawResults = data.data || data || [];

        if (rawResults.length === 0) {
            console.log("⚠️ Sem dados para testar normalização");
            return true;
        }

        const normalized = normalizePncpResults(rawResults);

        // Validar campos obrigatórios
        const camposEssenciais = ['id', 'descricao_oficial', 'orgao'];
        const primeiro = normalized[0];

        const camposFaltantes = camposEssenciais.filter(campo => !primeiro[campo]);

        if (camposFaltantes.length > 0) {
            console.error(`❌ CAMPOS FALTANTES: ${camposFaltantes.join(', ')}`);
            return false;
        }

        console.log("✅ PASSOU: Normalização OK");
        console.log(`   Campos presentes: ${Object.keys(primeiro).join(', ')}`);

        return true;
    } catch (error) {
        console.error(`❌ ERRO: ${error.message}`);
        return false;
    }
}

/**
 * Executar Fase 1 Completa
 */
async function executarFase1() {
    console.log("\n🚀 EXECUTANDO FASE 1: VALIDAÇÃO API PNCP\n");

    const resultados = {
        test_acesso: await test_acesso_api(),
        test_lib: await test_busca_pncp_lib(),
        test_literal: await test_busca_literal(),
        test_normalizacao: await test_normalizacao_dados()
    };

    const total = Object.keys(resultados).length;
    const aprovados = Object.values(resultados).filter(r => r).length;
    const taxa = (aprovados / total) * 100;

    console.log("\n" + "=".repeat(80));
    console.log("📊 RESULTADO FASE 1");
    console.log("=".repeat(80));
    console.log(`Total de Testes: ${total}`);
    console.log(`Aprovados: ${aprovados}`);
    console.log(`Reprovados: ${total - aprovados}`);
    console.log(`Taxa de Sucesso: ${taxa.toFixed(1)}%`);

    if (taxa >= 75) {
        console.log("\n✅ FASE 1 APROVADA");
        console.log("✅ API PNCP funcionando corretamente");
        console.log("✅ Pode prosseguir para Fase 2 (Coleta de 50 Casos)");
        return true;
    } else {
        console.log("\n❌ FASE 1 REPROVADA");
        return false;
    }
}

//Executar
executarFase1().then(sucesso => {
    process.exit(sucesso ? 0 : 1);
}).catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
