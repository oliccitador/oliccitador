# M4 – Módulo de Busca de Preços (Market Search Engine)

**Versão:** 2.0 (Plano Radical)  
**Data:** 2025-12-10  
**Estado:** ✅ PRONTO

---

## Visão Geral

Motor de cotação de preços que integra Google Shopping (via SerpApi) e PNCP para fornecer as 3 melhores ofertas de mercado e referências governamentais. Implementa estratégia de busca hierárquica com filtros rigorosos de relevância.

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M4 - Módulo de Busca de Preços (Market Search Engine)

**Papel Estratégico:**  
M4 é o motor de cotação do sistema O Licitador. Ele existe para fornecer preços de mercado reais e atualizados de produtos, permitindo que gestores públicos tenham referências confiáveis para elaboração de editais e análise de propostas. Implementa o "Plano Radical" que garante precisão absoluta ao buscar por CAs específicos, evitando cotações de produtos similares mas tecnicamente diferentes.

**Funcionamento Operacional:**  
M4 recebe dados estruturados (query, CA, nome comercial, descrição técnica, query semântica). Implementa estratégia hierárquica: (1) Se tem CA, busca exatamente por "Nome CA 12345" no Google Shopping via SerpApi e FILTRA rigorosamente resultados que não contenham o número do CA no título; (2) Se não tem CA ou busca falhou, tenta Smart Query (extrai keywords técnicas da descrição como "Nobuck Cadarço Bidensidade"); (3) Paralelamente, busca no PNCP com melhor query disponível. Retorna top 3 preços ordenados + top 5 referências PNCP.

**Interações com Outros Módulos:**  
- **Depende de:** SerpApi (Google Shopping - externa), M5 (PNCP) para referências governamentais
- **É usado por:** M6, M7, M8 (todas as interfaces de cotação), recebe dados de M1 (query semântica) e M2/M3 (dados de CA/CATMAT)

**Status Atual:**  
✅ PRONTO - Plano Radical implementado com filtros rigorosos de CA

---

## Funções do Módulo

### 1. Estratégia de Query Hierárquica (Plano Radical)
**Tentativa 1: Busca Exata por CA**
- Query: `"Nome Comercial CA 12345"`
- Filtro: Valida se número do CA está no título do anúncio
- Se zero resultados → Tentativa 2 (DESABILITADA se has_ca=true)

**Tentativa 2: Smart Query (Fallback)**
- Extrai keywords técnicas da descrição (biqueira, solado, material)
- Query: `"Botina Nobuck Cadarço Bidensidade Bico Plástico"`
- Apenas executada se busca NÃO foi por CA

**Tentativa 3: Fallback Simples**
- Query: Nome comercial apenas
- Último recurso

### 2. Busca Paralela PNCP
- Executa simultaneamente com Google Shopping
- Usa melhor query disponível (CA ou semântica)
- Retorna top 5 referências governamentais

### 3. Filtragem de Relevância
- **Filtro de CA (Crítico):** Se busca foi por CA, descarta resultados que não contenham o número exato no título
- **Filtro de Preço:** Remove resultados sem preço ou preço = 0
- **Ordenação:** Menor preço primeiro
- **Limitação:** Top 3 resultados

---

## Fluxos Internos

```
Input: { query, has_ca, ca_numero, ca_nome_comercial, query_semantica }
  ↓
┌─ Monta caQuery (se has_ca) = "Nome CA 12345"
│  ↓
│  Busca Google Shopping (SerpApi)
│  ↓
│  Filtra: Título contém "12345"?
│  ↓
│  Se resultados > 0 → Retorna (PLANO RADICAL)
│  Se resultados = 0 E has_ca → Retorna vazio (SEM FALLBACK)
└─ Se !has_ca → Tenta Smart Query → Tenta Fallback Simples

Paralelo: Busca PNCP com melhor query
  ↓
Combina resultados
  ↓
Ordena por preço
  ↓
Retorna top 3 + top 5 PNCP
```

---

## Dependências

### Dependências Externas
- **SerpApi** (Google Shopping)
  - Variável: `SERPAPI_KEY`
  - Quota: Depende do plano
- **PNCP API** (via M5)
  - Pública, sem autenticação

### Dependências Internas
- **M5 (PNCP Client):** `lib/pncp.js`

---

## Arquivos Envolvidos

- **`lib/price-search.js`** - Lógica principal (~200 linhas)
- **`app/api/prices/route.js`** - Endpoint HTTP
- **`scripts/test-price-priority.js`** - Teste de priorização CA
- **`scripts/debug-market-search.js`** - Debug de busca

---

## Estado Atual

### ✅ Implementado
- Busca exata por CA com filtro rigoroso
- Smart Query (extração de keywords)
- Busca paralela PNCP
- Plano Radical (sem fallback para CA)
- Filtros de relevância em camadas

### 🟡 Ajustes Recentes
- **Commit `8f7e7e8`:** Filtro estrito de CA no título
- **Commit `26896ee`:** Desabilita fallback se busca foi por CA
- **Commit `7b89c08`:** Smart Query com extração de keywords

---

## Problemas Conhecidos

### 1. Filtro de CA Muito Restritivo
- **Problema:** Pode retornar zero resultados para CAs antigos não anunciados explicitamente
- **Exemplo:** CA 40377 (antigo) pode não aparecer em títulos de lojas
- **Solução Atual:** Retorna mensagem "Cotação não encontrada para este CA"
- **Solução Proposta:** Implementar busca por fabricante + modelo como fallback secundário

### 2. Smart Query Pode Não Capturar Todas as Nuances
- **Problema:** Keywords extraídas podem não cobrir todas as especificações técnicas
- **Exemplo:** "Botina com tratamento antiestático" → Keyword "antiestático" pode não ser extraída
- **Solução Proposta:** Expandir lista de keywords técnicas

