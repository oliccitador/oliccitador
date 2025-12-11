// Seleciona 20 códigos CATMAT de produtos COMUNS
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lib/catmat-db-full.json'));

// Critérios: Produtos comuns, não obsoletos, bem especificados
const categorias = {
    'NOTEBOOKS': [],
    'IMPRESSORAS': [],
    'MOBILIÁRIO': [],
    'COMPUTADORES': [],
    'PERIFÉRICOS': []
};

Object.entries(data).forEach(([code, item]) => {
    const desc = item.descricao_item?.toUpperCase() || '';
    const grupo = item.nome_grupo?.toUpperCase() || '';

    // NOTEBOOKS com specs completas
    if (desc.includes('NOTEBOOK') &&
        desc.includes('MEMÓRIA RAM') &&
        desc.includes('TELA') &&
        categorias['NOTEBOOKS'].length < 4) {
        categorias['NOTEBOOKS'].push({
            code,
            desc: item.descricao_item.substring(0, 100),
            grupo: item.nome_grupo
        });
    }
    // IMPRESSORAS modernas (laser ou jato tinta)
    else if ((desc.includes('IMPRESSORA') || desc.includes('MULTIFUNCIONAL')) &&
        !desc.includes('MATRICIAL') &&
        !desc.includes('TELEIMPRESSORA') &&
        desc.includes('RESOLUÇÃO') &&
        categorias['IMPRESSORAS'].length < 4) {
        categorias['IMPRESSORAS'].push({
            code,
            desc: item.descricao_item.substring(0, 100),
            grupo: item.nome_grupo
        });
    }
    // MOBILIÁRIO comum (cadeiras, mesas)
    else if ((desc.includes('CADEIRA') || desc.includes('MESA')) &&
        desc.includes('MATERIAL') &&
        categorias['MOBILIÁRIO'].length < 4) {
        categorias['MOBILIÁRIO'].push({
            code,
            desc: item.descricao_item.substring(0, 100),
            grupo: item.nome_grupo
        });
    }
    // COMPUTADORES (desktops, all-in-one)
    else if ((desc.includes('COMPUTADOR') || desc.includes('MICROCOMPUTADOR')) &&
        desc.includes('PROCESSADOR') &&
        categorias['COMPUTADORES'].length < 4) {
        categorias['COMPUTADORES'].push({
            code,
            desc: item.descricao_item.substring(0, 100),
            grupo: item.nome_grupo
        });
    }
    // PERIFÉRICOS (mouse, teclado, monitor)
    else if ((desc.includes('MOUSE') || desc.includes('TECLADO') || desc.includes('MONITOR')) &&
        desc.includes('TIPO') &&
        categorias['PERIFÉRICOS'].length < 4) {
        categorias['PERIFÉRICOS'].push({
            code,
            desc: item.descricao_item.substring(0, 100),
            grupo: item.nome_grupo
        });
    }
});

console.log('\n📋 20 CÓDIGOS CATMAT - PRODUTOS COMUNS:\n');

const allCodes = [];
Object.entries(categorias).forEach(([cat, items]) => {
    console.log(`\n${cat}:`);
    items.forEach(item => {
        console.log(`  ${item.code}: ${item.desc}...`);
        allCodes.push(item.code);
    });
});

console.log(`\n\nTotal: ${allCodes.length} códigos`);

fs.writeFileSync('scripts/test-codes-comuns.json', JSON.stringify({
    categorias,
    codes: allCodes
}, null, 2));

console.log('\n✅ Salvo em scripts/test-codes-comuns.json');
