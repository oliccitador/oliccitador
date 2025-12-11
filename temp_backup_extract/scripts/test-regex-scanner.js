// Test Regex scanner for CATMAT detection

const description = 'ATADURA CREPOM, TIPO: CERCA DE 13 FIOS / CM², MATE-RIAL: FAIXA DE TECIDO 100% ALGODÃO, LARGURA: CERCA DE 10 CM, COMPRIMENTO EM REPOUSO: ROLO CERCA DE 1,8 M, ESTERILIDADE: NÃO ESTÉRIL, C/12 UNIDADES EMBALA-GEM: EMBALAGEM INDIVIDUAL CATMAT 628378';

console.log('Testing Regex Scanner...\n');
console.log('Description:', description.substring(0, 100) + '...\n');

const catmatRegex = /(?:CATMAT|BR|CÓDIGO|CODIGO)[\s:.-]*(\d{6,})/i;
const match = description.match(catmatRegex);

console.log('Regex:', catmatRegex);
console.log('Match result:', match);

if (match && match[1]) {
    console.log('\n✅ SUCCESS: Detected CATMAT code:', match[1]);
} else {
    console.log('\n❌ FAILED: No CATMAT code detected');
}
