
async function testApi() {
    const url = "http://localhost:3000/api/catmat-lookup";

    console.log("--- TESTE 1: Busca por Código (4782) ---");
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ query: "4782" })
        });
        const json = await res.json();
        console.log("Status:", res.status);
        if (json.results && json.results[0].codigo === "4782") {
            console.log("✅ Achou 4782:", json.results[0].descricao);
        } else {
            console.error("❌ Falhou 4782:", json);
        }
    } catch (e) { console.error(e.message); }

    console.log("\n--- TESTE 2: Busca por Texto (POLVORA) ---");
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ query: "POLVORA" })
        });
        const json = await res.json();
        const found = json.results && json.results.find(i => i.descricao.includes('PÓLVORA')); // Note o acento no dump anterior

        if (found) {
            console.log("✅ Achou PÓLVORA na lista de resultados.");
            console.log("Total encontrado:", json.total);
        } else {
            console.error("❌ Falhou busca textual:", JSON.stringify(json, null, 2));
        }
    } catch (e) { console.error(e.message); }
}

testApi();
