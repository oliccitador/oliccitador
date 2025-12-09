/**
 * VERIFICAÇÃO LOCAL
 */
import fetch from 'node-fetch';
const URL_LOCAL = "http://localhost:3000";

async function testeLocal() {
    process.stdout.write(`⏳ Testando API LOCAL /api/prices... `);
    try {
        const res = await fetch(`${URL_LOCAL}/api/prices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "Teste" })
        });
        if (res.ok) console.log(`✅ OK (${res.status})`);
        else console.log(`❌ ERRO HTTP ${res.status}`);
    } catch (e) { console.log(`❌ EXCEÇÃO: ${e.message}`); }
}
testeLocal();
