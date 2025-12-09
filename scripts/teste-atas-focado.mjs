/**
 * TESTE FOCADO: ENDPOINT /atas
 * Tentando fazer a busca funcionar aqui
 */
import fetch from 'node-fetch';

async function testeAtas() {
    console.log("🔓 HAMMERING /atas ENDPOINT\n");

    // Parâmetros obrigatórios descobertos: pagina=1, tamanhoPagina=10
    // Parâmetros de filtro: testar 'objeto', 'termo', 'descricao'

    const params = [
        `termo=PNEU`,
        `objeto=PNEU`,
        `descricao=PNEU`
    ];

    for (const p of params) {
        const url = `https://pncp.gov.br/api/consulta/v1/atas?${p}&pagina=1&tamanhoPagina=10`;
        console.log(`Tentando: ${p}`);

        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log(`✅ SUCESSO! Items: ${data.data?.length || 0}`);
                if (data.data?.length > 0) {
                    console.log(JSON.stringify(data.data[0], null, 2));
                }
            } else {
                console.log(`❌ ${res.status}`);
                // ler corpo erro
                try {
                    const txt = await res.text();
                    console.log(`   ${txt.substring(0, 100)}...`);
                } catch (e) { }
            }
        } catch (e) { console.log(`Err: ${e.message}`); }
    }
}

testeAtas();
