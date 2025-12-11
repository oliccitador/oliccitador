# M4 – Módulo de Busca de Preços (Market Search Engine)

**Versão:** 3.0 (Busca Exclusiva CA)  
**Data:** 2025-12-11  
**Estado:** ✅ FUNCIONAL (Produção)  
**Commit:** `2fe5cc6`

---

## CHANGELOG

### 2025-12-11 - v3.0 - Commit 2fe5cc6
- ✅ **Query CA Exclusiva:** Busca apenas `"CA {numero} EPI"` sem nome do produto
- ✅ **Foco Sites Especializados:** Termo "EPI" enviesa para lojas de segurança
- ✅ **Sem Fallback Genérico:** Se CA existe e não encontra, retorna vazio (precisão > recall)
- ✅ **Filtro Rigoroso Mantido:** CA deve aparecer no título do anúncio
- ✅ **Filtro Brasileiro:** Apenas sites `.br` aplicado via SerpApi
- ⚠️ **Sem Cache:** Cada busca consome API (otimização futura)

---

## Visão Geral

Motor de cotação de preços que integra **Google Shopping via SerpApi** e **PNCP** para fornecer as 3 melhores ofertas de mercado e referências governamentais. Implementa estratégia de busca **CA-exclusiva** para EPIs, garantindo máxima precisão.

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M4 - Módulo de Busca de Preços (Market Search Engine)

**Papel Estratégico:**  
M4 é o motor de cotação do sistema O Licitador. Fornece preços de mercado reais e atualizados, permitindo que gestores públicos tenham referências confiáveis para elaboração de editais. Implementa busca **CA-exclusiva** que garante precisão absoluta ao buscar apenas pelo código oficial do EPI.

**Funcionamento Operacional (Atualizado v3.0):**  
M4 recebe dados estruturados (query, has_ca, ca_numero, ca_nome_comercial, query_semantica). 

**Estratégia atual:**
1. **Se tem CA:** Busca APENAS `"CA {numero} EPI"` no Google Shopping
   - Filtro rigoroso: CA deve estar no título
   - Sem fallback para nome genérico (evita produtos errados)
2. **Se NÃO tem CA:** Busca por query semântica (Gemini) ou nome simples
3. **Paralelo:** Busca no PNCP com melhor query disponível

Retorna: Top 3 preços ordenados + Top 5 referências PNCP

**Interações com Outros Módulos:**  
- **Depende de:** SerpApi (Google Shopping), M5 (PNCP), lib/serpapi.js
- **É usado por:** M6, M7, M8 (interfaces de cotação), recebe dados de M1 (query semântica) e M2 (dados CA)

**Status Atual:**  
✅ FUNCIONAL - Busca CA-exclusiva em produção

---

## Funções do Módulo

### 1. Busca CA-Exclusiva (Estratégia Principal v3.0)
**Query:** `"CA {numero} EPI"`

**Características:**
- **Sem nome do produto:** Evita poluição de query
- **Termo "EPI":** Enviesa algoritmo Google para lojas especializadas
- **Filtro rigoroso:** Descarta resultados sem o CA no título
- **Sem fallback:** Se não achar por CA, retorna vazio

**Vantagens:**
- Precisão máxima (só produtos certificados)
- Foco em lojas especializadas (evita marketplaces genéricos)
- Prefere "sem resultado" a "resultado errado"

### 2. Busca Semântica (Fallback - Apenas sem CA)
**Query:** Gerada por Gemini ou nome comercial

**Quando ativa:**
- Apenas se `has_ca = false`
- Usa query_semantica (ex: "Botina Nobuck Bidensidade")
- Aplica filtros de relevância por keywords

### 3. Busca Paralela PNCP
- Executa simultaneamente com Google Shopping
- Usa melhor query disponível (CA ou semântica)
- Retorna top 5 referências governamentais
- Timeout de 10s (não trava se PNCP lento)

### 4. Filtragem e Ordenação
**Filtros aplicados:**
1. **CA no título** (se busca foi por CA)
2. **Sites brasileiros** (via SerpApi config)
3. **Preço válido** (> 0)

**Ordenação:**
- Menor preço primeiro
- Limitação: Top 3 resultados

---

## Arquivos Principais

### Código
- **`lib/price-search.js`** (Principal)
  - Função `buscarMelhoresPrecos(params)` (export)
  - Função `buildSmartQuery()` (fallback - não-CA)

### Dependências
```json
{
  "SerpApi": "via lib/serpapi.js",
  "PNCP": "via lib/pncp-client.js"
}
```

### Variáveis de Ambiente
```env
SERPAPI_KEY=    # Google Shopping search
# PNCP: Sem chave (API pública)
```

---

## Estratégia de Query v3.0

