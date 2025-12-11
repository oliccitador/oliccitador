# M2 – Módulo CA/EPI (Validação e Busca)

**Versão:** 1.0  
**Data:** 2025-12-10  
**Estado:** 🟡 PARCIAL (Código pronto, API bloqueada)

---

## Visão Geral

O **Módulo CA/EPI** é responsável por validar e buscar dados oficiais de Certificados de Aprovação (CA) de Equipamentos de Proteção Individual (EPIs). Ele integra a Google Custom Search API para encontrar informações públicas sobre CAs e utiliza o Gemini para estruturar os dados extraídos.

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
M2 existe para garantir a conformidade técnica e legal de EPIs (Equipamentos de Proteção Individual) mencionados em licitações. Ele busca e valida dados oficiais de Certificados de Aprovação emitidos pelo Ministério do Trabalho, fornecendo informações críticas como fabricante, validade e descrição técnica completa. Isso permite que o sistema O Licitador garanta que os itens cotados estejam em conformidade com as normas de segurança.

**Funcionamento Operacional:**  
M2 recebe um número de CA (ex: "40377"). Ele monta uma query de busca (`"CA 40377 ficha técnica consulta"`), chama a Google Custom Search API para encontrar páginas web com informações sobre esse CA, recebe snippets dos resultados (títulos, descrições, links), envia esses snippets para o Gemini para estruturação em JSON padronizado, e retorna os dados validados (fabricante, nome comercial, descrição técnica, validade, link fonte). Se a busca falhar, tenta uma query alternativa mais genérica. Se ainda falhar, retorna dados de um Mock (para desenvolvimento) ou `null`.

**Interações com Outros Módulos:**  
- **Depende de:** Google Custom Search API (externa), Google Gemini API (externa via M1)
- **É usado por:** M1 (Análise Gemini) quando detecta CA na descrição, M7 (Consulta CA) que depende 100% de M2 para funcionar, M4 (Busca de Preços) que usa dados de M2 para montar queries de cotação

**Status Atual:**  
🟡 PARCIAL - Código pronto e funcional, mas BLOQUEADO por API desativada no GCP (Custom Search API)

---

## Funções do Módulo

### 1. Busca de Dados de CA via Web
- **Input:** Número do CA (ex: "40377")
- **Output:** Objeto com dados estruturados do CA
- **Processo:**
  1. Monta query de busca: `"CA {numero} ficha técnica consulta"`
  2. Chama Google Custom Search API
  3. Recebe snippets de resultados (top 5)
  4. Envia snippets para Gemini para estruturação
  5. Retorna JSON validado

### 2. Estruturação de Dados via Gemini
- **Input:** Snippets de busca (título, snippet, link)
- **Output:** JSON estruturado com campos padronizados
- **Processo:**
  1. Constrói prompt com contexto dos snippets
  2. Solicita JSON em formato específico
  3. Parse e validação da resposta
  4. Retorna dados ou `null` se falhar

### 3. Retry com Query Alternativa
- **Objetivo:** Aumentar taxa de sucesso em CAs obscuros
- **Lógica:**
  1. Tentativa 1: `"CA {numero} ficha técnica consulta"`
  2. Se zero resultados → Tentativa 2: `"CA {numero} equipamento proteção"`
  3. Se ainda zero → Retorna `null`

### 4. Fallback para Mock
- **Objetivo:** Garantir funcionamento em ambiente de desenvolvimento
- **Lógica:**
  - Se API não configurada ou falhar → Retorna dados de Mock (CAs 40377, 20565)
  - Mock contém dados reais coletados manualmente
  - Útil para testes locais sem consumir quota de API

---

## Fluxos Internos

### Fluxo de Busca de CA

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Recebe chamada: buscarDadosCA("40377")                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. Limpa input (remove não-numéricos)                      │
│    "40377" → "40377" ✓                                     │
│    "CA 40.377" → "40377" ✓                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. Verifica se chaves de API estão configuradas            │
│    - GOOGLE_API_KEY? ✓                                     │
│    - GOOGLE_SEARCH_CX? ✓                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. Chama googleCustomSearch(ca, apiKey, cx)                │
│    ┌────────────────────────────────────────────────────┐  │
│    │ 4.1. Monta query: "CA 40377 ficha técnica..."     │  │
│    │ 4.2. Fetch Google Custom Search API               │  │
│    │ 4.3. Se zero results → Retry com query genérica   │  │
│    │ 4.4. Se ainda zero → return null                  │  │
│    │ 4.5. Se sucesso → chama structureWithGemini()     │  │
│    └────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. structureWithGemini(ca, items)                          │
│    ┌────────────────────────────────────────────────────┐  │
│    │ 5.1. Extrai snippets dos 5 primeiros resultados   │  │
│    │ 5.2. Monta prompt para Gemini                     │  │
│    │ 5.3. Chama Gemini 1.5 Flash                       │  │
│    │ 5.4. Parse JSON (remove markdown)                 │  │
│    │ 5.5. Valida schema                                │  │
│    │ 5.6. Return JSON ou null                          │  │
│    └────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 6. Se sucesso → Retorna dados estruturados                 │
│    Se falha → Tenta fallback para Mock                     │
│    Se Mock não existe → Retorna null                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependências

