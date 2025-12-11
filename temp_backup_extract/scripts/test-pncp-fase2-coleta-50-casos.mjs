
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { searchPncp } from '../lib/pncp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

console.log("🗂️ FASE 2: COLETA DE 50 CASOS REAIS DO PNCP\n");
console.log("=".repeat(80));

/**
 * Categorias e termos de busca
 * 10 categorias × 5 itens = 50 casos
 */
const CATEGORIAS = [
    {
        nome: "Eletrônicos",
        termos: ["notebook", "monitor", "tablet", "impressora", "projetor"]
    },
    {
        nome: "Mobiliário",
        termos: ["cadeira", "mesa", "armário", "estante", "arquivo"]
    },
    {
        nome: "EPIs",
        termos: ["capacete", "luva", "bota", "óculos proteção", "máscara"]
    },
    {
        nome: "Eletrodomésticos",
        termos: ["geladeira", "ar condicionado", "microondas", "fogão", "bebedouro"]
    },
    {
        nome: "Elétrica",
        termos: ["disjuntor", "lâmpada", "cabo", "tomada", "interruptor"]
    },
    {
        nome: "Ferramentas",
        termos: ["furadeira", "alicate", "chave", "parafusadeira", "serra"]
    },
    {
        nome: "Limpeza",
        termos: ["desinfetante", "detergente", "vassoura", "sabão", "alvejante"]
    },
    {
        nome: "Iluminação",
        termos: ["luminária", "refletor", "poste", "spot", "arandela"]
    },
    {
        nome: "Papelaria",
        termos: ["papel", "caneta", "grampeador", "pasta", "envelope"]
    },
    {
        nome: "Veículos",
        termos: ["caminhão", "carro", "ônibus", "ambulância", "van"]
    }
];

/**
 * Coletar casos de uma categoria
 */
async function coletarCasosCategoria(categoria, termo) {
    console.log(`\n🔍 Buscando: ${categoria} - "${termo}"`);

    try {
        const results = await searchPncp(termo);

        if (!results || results.length === 0) {
            console.log(`   ⚠️ Nenhum resultado encontrado`);
            return null;
        }

        // Pegar o primeiro resultado válido
        const primeiro = results[0];

        console.log(`   ✅ Encontrado: ${primeiro.descricao?.substring(0, 50)}...`);
        console.log(`   📍 Órgão: ${primeiro.orgaoEntidade?.razaoSocial || 'N/A'}`);

        // Estrutura padronizada para nosso dataset
        return {
            categoria: categoria,
            termo_busca: termo,
            id_pncp: primeiro.id || primeiro.itemUrl,
            descricao_completa: primeiro.descricao || primeiro.objetoCompra,
            preco_unitario: primeiro.valorUnitario || null,
            quantidade: primeiro.quantidade || null,
            unidade: primeiro.unidadeMedida || 'UN',
            orgao: primeiro.orgaoEntidade?.razaoSocial || 'Desconhecido',
            orgao_cnpj: primeiro.orgaoEntidade?.cnpj || null,
            data_publicacao: primeiro.dataPublicacao || null,
            link: primeiro.link || primeiro.uri || null,
            dados_brutos: primeiro // Guardar dados originais para análise
        };

    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return null;
    }
}

/**
 * Executar coleta completa
 */
async function executarColeta() {
    console.log("\n🚀 Iniciando coleta de 50 casos...\n");

    const dataset = [];
    let sucessos = 0;
    let falhas = 0;

    for (const categoria of CATEGORIAS) {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`📂 CATEGORIA: ${categoria.nome}`);
        console.log("=".repeat(80));

        for (const termo of categoria.termos) {
            const caso = await coletarCasosCategoria(categoria.nome, termo);

            if (caso) {
                dataset.push(caso);
                sucessos++;
            } else {
                falhas++;
            }

            // Rate limiting - aguardar 500ms entre requisições
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 RESULTADO DA COLETA");
    console.log("=".repeat(80));
    console.log(`Total Esperado: 50`);
    console.log(`Coletados: ${sucessos}`);
    console.log(`Falhas: ${falhas}`);
    console.log(`Taxa de Sucesso: ${((sucessos / 50) * 100).toFixed(1)}%`);

    // Salvar dataset
    const outputPath = path.join(__dirname, '../pncp_50_cases_real.json');
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

    console.log(`\n💾 Dataset salvo em: ${outputPath}`);

    // Relatório por categoria
    console.log("\n📋 DISTRIBUIÇÃO POR CATEGORIA:");
    CATEGORIAS.forEach(cat => {
        const count = dataset.filter(d => d.categoria === cat.nome).length;
        console.log(`   ${cat.nome}: ${count}/5`);
    });

    // Estatísticas de preços
    const comPreco = dataset.filter(d => d.preco_unitario !== null);
    console.log(`\n💰 ITENS COM PREÇO: ${comPreco.length}/${dataset.length}`);

    if (comPreco.length > 0) {
        const precos = comPreco.map(d => d.preco_unitario);
        const min = Math.min(...precos);
        const max = Math.max(...precos);
        const media = precos.reduce((a, b) => a + b, 0) / precos.length;

        console.log(`   Mínimo: R$ ${min.toFixed(2)}`);
        console.log(`   Máximo: R$ ${max.toFixed(2)}`);
        console.log(`   Média: R$ ${media.toFixed(2)}`);
    }

    // Verificar qualidade dos dados
    console.log("\n🔍 QUALIDADE DOS DADOS:");
    const semDescricao = dataset.filter(d => !d.descricao_completa || d.descricao_completa.length < 20);
    const semOrgao = dataset.filter(d => d.orgao === 'Desconhecido');

    console.log(`   Sem descrição adequada: ${semDescricao.length}`);
    console.log(`   Sem órgão identificado: ${semOrgao.length}`);

    if (sucessos >= 40) {
        console.log("\n✅ COLETA APROVADA - Dataset suficiente para testes");
        return true;
    } else {
        console.log("\n⚠️ COLETA PARCIAL - Menos de 40 casos coletados");
        return false;
    }
}

// Executar
executarColeta().then(sucesso => {
    if (sucesso) {
        console.log("\n🎯 Próxima Fase: Teste de Matching com os 50 casos");
        process.exit(0);
    } else {
        console.log("\n⚠️ Considere ajustar termos de busca ou repetir coleta");
        process.exit(1);
    }
}).catch(err => {
    console.error("💥 ERRO CRÍTICO:", err);
    process.exit(1);
});
