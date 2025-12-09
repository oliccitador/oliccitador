const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Split lines, trim spaces around keys and values
    const lines = content.split('\n');
    const cleanedLines = lines.map(line => {
        if (!line.trim() || line.startsWith('#')) return line;

        const parts = line.split('=');
        if (parts.length < 2) return line;

        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim(); // Trims space from value!

        return `${key}=${value}`;
    });

    fs.writeFileSync(envPath, cleanedLines.join('\n'));
    console.log('Arquivo .env.local limpo com sucesso (espaços removidos).');

} catch (e) {
    console.error('Erro ao limpar .env.local:', e);
}