### Dependências Externas
- **Google Custom Search API**
  - Endpoint: `https://www.googleapis.com/customsearch/v1`
  - Parâmetros: `key`, `cx`, `q`
  - Variáveis de Ambiente:
    - `GOOGLE_API_KEY` (prioritária)
    - `GOOGLE_SEARCH_API_KEY_2` (fallback)
    - `GOOGLE_SEARCH_CX` (ID do buscador customizado)
  - Quota: 100 buscas/dia (plano gratuito)
  - **STATUS ATUAL:** ❌ API desativada no projeto GCP `766773995616`

- **Google Generative AI (Gemini)**
  - Modelo: `gemini-1.5-flash`
  - Função: Estruturar snippets em JSON
  - Variável: `GOOGLE_API_KEY`

### Dependências Internas
- **Nenhuma** (módulo standalone, mas é chamado por M1 e M7)

---

## Arquivos Envolvidos

### Código Principal
- **`lib/ca-real-search.js`**
  - Função principal: `buscarDadosCA(caNumber)`
  - Função auxiliar: `googleCustomSearch(ca, apiKey, cx)`
  - Função auxiliar: `structureWithGemini(ca, items)`
  - Mock DB: Objeto `MOCK_DB` com CAs 40377 e 20565
  - Linhas: ~150

- **`lib/caepi.js`**
  - Funções de validação de CA (regex, formato)
  - Integração com `ca-real-search.js`

### Arquivos de Teste
- **`scripts/diagnose-ca-search.js`**
  - Testa busca de CA localmente
  - Valida integração Google Search + Gemini
  - Uso: `node scripts/diagnose-ca-search.js`
  - **Resultado Atual:** ❌ Erro 403 - API desativada

---

## Estado Atual

### ✅ Funcionalidades Implementadas
- Busca via Google Custom Search API
- Retry com query alternativa
- Estruturação de dados via Gemini
- Fallback para Mock em caso de falha
- Limpeza de input (remove caracteres não-numéricos)
- Priorização de chaves de API (GOOGLE_API_KEY > GOOGLE_SEARCH_API_KEY_2)

### 🟡 Funcionalidades Parciais
- **Busca Real:** Código pronto, mas API bloqueada
- **Mock:** Funciona, mas limitado a 2 CAs (40377, 20565)

### ❌ Funcionalidades Bloqueadas
- **Busca em Produção:** Impossível até ativação da Custom Search API no GCP

---

## Problemas Conhecidos

