/**
 * TESTE FOCADO: ENDPOINT /atas (Com ANO)
 */
import fetch from 'node-fetch';

async function testeAtasAno() {
    console.log("🔓 HAMMERING /atas ENDPOINT (Com Ano)\n");

    const url = `https://pncp.gov.br/api/consulta/v1/atas?ano=2024&termo=PNEU&pagina=1&tamanhoPagina=10`;
    console.log(`Tentando: ${url}`);

    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ SUCESSO! Items: ${data.data?.length || 0}`);
            if (data.data?.length > 0) {
                console.log(JSON.stringify(data.data[0], null, 2));
                // VERIFICAR SE TEM CODIGO CATMAT
            }
        } else {
            console.log(`❌ ${res.status}`);
            const txt = await res.text();
            console.log(`   ${txt}`);
        }
    } catch (e) { console.log(`Err: ${e.message}`); }
}

testeAtasAno();
