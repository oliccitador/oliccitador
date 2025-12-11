// Seleciona 20 códigos CATMAT de 4 grupos diferentes
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lib/catmat-db-full.json'));

const categorias = {
    'INFORMÁTICA': [],
    'IMPRESSORAS': [],
    'MÓVEIS': [],
    'EQUIPAMENTOS': []
};

Object.entries(data).forEach(([code, item]) => {
    const grupo = item.nome_grupo?.toUpperCase() || '';

    if (grupo.includes('INFORMÁTICA') && categorias['INFORMÁTICA'].length < 5) {
        categorias['INFORMÁTICA'].push({ code, desc: item.descricao_item, grupo: item.nome_grupo });
    }
    else if ((grupo.includes('IMPRESSORA') || item.descricao_item.includes('IMPRESSORA')) && categorias['IMPRESSORAS'].length < 5) {
        categorias['IMPRESSORAS'].push({ code, desc: item.descricao_item, grupo: item.nome_grupo });
    }
    else if (grupo.includes('MOBILIÁRIO') && categorias['MÓVEIS'].length < 5) {
        categorias['MÓVEIS'].push({ code, desc: item.descricao_item, grupo: item.nome_grupo });
    }
    else if (grupo.includes('EQUIPAMENTO') && categorias['EQUIPAMENTOS'].length < 5) {
        categorias['EQUIPAMENTOS'].push({ code, desc: item.descricao_item, grupo: item.nome_grupo });
    }
});

console.log('\n📋 20 CÓDIGOS CATMAT SELECIONADOS:\n');
Object.entries(categorias).forEach(([cat, items]) => {
    console.log(`\n${cat}:`);
    items.forEach(item => {
        console.log(`  ${item.code}: ${item.desc.substring(0, 60)}...`);
    });
});

// Exporta lista para teste
const testCodes = [];
Object.values(categorias).forEach(items => {
    items.forEach(item => testCodes.push(item.code));
});

console.log(`\n\nTotal: ${testCodes.length} códigos`);
console.log('Códigos:', testCodes.join(', '));

fs.writeFileSync('scripts/test-codes-catmat.json', JSON.stringify({
    categorias,
    codes: testCodes
}, null, 2));

console.log('\n✅ Salvo em scripts/test-codes-catmat.json');