---

## Decisões Técnicas Registradas

### 1. Plano Radical (Sem Fallback para CA)
- **Data:** 2025-12-10
- **Decisão:** Se busca foi por CA e não encontrou, retornar vazio (sem tentar modelo genérico)
- **Justificativa:** Evitar "gato por lebre" (ex: Botina Bico Plástico vs Bico Composite)
- **Commit:** `26896ee`

### 2. Filtro Estrito de CA no Título
- **Data:** 2025-12-10
- **Decisão:** Validar se número do CA está presente no título do anúncio
- **Justificativa:** Google retorna resultados genéricos mesmo com CA na query
- **Commit:** `8f7e7e8`

### 3. Smart Query com Extração de Keywords
- **Data:** 2025-12-10
- **Decisão:** Extrair características técnicas (biqueira, solado, material) da descrição
- **Justificativa:** Nome comercial genérico ("Botina Nobuck") traz produtos muito variados
- **Commit:** `7b89c08`

---

## Próximos Passos

### Curto Prazo
- [ ] Monitorar taxa de "Cotação não encontrada" em produção
- [ ] Coletar feedback de usuários sobre precisão de resultados
- [ ] Ajustar lista de keywords técnicas baseado em casos reais

### Médio Prazo
- [ ] Implementar fallback secundário (fabricante + modelo) para CAs antigos
- [ ] Adicionar filtro de relevância por similaridade de texto (ex: Levenshtein)
- [ ] Integrar com mais fontes de preço (Mercado Livre, B2W)

### Longo Prazo
- [ ] Machine Learning para ranqueamento de resultados
- [ ] Detecção automática de produtos equivalentes (mesmo produto, CAs diferentes)

---

## Impacto no Sistema

### Módulos Dependentes
- **M6, M7, M8:** Todas as interfaces de cotação dependem de M4
- **M1:** Fornece `query_semantica` para M4

### Impacto de Falha
- **Severidade:** ALTA
- **Consequência:** Sistema não consegue cotar preços (funcionalidade core)
- **Mitigação:** Retry automático (3 tentativas), fallback para PNCP apenas

### Métricas de Sucesso
- **Taxa de Cotação Bem-Sucedida:** >80%
- **Precisão de Resultados:** >90% (validação manual de amostra)
- **Tempo de Resposta:** <3s

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas

### Erros Cometidos

1. **Fallback Genérico Causando "Gato por Lebre"**
   - **Erro:** Buscar por nome comercial genérico quando CA não encontrado
   - **Sintoma:** Retornar "Botina Bico Plástico" quando usuário pediu "Botina Bico Composite CA 40377"
   - **Impacto:** Cotações imprecisas, produtos tecnicamente diferentes
   - **Data:** 2025-12 (antes do Plano Radical)

2. **Confiar no Google Shopping Sem Filtro**
   - **Erro:** Assumir que Google retornaria apenas resultados com CA mencionado
   - **Sintoma:** Google retornava produtos similares sem o CA específico
   - **Impacto:** Cotações de produtos errados
   - **Data:** 2025-12

### Ajustes que Funcionaram

1. **Plano Radical - Busca Estrita por CA (Commit 26896ee)**
   - **Solução:** Se busca foi por CA, NÃO fazer fallback genérico
   - **Resultado:** Zero "falsos positivos", apenas CAs exatos ou nada
   - **Data:** 2025-12-10

2. **Filtro Pós-Busca de CA no Título (Commit 8f7e7e8)**
   - **Solução:** Validar se número do CA está presente no título do anúncio
   - **Código:** `results.filter(r => r.title.includes(caNumber))`
   - **Resultado:** Eliminou produtos similares retornados pelo Google
   - **Data:** 2025-12-10

3. **Smart Query com Extração de Keywords (Commit 7b89c08)**
   - **Solução:** Extrair características técnicas (biqueira, solado, material) da descrição
   - **Resultado:** Fallback mais preciso para buscas sem CA
   - **Data:** 2025-12-10

### Ajustes que Não Funcionaram

1. **Fallback por Fabricante + Modelo**
   - **Abordagem:** Se CA não encontrado, buscar por "Fabricante Modelo"
   - **Problema:** Fabricantes têm múltiplos modelos com especificações diferentes
   - **Resultado:** Ainda retornava produtos incorretos, descartado
   - **Data:** 2025-12

2. **Busca Semântica com Similaridade de Texto**
   - **Abordagem:** Usar algoritmo de similaridade para ranquear resultados
   - **Problema:** Complexidade alta, latência aumentada, precisão não melhorou significativamente
   - **Resultado:** Descartado em favor de filtro simples de CA
   - **Data:** 2025-12

### Práticas que NÃO Devem Ser Repetidas

1. **Priorizar Recall Sobre Precisão em Cotações**
   - **Problema:** Tentar "sempre retornar algo" mesmo que impreciso
   - **Consequência:** Usuários recebiam cotações de produtos errados
   - **Lição:** Em cotações de preço, PRECISÃO é mais importante que RECALL. Melhor retornar vazio do que retornar errado.

2. **Confiar em APIs Externas Sem Validação**
   - **Problema:** Assumir que Google Shopping retorna apenas resultados relevantes
   - **Consequência:** Produtos similares mas incorretos
   - **Lição:** Sempre filtrar e validar resultados de APIs externas

3. **Não Comunicar Limitações ao Usuário**
   - **Problema:** Mensagem genérica "Nenhum preço encontrado"
   - **Consequência:** Usuário não entendia por que não havia resultados
   - **Lição:** Mensagem específica "Cotação não encontrada para este CA. Plano Radical ativo." educa o usuário

