```
return    try {
        const body = await request.json();
        const { query, has_ca, ca_numero, ca_descricao_tecnica, ca_nome_comercial, query_semantica } = body;
        
        console.log('[API/PRICES] Received request:', { query, has_ca, ca_numero });
        
        const result = await buscarMelhoresPrecos({
            query,
            has_ca,
            ca_numero,
            ca_descricao_tecnica,
            ca_nome_comercial,
            query_semantica
        });
}
}
```
