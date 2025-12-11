# M3 – Módulo CATMAT (Validação e Busca)

**Versão:** 1.0  
**Data:** 2025-12-10  
**Estado:** ✅ PRONTO

---

## Visão Geral

O **Módulo CATMAT** valida e busca códigos do Catálogo de Materiais (CATMAT) do Governo Federal. Utiliza uma base de dados local (JSON 46MB) para buscas rápidas sem dependência de APIs externas.

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M3 - Módulo CATMAT (Validação e Busca de Catálogo de Materiais)

**Papel Estratégico:**  
M3 garante a padronização de itens licitatórios conforme o Catálogo de Materiais do Governo Federal (CATMAT). Ele valida códigos CATMAT mencionados em descrições, fornece descrições oficiais e classes de materiais, permitindo que o sistema O Licitador alinhe as especificações técnicas com os padrões governamentais e facilite a busca de referências de preços no PNCP.

**Funcionamento Operacional:**  
M3 carrega uma base de dados local (JSON de 46MB com ~50.000 itens CATMAT) em memória (cache global para otimização serverless). Recebe um código CATMAT (ex: "4782") ou texto de busca (ex: "Luva Latex"). Para código exato, faz busca direta no objeto JSON (O(1), <50ms). Para texto, faz full-scan case-insensitive limitado a 20 resultados (<500ms). Retorna objeto com código, descrição, classe e unidade, ou lista de resultados compatíveis.

**Interações com Outros Módulos:**  
- **Depende de:** Arquivo `catmat-db.json` (base local)
- **É usado por:** M1 (Análise Gemini) quando detecta CATMAT na descrição, M8 (Consulta CATMAT) que depende 100% de M3, M4 (Busca de Preços) que usa descrição CATMAT para cotação

**Status Atual:**  
✅ PRONTO - Totalmente funcional e independente de APIs externas

---

## Funções do Módulo

### 1. Busca Exata por Código
- Input: Código CATMAT (ex: "4782")
- Output: Objeto com descrição, classe, unidade
- Tempo: <50ms (busca em memória)

### 2. Busca Textual por Descrição
- Input: Texto livre (ex: "Luva Latex")
- Output: Lista de até 20 resultados compatíveis
- Método: Full-scan com match case-insensitive
- Tempo: <500ms

### 3. Soft Validation
- Se código não encontrado, sugere códigos similares
- Baseado em descrição parcial
- Útil para corrigir erros de digitação

### 4. Preparação de Query PNCP
- Gera query otimizada para busca no PNCP
- Combina código + descrição
- Exemplo: "CATMAT 4782 Luva Procedimento"

---

## Fluxos Internos

```
Input: "4782"
  ↓
Carrega catmat-db.json (cache global)
  ↓
Busca exata por código
  ↓
Se encontrado → Retorna dados
Se não → Soft Validation (busca por descrição)
  ↓
Retorna resultado ou null
```

---

## Dependências

### Dependências Externas
- **Arquivo:** `catmat-db.json` (46MB, ~50.000 itens)
- **Fonte:** Base oficial do CATMAT (atualização manual)

### Dependências Internas
- Nenhuma (módulo standalone)

---

## Arquivos Envolvidos

- **`lib/catmat.js`** - Lógica de busca e validação
- **`app/api/catmat-lookup/route.js`** - Endpoint HTTP
- **`catmat-db.json`** - Base de dados
- **`scripts/test-catmat-api.js`** - Script de teste
- **`scripts/inspect-catmat-json.js`** - Inspeção da base

---

## Estado Atual

### ✅ Implementado
- Busca exata por código
- Busca textual (full-scan)
- Cache global (otimização serverless)
- Soft Validation
- API endpoint `/api/catmat-lookup`

### 🟡 Limitações
- Base de dados pode estar desatualizada (última atualização: desconhecida)
- Full-scan limitado a 20 resultados (performance)
- Sem fuzzy matching (busca exata de substring)

---

