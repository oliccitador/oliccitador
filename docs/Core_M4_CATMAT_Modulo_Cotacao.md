# M4-CATMAT – Módulo de Cotação para CATMAT

**Versão:** 1.0  
**Data:** 2025-12-11  
**Estado:** 🟡 IMPLEMENTADO (Teste com API pendente)

---

## Visão Geral

Módulo DEDICADO para cotação de produtos CATMAT. Diferente do M4 (CA/EPI), este módulo utiliza **query completa com especificações técnicas** geradas pelo M3 para buscar preços que atendam 100% dos requisitos de licitação.

---

## Diferenças vs M4 (CA/EPI)

| Aspecto | M4 (CA/EPI) | M4-CATMAT (Novo) |
|---------|-------------|------------------|
| **Query** | `"CA {numero} EPI"` | Specs completas (ex: "Notebook 14pol 4GB HDD500GB bivolt") |
| **Filtro** | CA deve estar no título | Relevância por specs (pontuação) |
| **Fallback** | Sem fallback se CA existe | Query simplificada se muito específica |
| **Foco** | Sites especializados EPI | Conformidade técnica licitações |

---

## Estratégia de Busca (3 Tentativas)

### **Tentativa 1: Query Completa**
```javascript
Query: "Notebook tela 14 polegadas, sem tela interativa, 4GB RAM, processador até 4 núcleos, HDD 500GB, sem SSD, bateria até 4 células, sistema operacional proprietário, garantia on site 36 meses, bivolt automático"
```
- Usa query gerada pelo M3 (TODAS specs)
- Se retornar ≥3 resultados → SUCESSO

### **Tentativa 2: Query Simplificada**
```javascript
Query: "Notebook básico 14 polegadas 4GB HDD"
```
- Remove specs muito específicas
- Mantém apenas:
  - Notebooks: tela, RAM, tipo armazenamento
  - Impressoras: tipo, funções principais

### **Tentativa 3: Nome Comercial**
```javascript
Query: "Notebook básico"
```
- Última chance: apenas nome
- Retorna o que encontrar

---

## Filtro de Relevância

**Não é filtro binário** (como CA que descarta tudo sem código).

**Sistema de pontuação:**
- +1 ponto para cada spec crítica que aparece no título
- +2 pontos se nome comercial aparece
- Ordena por score (maior primeiro)
- **Retorna todos** (não descarta, apenas prioriza)

**Exemplo:**
```
Produto A: "Notebook 14pol 4GB HDD 500GB" → Score: 4
Produto B: "Notebook Dell" → Score: 1
Produto C: "Notebook básico 14pol 4GB SSD 256GB" → Score: 5 (melhor)
```

---

## Funções Principais

### `buscarPrecosCATMAT(params)`
**Entrada:**
```javascript
{
  query_completa: "string",    // Do M3
  nome_comercial: "string",    // Do M3
  specs_criticas: {},          // Do M3
  codigo_catmat: "string"      // Para PNCP
}
```

**Saída:**
```javascript
{
  melhores_precos: [{         // Top 3 ordenados
    titulo: "...",
    preco: 1500.00,
    loja: "...",
    link: "...",
    relevance_score: 4
  }],
  referencias_governamentais: [], // PNCP
  estrategia_usada: "full_specs_query",
  total_encontrados: 15,
  specs_buscadas: {}
}
```

### `buildSimplifiedQuery(nome, specs)`
Remove specs muito específicas para aumentar cobertura.

**Antes:** "Notebook 14pol sem tela interativa 4GB processador até 4 núcleos HDD 500GB sem SSD bateria até 4 células"  
**Depois:** "Notebook básico 14 polegadas 4GB HDD"

### `filterByRelevance(results, specs, nome)`
Pontua e reordena resultados por relevância das specs.

### `validarConformidade(titulo, specs_obrigatorias)`
Valida se produto atende requisitos mínimos.
```javascript
{
  atende: true/false,
  specs_faltantes: ["processador", "ram"],
  confianca: 80  // % de specs atendidas
}
```

---

## Integração com M3

**Fluxo completo:**
```
Usuário: Código CATMAT 451899
  ↓
M3: consultarCATMATCompleto()
  ↓
Retorna:
  - nome_comercial: "Notebook básico"
  - query_busca: "Notebook 14pol 4GB..."
  - specs_criticas: {tela: "14", ram: "4GB"}
  ↓
M4-CATMAT: buscarPrecosCATMAT()
  ↓
Retorna: Top 3 preços + PNCP
```

---

## Dependências

- **SerpApi:** Google Shopping search
- **PNCP Client:** Referências governamentais
- **M3:** Specs extraídas via Gemini

---

## Testes Pendentes

### ✅ **Implementado:**
- Código completo
- Lógica de fallback
-Sistema de relevância
- Integração M3

### ⏳ **Pendente:**
- Teste com SERPAPI_KEY real
- Validação de preços retornados
- Teste end-to-end via interface

---

## Próximos Passos

1. **Obter SERPAPI_KEY** para testes locais
2. **Testar com 5+ CATMATs** de categorias diferentes
3. **Validar qualidade dos preços** (relevância)
4. **Criar API Route** `/api/prices-catmat`
5. **Integrar na interface** consulta-catmat

---

**Última Atualização:** 2025-12-11  
**Responsável:** Sistema Automático  
**Versão do Documento:** 1.0
