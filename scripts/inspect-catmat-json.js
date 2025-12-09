
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../lib/catmat-db.json');

try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(raw);

    console.log(`Total de itens: ${Object.keys(db).length}`);

    // Pegar os primeiros 5 itens
    const keys = Object.keys(db).slice(0, 5);
    for (const k of keys) {
        console.log(`\nCódigo: ${k}`);
        console.log(db[k]);
    }

} catch (e) {
    console.error("Erro:", e.message);
}
