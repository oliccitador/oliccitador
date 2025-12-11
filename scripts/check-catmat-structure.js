// Script para verificar estrutura do CATMAT.xlsx
const XLSX = require('xlsx');

const workbook = XLSX.readFile('catmat.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total de linhas:', data.length);
console.log('\nColunas disponíveis:');
console.log(Object.keys(data[0]));

console.log('\nPrimeiro item completo:');
console.log(data[0]);

console.log('\nSegundo item completo:');
console.log(data[1]);
