const text = "ANEL MOLDÁVEL PARA PROTEÇÃO DE OSTOMIA ESTÉREO; ETILENO/BUTILENO; ETILENO -PROPLIENO; ETILENO; ACETATO DE VINILA; POLIPROPILENO/GLICOL; ISOBUTILENO/ BUTENO; CERA DE PARAFINA; ÓXIDO DE TITÂNIO; HIDROXIETILCELULOSE; GALACTOMANANA; CARBOXIMETILCELULOSE; DURABILIDADE: RESISTENTE À EROSÃO POR ATÉ 36 HORAS,C 2 MM MARCA DE REFERÊNCIA COLOPLAST OU SUPERIOR CATMAT 477283";

// Test 1: Current regex
const catmatRegex1 = /(?:CATMAT|BR|CÓDIGO|CODIGO)[\s:.-]+(\d{5,8})/i;
const match1 = text.match(catmatRegex1);

console.log('=== TESTE DO REGEX ===');
console.log('Texto:', text.substring(text.length - 50));
console.log('\nRegex atual:', catmatRegex1);
console.log('Match encontrado:', match1);
if (match1) {
    console.log('Código capturado:', match1[1]);
} else {
    console.log('❌ NENHUM MATCH!');
}

// Test 2: More permissive regex
const catmatRegex2 = /CATMAT\s+(\d+)/i;
const match2 = text.match(catmatRegex2);
console.log('\n--- Teste com regex mais simples ---');
console.log('Regex simples:', catmatRegex2);
console.log('Match encontrado:', match2);
if (match2) {
    console.log('Código capturado:', match2[1]);
}
