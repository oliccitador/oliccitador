// Debug Forense de Strings do .env
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const cxMatch = envContent.match(/GOOGLE_SEARCH_CX=(.*)/);
const keyMatch = envContent.match(/GOOGLE_SEARCH_API_KEY_M2=(.*)/);

const cx = cxMatch ? cxMatch[1].trim() : "NÃO ACHEI";
const key = keyMatch ? keyMatch[1].trim() : "NÃO ACHEI";

console.log(`\n🔍 ANÁLISE FORENSE DE STRINGS`);
console.log(`---------------------------`);

console.log(`CX Visual:  "${cx}"`);
console.log(`CX Length:  ${cx.length}`);
console.log(`CX Chars:   ${[...cx].map(c => c.charCodeAt(0)).join(', ')}`);

console.log(`\nKEY Visual: "${key}"`);
console.log(`KEY Length: ${key.length}`);
console.log(`KEY Chars:  ${[...key].map(c => c.charCodeAt(0)).join(', ')}`);

// Validação
if (cx.length !== 17) {
    console.log(`\n🚨 ALERTA: CX tem tamanho errado! (Esperado 17, tem ${cx.length})`);
} else {
    console.log(`\n✅ CX parece ter o tamanho correto.`);
}
