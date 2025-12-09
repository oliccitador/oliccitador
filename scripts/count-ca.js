const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'ca.xlsx');

try {
    console.log(`Lendo arquivo: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converte para JSON para contar
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`\n--- DIAGNÓSTICO BASE CA ---`);
    console.log(`Abas encontradas: ${workbook.SheetNames.join(', ')}`);
    console.log(`Total de Registros (Linhas de dados): ${data.length}`);

    if (data.length > 0) {
        console.log(`\nExemplo do primeiro registro:`);
        console.log(data[0]);
        console.log(`\nExemplo do último registro:`);
        console.log(data[data.length - 1]);
    }

} catch (error) {
    console.error('Erro ao ler arquivo:', error.message);
}
