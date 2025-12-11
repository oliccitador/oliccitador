# M2 – Módulo CA/EPI (Validação e Busca)

**Versão:** 2.0  
**Data:** 2025-12-11  
**Estado:** ✅ FUNCIONAL (Produção)
**Commit:** `2fe5cc6`

---

## CHANGELOG

### 2025-12-11 - v2.0 - Commit 2fe5cc6
- ✅ **Migração para SerpApi:** Substituição completa da Google Custom Search API
- ✅ **Scraping Direto:** Implementado scraping de consultaca.com como fonte primária
- ✅ **Fix Build Netlify:** Substituição cheerio → node-html-parser (compatibilidade SSR)
- ✅ **Filtro Brasileiro:** Apenas sites `.br` e marketplaces brasileiros conhecidos
- ✅ **Sistema Anti-Crash:** Fallback robusto em 3 camadas garante resposta sempre
- ⚠️ **Limitação Conhecida:** ConsultaCA.com bloqueia scraping (403), fallback ativo

---

## Visão Geral

O **Módulo CA/EPI** é responsável por validar e buscar dados oficiais de Certificados de Aprovação (CA) de Equipamentos de Proteção Individual (EPIs). Utiliza **scraping direto** em fonte oficial e **SerpApi** para busca web, com estruturação via **Gemini AI**.

### Objetivo
Fornecer dados oficiais e confiáveis sobre CAs mencionados em descrições de itens licitatórios, incluindo:
- Fabricante oficial
- Nome comercial do produto
- Descrição técnica completa
- Validade do CA
- Link da fonte de informação

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M2 - Módulo CA/EPI (Validação e Busca de Certificados de Aprovação)

**Papel Estratégico:**  
M2 garante a conformidade técnica e legal de EPIs mencionados em licitações. Busca e valida dados oficiais de Certificados de Aprovação emitidos pelo Ministério do Trabalho, fornecendo informações críticas como fabricante, validade e descrição técnica completa.

**Funcionamento Operacional (Atualizado v2.0):**  
M2 recebe um número de CA (ex: "20565"). Tenta 3 estratégias em sequência:

1. **Scraping Direto:** Acessa `https://consultaca.com/{CA}` e faz parse do HTML
2. **Busca Ampla SerpApi:** Query `"CA {numero}"` no Google, retorna snippets
3. **Estruturação IA:** Gemini 2.0 interpreta snippets e retorna JSON estruturado
4. **Fallback Mock:** Se tudo falhar, retorna dados de CAs conhecidos (dev)

**Interações com Outros Módulos:**  
- **Depende de:** SerpApi (web search), Google Gemini 2.0, node-html-parser
- **É usado por:** M1 (Análise Gemini), M7 (ConsultaCA interface), M4 (Busca de Preços)

**Status Atual:**  
✅ FUNCIONAL - Em produção (Netlify), scraping + fallback ativo

---

## Funções do Módulo

### 1. Scraping Direto de ConsultaCA.com (Estratégia Principal)
- **Input:** Número do CA
- **Output:** Dados estruturados do CA
- **Processo:**
  1. Acessa `consultaca.com/{CA}`
  2. Parse HTML com node-html-parser
  3. Extrai: fabricante, nome, descrição, validade de tabelas/parágrafos
  4. Retorna objeto estruturado
- **Limitação:** Site pode bloquear (403) → cai em fallback automático

### 2. Busca Via SerpApi (Fallback Camada 2)
- **Input:** Número do CA
- **Output:** Snippets de resultados do Google
- **Processo:**
  1. Query: `"CA {numero}"` (ampla)
  2. Se zero resultados → `"CA {numero} EPI"`
  3. Filtra apenas sites brasileiros (.br)
  4. Retorna top 10 snippets
  5. Envia para Gemini estruturar

### 3. Estruturação via Gemini 2.0 (Fallback Camada 3)
- **Input:** Snippets de busca
- **Output:** JSON estruturado
- **Modelo:** `gemini-2.0-flash-exp`
- **Prompt:** Instruído a aceitar dados de anúncios, PDFs, lojas
- **Fallback:** Se parse falhar, retorna dados brutos do snippet

### 4. Mock Database (Emergência)
- **Objetivo:** Garantir funcionamento em dev/testes
- **CAs Disponíveis:** 40377, 20565
- **Uso:** Apenas se tudo falhar

---

## Arquivos Principais

### Código
- **`lib/ca-real-search.js`** (Principal)
  - Função `buscarDadosCA(caNumber)` (export)
  - Função `scrapeConsultaCA(cleanCA)` (interna - scraping)
  - Função `structureWithGemini(ca, items)` (interna - IA)
  
### Dependências
```json
{
  "node-html-parser": "^6.x",
  "@google/generative-ai": "^latest",
  "SerpApi": "via lib/serpapi.js"
}
```

### Variáveis de Ambiente
```env
GOOGLE_API_KEY=          # Gemini API
SERPAPI_KEY=             # SerpApi web search
```