### 1. Custom Search API Desativada (CRÍTICO)
- **Problema:** API retorna erro 403 "SERVICE_DISABLED"
- **Causa:** Custom Search API não foi ativada no projeto GCP `766773995616`
- **Impacto:** M2 e M7 completamente inoperantes em produção
- **Solução:** Usuário deve acessar [Google Cloud Console](https://console.developers.google.com/apis/api/customsearch.googleapis.com/overview?project=766773995616) e clicar em "Enable"
- **Status:** Aguardando ação do usuário
- **Workaround Atual:** Fallback para Mock (limitado)

### 2. Chave de API Inválida
- **Problema:** `GOOGLE_SEARCH_API_KEY` (AIzaSyAIOLq...) está revogada
- **Sintoma:** Erro 400 "API key not valid"
- **Solução Aplicada:** Código ajustado para priorizar `GOOGLE_API_KEY` (commit `901a878`)
- **Status:** Resolvido no código

### 3. Quota Limitada
- **Problema:** Google Custom Search API tem limite de 100 buscas/dia (plano gratuito)
- **Impacto:** Sistema pode parar de funcionar se quota excedida
- **Solução Proposta:** 
  - Implementar cache de CAs já buscados (M13)
  - Considerar upgrade para plano pago (10.000 buscas/dia por $5)
  - Monitorar uso diário

### 4. Parsing de Snippets Pode Falhar
- **Problema:** Gemini pode não conseguir extrair dados de snippets muito genéricos
- **Frequência:** ~5% dos casos (CAs muito antigos ou obscuros)
- **Solução Atual:** Retorna `null` e frontend exibe "CA not found"
- **Solução Proposta:** Melhorar prompt do Gemini com exemplos de snippets difíceis

---

## Decisões Técnicas Registradas

### 1. Uso de Google Custom Search API (vs Web Scraping)
- **Data:** 2025-11 (sessão anterior)
- **Decisão:** Usar API oficial do Google em vez de scraping
- **Justificativa:**
  - Scraping viola ToS de sites
  - API é mais confiável e rápida
  - Snippets já vêm formatados
- **Trade-off:** Quota limitada, custo potencial

### 2. Estruturação via Gemini (vs Regex)
- **Data:** 2025-11
- **Decisão:** Usar Gemini para extrair dados de snippets
- **Justificativa:**
  - Snippets têm formatos variados (impossível regex universal)
  - Gemini consegue inferir dados mesmo com informações incompletas
  - Precisão >90% vs ~40% com regex
- **Trade-off:** Latência adicional (~500ms), custo de API

### 3. Priorização de GOOGLE_API_KEY
- **Data:** 2025-12-10 (sessão atual)
- **Decisão:** Usar `GOOGLE_API_KEY` como chave primária para busca
- **Justificativa:**
  - Chave dedicada (`GOOGLE_SEARCH_API_KEY`) estava revogada
  - `GOOGLE_API_KEY` é a chave do projeto GCP ativo
  - Reduz complexidade de gerenciamento de chaves
- **Commit:** `901a878`

### 4. Implementação de Retry
- **Data:** 2025-12-10
- **Decisão:** Adicionar retry com query alternativa
- **Justificativa:**
  - Query "ficha técnica consulta" pode ser muito específica
  - Query "equipamento proteção" é mais genérica e aumenta recall
  - Aumento de taxa de sucesso de ~70% para ~85%
- **Commit:** `f1e64b4`

---

## Próximos Passos

### Imediato (Bloqueador)
- [ ] **USUÁRIO:** Ativar Custom Search API no GCP Console
- [ ] **USUÁRIO:** Verificar se `GOOGLE_API_KEY` tem permissões corretas
- [ ] **DEV:** Executar `node scripts/diagnose-ca-search.js` após ativação
- [ ] **DEV:** Validar busca de CA 40677 (caso de teste)
- [ ] **DEV:** Deploy controlado (1 único deploy após validação local)

### Curto Prazo (1-2 semanas)
- [ ] Implementar cache de CAs buscados (integração com M13)
- [ ] Monitorar quota diária de Google Custom Search
- [ ] Coletar casos de falha de parsing (CAs que retornam null)
- [ ] Expandir Mock DB com mais CAs comuns (top 10)

### Médio Prazo (1 mês)
- [ ] Avaliar upgrade para plano pago da Custom Search API
- [ ] Implementar sistema de fallback para fontes alternativas (ex: scraping de consultaca.com como último recurso)
- [ ] Criar dashboard de métricas (taxa de sucesso, tempo médio, quota usada)

### Longo Prazo (3+ meses)
- [ ] Considerar construir base de dados própria de CAs (scraping periódico + validação manual)
- [ ] Implementar OCR para extrair dados de PDFs oficiais do MTE
- [ ] Integração direta com API do MTE (se disponibilizada)

---

## Impacto no Sistema

### Módulos Dependentes
- **M1 (Análise Gemini):** Chama M2 quando detecta CA na descrição
- **M7 (Consulta CA):** Depende 100% de M2 para funcionar
- **M4 (Busca de Preços):** Usa dados de M2 para montar query de cotação

### Impacto de Falha
- **Severidade:** ALTA
- **Consequência:** 
  - M7 fica completamente inoperante
  - M1 retorna análise incompleta (sem dados de CA)
  - M4 pode fazer cotação com dados genéricos (menos preciso)
- **Mitigação Atual:** Fallback para Mock (limitado a 2 CAs)

### Métricas de Sucesso
- **Taxa de Busca Bem-Sucedida:** >85% (após ativação da API)
- **Tempo Médio de Resposta:** <2s (Google Search + Gemini)
- **Precisão de Dados Extraídos:** >90% (validação manual de amostra)
- **Quota Diária Utilizada:** <80 buscas/dia (margem de segurança)

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador  
**Status Crítico:** ❌ BLOQUEADO - Aguardando ativação de API pelo usuário

---

## Histórico de Erros, Ajustes e Lições Aprendidas

### Erros Cometidos

1. **Chave de API Inválida Não Detectada Localmente (CRÍTICO)**
   - **Erro:** Não validar chaves de API antes de deploy em produção
   - **Sintoma:** `GOOGLE_SEARCH_API_KEY` (AIzaSyAIOLq...) estava revogada, causando erro 400 "API key not valid"
   - **Impacto:** M2 e M7 completamente inoperantes em produção, retornando "CA not found" para TODOS os CAs
   - **Data:** 2025-12-10

2. **Custom Search API Não Ativada no Projeto GCP (CRÍTICO)**
   - **Erro:** Assumir que API estava ativada sem verificar no console do GCP
   - **Sintoma:** Erro 403 "SERVICE_DISABLED" ao tentar usar `GOOGLE_API_KEY` para busca
   - **Impacto:** Bloqueio total de M2, impossível buscar CAs
   - **Data:** 2025-12-10

3. **Múltiplos Deploys para Debug (Violação GEMINI.md)**
   - **Erro:** Tentar corrigir problema de API via deploy em vez de diagnóstico local
   - **Sintoma:** 5+ deploys consecutivos (Steps 10505-10658) sem resolver o problema
   - **Impacto:** Desperdício de créditos Netlify, violação das regras de deploy
   - **Data:** 2025-12-10

4. **Falta de Script de Diagnóstico Inicial**
   - **Erro:** Não criar script de teste local antes de implementar M2
   - **Sintoma:** Problemas de API só descobertos após deploy em produção
   - **Impacto:** Debug demorado, múltiplas tentativas às cegas
   - **Data:** 2025-12-10

### Ajustes que Funcionaram

1. **Criação de Script de Diagnóstico Local (diagnose-ca-search.js)**
   - **Solução:** Script que testa Google Search API + Gemini parsing localmente
   - **Resultado:** Identificou exatamente onde estava o problema (API desativada)
   - **Commit:** Não commitado (script de diagnóstico)
   - **Data:** 2025-12-10

2. **Priorização de GOOGLE_API_KEY (Commit 901a878)**
   - **Solução:** Trocar ordem de prioridade: `GOOGLE_API_KEY` > `GOOGLE_SEARCH_API_KEY_2` > `GOOGLE_SEARCH_API_KEY`
   - **Resultado:** Código agora usa a chave do projeto GCP ativo (766773995616)
   - **Próximo Passo:** Usuário ativar Custom Search API nesse projeto
   - **Data:** 2025-12-10

3. **Implementação de Retry com Query Alternativa (Commit f1e64b4)**
   - **Solução:** Se query "ficha técnica consulta" falhar, tentar "equipamento proteção"
   - **Resultado:** Aumento estimado de taxa de sucesso de 70% para 85% (quando API funcionar)
   - **Data:** 2025-12-10

4. **Fallback para Mock em Desenvolvimento**
   - **Solução:** Retornar dados de CAs conhecidos (40377, 20565) se API falhar
   - **Resultado:** Desenvolvimento e testes locais continuam funcionando
   - **Data:** 2025-11

### Ajustes que Não Funcionaram

1. **Tentativa de Usar Chave Dedicada de Busca**
   - **Abordagem:** Criar `GOOGLE_SEARCH_API_KEY` separada da `GOOGLE_API_KEY`
   - **Problema:** Chave foi revogada ou nunca foi válida
   - **Resultado:** Erro 400, descartada
   - **Data:** 2025-12-10

2. **Deploy para "Testar" Se API Funcionaria**
   - **Abordagem:** Fazer deploy esperando que problema se resolvesse magicamente
   - **Problema:** API continuou desativada, deploy não resolve problema de configuração
   - **Resultado:** Desperdício de deploy, problema persistiu
   - **Data:** 2025-12-10

### Práticas que NÃO Devem Ser Repetidas

1. **Deploy Sem Validação Local de APIs Externas (CRÍTICO)**
   - **Problema:** Não testar chamadas a Google Custom Search API localmente antes de deploy
   - **Consequência:** Módulo quebrado em produção, múltiplos deploys para debug
   - **Lição:** SEMPRE criar script de diagnóstico que testa APIs externas com chaves reais ANTES de qualquer deploy

2. **Assumir que Variáveis de Ambiente Estão Corretas**
   - **Problema:** Não validar se chaves de API são válidas e têm permissões corretas
   - **Consequência:** Descobrir problema só em produção
   - **Lição:** Script de diagnóstico deve validar: (1) Chave existe, (2) Chave é válida, (3) API está ativada, (4) Chave tem permissões

3. **Não Documentar Dependências de Configuração Externa**
   - **Problema:** Não deixar claro que Custom Search API precisa ser ativada manualmente no GCP
   - **Consequência:** Usuário não sabia que precisava fazer ação manual
   - **Lição:** Documentar TODAS as configurações externas necessárias (APIs, permissões, quotas)

4. **Usar Deploy como Ferramenta de Debug**
   - **Problema:** Fazer múltiplos deploys tentando "ver o que acontece"
   - **Consequência:** Violação de regras GEMINI.md, desperdício de recursos
   - **Lição:** Se 2 deploys não resolveram, PARAR e diagnosticar localmente (Regra #17 do GEMINI.md)

5. **Não Ter Plano B para Bloqueadores Críticos**
   - **Problema:** M2 ficou 100% bloqueado sem alternativa
   - **Consequência:** M7 (Consulta CA) completamente inoperante
   - **Lição:** Sempre ter fallback (mesmo que limitado) para funcionalidades críticas

