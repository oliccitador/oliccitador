const text = "ACESSÓRIO EQUIPAMENTO SEGURANÇA TIPO: FREIO OITO , MATERIAL: AÇO INOX , APLICAÇÃO: EQUIPAMENTO PARA RAPEL , CARACTERÍSTICAS ADICIONAIS: CARGA: 40KN, PARA CORDAS DE 9 A 16MM |CATMAT: 485807";

// Novo regex (mais permissivo)
const catmatRegex = /(?:CATMAT|BR|CÓDIGO|CODIGO)\D*(\d{5,8})\b/i;
const match = text.match(catmatRegex);

console.log('Texto:', text.substring(text.length - 50));
console.log('\nRegex:', catmatRegex);
console.log('Match:', match);

if (match) {
    console.log('\n✅ SUCESSO! CATMAT detectado:', match[1]);
} else {
    console.log('\n❌ FALHA: CATMAT não detectado');
}