**Nota:** Variáveis antigas removidas:
- ~~`GOOGLE_SEARCH_API_KEY_M2`~~ (descontinuado)
- ~~`GOOGLE_SEARCH_CX`~~ (descontinuado)

---

## Fluxo de Execução (v2.0)

```
┌─────────────────────────────────────────────────────────┐
│ buscarDadosCA("20565")                                  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ ESTRATÉGIA 1: Scraping Direto                          │
│ consultaca.com/20565                                    │
└────────┬─────────────────────┬──────────────────────────┘
         │ ✅ Sucesso          │ ❌ 403/404
         │                     │
         ▼                     ▼
    [Retorna Dados]   ┌────────────────────────────────┐
                      │ ESTRATÉGIA 2: SerpApi          │
                      │ Query: "CA 20565"              │
                      └────────┬────────────┬──────────┘
                               │ Resultados │ Zero
                               │            │
                               ▼            ▼
                      ┌─────────────┐  ┌──────────┐
                      │ GEMINI 2.0  │  │  Mock DB │
                      │ Estrutura   │  │  Retorna │
                      └──────┬──────┘  └────┬─────┘
                             │              │
                             ▼              ▼
                        [JSON]          [Fallback]
```

---

## Problemas Conhecidos

### ⚠️ Ativos (v2.0)

1. **ConsultaCA.com Bloqueio (403)**
   - **Descrição:** Site bloqueia scraping direto
   - **Impacto:** Fallback para SerpApi (mais lento, menos preciso)
   - **Workaround:** Rotação de User-Agents (futuro)
   - **Status:** Fallback funcionando

2. **Qualidade Variável do Fallback**
   - **Descrição:** SerpApi pode retornar resultados irrelevantes
   - **Exemplo:** CA em contextos não-EPI (capas de estepe, etc)
   - **Mitigação:** Filtro de sites BR + prompt IA específico
   - **Status:** Aceitável

3. **Sem Cache Implementado**
   - **Descrição:** Cada consulta consome API
   - **Impacto:** Custo desnecessário em buscas repetidas
   - **Solução:** Implementar cache 24h (futuro)
   - **Status:** Planejado

### ✅ Resolvidos (v2.0)

1. ~~**Google Custom Search API Desativada**~~ → Migrado para SerpApi
2. ~~**Build Netlify (Cheerio)**~~ → Substituído por node-html-parser
3. ~~**GOOGLE_SEARCH_CX Inválido**~~ → Não usa mais CX

---

## Lições Aprendidas

### Técnicas

1. **Cheerio + Netlify = Incompatível**
   - Cheerio usa classe `File` (browser-only)
   - Netlify build roda em Node.js puro
   - **Solução:** node-html-parser (100% Node.js)

2. **Scraping Governamental é Instável**
   - Sites oficiais bloqueiam scraping agressivamente
   - **Solução:** Fallback multi-camadas obrigatório

3. **Filtro Geográfico é Crítico**
   - Busca global traz resultados irrelevantes
   - **Solução:** Filtro `.br` + lista branca de sites

### Estratégicas

4. **Precisão > Cobertura para Dados Oficiais**
   - Melhor retornar "não encontrado" que dados errados
   - Fallback deve ser claro sobre limitações

5. **Dependencies Matter**
   - Escolher bibliotecas SSR-compatible desde o início
   - Evitar alternadores manual cheerio → alternatives

---

## Testes

### Cenário de Teste 1: CA Comum (Mock)
```javascript
const result = await buscarDadosCA('40377');
// Esperado: Dados completos via scraping ou mock
```

### Cenário de Teste 2: CA Real (Produção)
```javascript
const result = await buscarDadosCA('20565');
// Esperado: Fallback SerpApi + Gemini (se consultaca bloqueado)
```

### Cenário de Teste 3: CA Inválido
```javascript
const result = await buscarDadosCA('99999999');
// Esperado: null (após esgotar todas estratégias)
```

---

## Dependências Externas

1. **SerpApi**
   - **Tipo:** API Comercial
   - **Quota:** 5000 buscas/mês (plano Dev)
   - **Custo:** $50/mês
   - **Criticidade:** ALTA (fallback principal)

2. **Google Gemini API**
   - **Tipo:** API Google Cloud
   - **Modelo:** gemini-2.0-flash-exp
   - **Quota:** Free tier 60 req/min
   - **Criticidade:** MÉDIA (tem fallback bruto)

3. **ConsultaCA.com**
   - **Tipo:** Site Público (não-oficial)
   - **Quota:** Ilimitada (mas bloqueia)
   - **Criticidade:** BAIXA (nice-to-have)

---

## Próximos Passos Recomendados

1. **Cache de 24h:** Economizar chamadas repetidas
2. **Rotação User-Agent:** Evitar bloqueio consultaca.com
3. **API Oficial MTE:** Investigar se existe API governamental
4. **Monitoramento:** Alertas se fallback ativado > 80% do tempo
5. **Curadoria Manual:** Interface para adicionar CAs manualmente

---

**Última Atualização:** 2025-12-11  
**Responsável:** Sistema Automático  
**Versão do Documento:** 2.0