## Problemas Conhecidos

### 1. Base de Dados Desatualizada
- **Problema:** CATMAT é atualizado periodicamente pelo governo
- **Impacto:** Códigos novos podem não existir na base
- **Solução Proposta:** Implementar atualização automática (scraping ou API oficial)
- **Frequência de Atualização Recomendada:** Trimestral

### 2. Performance em Buscas Textuais
- **Problema:** Full-scan de 50k itens pode ser lento
- **Solução Atual:** Limite de 20 resultados
- **Solução Proposta:** Implementar índice de busca (ex: Elasticsearch, ou índice invertido simples)

---

## Decisões Técnicas Registradas

### 1. Base Local vs API Externa
- **Decisão:** Usar JSON local em vez de API do governo
- **Justificativa:**
  - API oficial não existe (ou não é pública)
  - Busca local é instantânea (<50ms)
  - Sem dependência de rede
- **Trade-off:** Necessidade de atualização manual

### 2. Cache Global em Serverless
- **Decisão:** Carregar `catmat-db.json` em `global.catmatDB`
- **Justificativa:**
  - Evita recarregar 46MB a cada requisição
  - Funciona em ambiente serverless (Netlify)
  - Reduz tempo de resposta de 2s para 50ms
- **Implementação:** `if (!global.catmatDB) { global.catmatDB = JSON.parse(...) }`

---

## Próximos Passos

### Curto Prazo
- [ ] Verificar data da última atualização da base
- [ ] Testar busca com códigos recentes (2024)
- [ ] Monitorar taxa de "não encontrado"

### Médio Prazo
- [ ] Implementar script de atualização automática da base
- [ ] Adicionar fuzzy matching para busca textual
- [ ] Criar índice de busca para melhorar performance

### Longo Prazo
- [ ] Integração com API oficial do CATMAT (se disponibilizada)
- [ ] Implementar versionamento da base (histórico de mudanças)

---

## Impacto no Sistema

### Módulos Dependentes
- **M1 (Análise Gemini):** Valida CATMAT detectado
- **M8 (Consulta CATMAT):** Depende 100% de M3
- **M4 (Busca de Preços):** Usa descrição CATMAT para cotação

### Impacto de Falha
- **Severidade:** MÉDIA
- **Consequência:** M8 inoperante, M1 retorna análise incompleta
- **Mitigação:** Base local garante alta disponibilidade

### Métricas de Sucesso
- **Taxa de Busca Bem-Sucedida:** >95%
- **Tempo de Resposta:** <100ms
- **Cobertura da Base:** >99% dos CATMATs ativos

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas

### Erros Cometidos

1. **Não Validar Data da Base CATMAT**
   - **Erro:** Não verificar quando `catmat-db.json` foi atualizado pela última vez
   - **Impacto:** Possível desatualização de códigos CATMAT novos
   - **Data:** Descoberto em 2025-12-10

### Ajustes que Funcionaram

1. **Cache Global em Ambiente Serverless**
   - **Solução:** `if (!global.catmatDB) { global.catmatDB = JSON.parse(...) }`
   - **Resultado:** Redução de tempo de resposta de 2s para <50ms
   - **Data:** 2025-11

2. **Limitação de Resultados em Busca Textual**
   - **Solução:** Limitar full-scan a 20 resultados
   - **Resultado:** Performance aceitável mesmo com 50k itens
   - **Data:** 2025-11

### Ajustes que Não Funcionaram

1. **Tentativa de Fuzzy Matching Simples**
   - **Abordagem:** Implementar Levenshtein distance para busca textual
   - **Problema:** Performance inaceitável (>5s para busca)
   - **Resultado:** Descartado em favor de substring exata
   - **Data:** 2025-11

### Práticas que NÃO Devem Ser Repetidas

1. **Não Implementar Versionamento da Base**
   - **Problema:** Sem controle de versão, impossível saber se base está atualizada
   - **Lição:** Adicionar campo `version` e `last_updated` no JSON