### Com CA (has_ca = true)
```javascript
// Query CA-Exclusiv
a
const query = `CA ${cleanCA} EPI`;  // Ex: "CA 20565 EPI"

// Filtro rigoroso
results.filter(item => item.titulo.includes(ca_numero));

// Sem fallback
if (results.length === 0) return { melhores_precos: [] };
```

### Sem CA (has_ca = false)
```javascript
// Tenta query semântica
const query = query_semantica || ca_nome_comercial;

// Permite fallback
if (results.length === 0) trySimpleFallback(ca_nome_comercial);
```

---

## Problemas Conhecidos

### ⚠️ Ativos (v3.0)

1. **Sem Cache Implementado**
   - **Descrição:** Cada busca consome quota SerpApi
   - **Impacto:** Custo desnecessário em buscas repetidas
   - **Solução:** Cache de 24h planejado
   - **Workaround:** Nenhum

2. **PNCP Instável**
   - **Descrição:** API governamental frequentemente lenta/fora
   - **Impacto:** Timeout de 10s pode retornar vazio
   - **Mitigação:** Timeout + try/catch
   - **Status:** Aceitável (não-crítico)

3. **Cobertura Limitada (Proposital)**
   - **Descrição:** Busca CA-exclusiva retorna menos resultados
   - **Justificativa:** Precisão mais importante que cobertura
   - **Status:** Feature, not bug

### ✅ Resolvidos (v3.0)

1. ~~**Filtro CA muito restritivo**~~ → Agora é proposital (precisão)
2. ~~**Smart Query não captura nuances**~~ → Desabilitado para CA
3. ~~**Fallback genérico polui resultados**~~ → Removido para CA

---

## Lições Aprendidas

### Estratégicas

1. **Precisão > Recall em Cotações**
   - Preço errado causa mais dano que "sem preço"
   - Melhor retornar vazio que produto diferente

2. **Sites Especializados São Melhores**
   - Marketplaces genéricos trazem ruído
   - Termo "EPI" filtra naturalmente

3. **CA-Exclusivo Funciona**
   - Lojas especializadas sempre citam CA
   - Query simples `"CA {num} EPI"` é suficiente

### Técnicas

4. **SerpApi Config é Crítica**
   - `google_domain: "google.com.br"`
   - `gl: "br"` + `hl: "pt-br"`
   - Filtro adicional de domínios garante BR

5. **Timeout PNCP Essencial**
   - API governamental é lenta
   - Não pode travar busca comercial

---

## Testes

### Cenário 1: CA Comum (20565)
```javascript
const result = await buscarMelhoresPrecos({
  has_ca: true,
  ca_numero: '20565',
  ca_nome_comercial: 'Respirador PFF2'
});
// Esperado: 0-3 preços de lojas especializadas
```

### Cenário 2: Sem CA
```javascript
const result = await buscarMelhoresPrecos({
  has_ca: false,
  query_semantica: 'Botina Nobuck Bidensidade'
});
// Esperado: 3 preços (mais resultados que com CA)
```

### Cenário 3: CA Raro
```javascript
const result = await buscarMelhoresPrecos({
  has_ca: true,
  ca_numero: '99999'
});
// Esperado: { melhores_precos: [] } (sem fallback)
```

---

## Dependências Externas

1. **SerpApi (Google Shopping)**
   - **Tipo:** API Comercial
   - **Quota:** 5000 buscas/mês (Dev)
   - **Custo:** $50/mês
   - **Criticidade:** ALTA

2. **PNCP**
   - **Tipo:** API Governamental Pública
   - **Quota:** Ilimitada (mas lenta)
   - **Custo:** Gratuita
   - **Criticidade:** BAIXA (nice-to-have)

---

## Métricas Recomendadas

1. **Taxa de Sucesso por CA**
   - Quantos CAs retornam ≥1 preço
   - Meta: >60% (aceitável para busca rigorosa)

2. **Custo por Busca**
   - Com cache: $0.01
   - Sem cache: $0.01 (direto)

3. **Tempo Médio de Resposta**
   - SerpApi: ~2s
   - PNCP: ~8s (paralelo, não afeta)

---

## Próximos Passos Recomendados

1. **Cache de 24h:**
   - Economiza 80% das chamadas SerpApi
   - Implementação simples via Redis/Memoria

2. **Monitoramento:**
   - Alertas se taxa de sucesso <40%
   - Log de CAs sem resultados (curadoria)

3. **Parcerias com Lojistas:**
   - Sistema híbrido (API + parceiros)
   - Ofertas destacadas

4. **Múltiplas Queries:**
   - Tentar variações: "CA X", "EPI CA X", etc
   - Se tempo de resposta permitir

---

**Última Atualização:** 2025-12-11  
**Responsável:** Sistema Automático  
**Versão do Documento:** 3.0
