
async function testApi() {
    console.log("--- INICIANDO TESTE API CA LOOKUP ---");
    const ca = "40377";
    const url = "http://localhost:3000/api/ca-lookup";

    console.log(`Chamando: ${url} com CA: ${ca}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ca })
        });

        const status = response.status;
        console.log(`Status HTTP: ${status}`);

        const text = await response.text();

        try {
            const data = JSON.parse(text);
            if (status === 200) {
                console.log("✅ SUCESSO! Dados recebidos:");
                console.log(JSON.stringify(data, null, 2));

                // Validações básicas
                if (data.fabricante && data.descricao_tecnica) {
                    console.log("\n[PASSOU] Campos obrigatórios presentes.");
                    process.exit(0);
                } else {
                    console.error("\n[FALHOU] Campos faltando.");
                    process.exit(1);
                }
            } else {
                console.error("❌ ERRO NA API:", data);
                process.exit(1);
            }
        } catch (e) {
            console.error("Erro ao parsear JSON:", text);
            process.exit(1);
        }

    } catch (error) {
        console.error("Erro de conexão:", error.message);
        console.log("Certifique-se que o servidor 'npm run dev' está rodando na porta 3000.");
        process.exit(1);
    }
}

testApi();
