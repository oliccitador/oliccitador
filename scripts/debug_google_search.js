const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Hardcoded keys for validation (REPLACE WITH ENV VARS IN PROD)
const apiKey = "AIzaSyANKM6Cuv5fefOXrrV9Xvv3xe_5_1JQ9YM"; // Nova chave
const cx = "42ea3850a19fa4469"; // CX original (assumindo correto)

console.log("Debug Google Search");
console.log("API Key presente:", !!apiKey);
console.log("CX presente:", !!cx);

if (!apiKey || !cx) {
    console.error("Faltam chaves.");
    process.exit(1);
}

const query = "CA 40377 ficha tecnica";
const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

console.log("Chamando URL...");

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Status Code:", res.statusCode);
            if (json.error) {
                console.error("ERRO API:", JSON.stringify(json.error, null, 2));
            } else {
                console.log("Resultados encontrados:", json.searchInformation?.totalResults);
                if (json.items && json.items.length > 0) {
                    console.log("Primeiro item:", json.items[0].title);
                    console.log("Link:", json.items[0].link);
                } else {
                    console.log("Array 'items' vazio.");
                    console.log("Kind:", json.kind);
                    console.log("URL:", json.url);
                }
            }
        } catch (e) {
            console.error("Erro parse:", e);
            console.log("Raw:", data);
        }
    });
}).on('error', (e) => {
    console.error("Erro na request:", e);
});
