# M5 – Módulo PNCP (Referências Governamentais)

**Versão:** 1.0  
**Data:** 2025-12-10  
**Estado:** ✅ PRONTO

---

## Visão Geral

Cliente para busca de preços históricos no Portal Nacional de Contratações Públicas (PNCP). Fornece referências de preços praticados em licitações governamentais.

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M5 - Módulo PNCP (Referências Governamentais)

**Papel Estratégico:**  
M5 fornece referências de preços históricos praticados em licitações públicas brasileiras, permitindo que o sistema O Licitador ofereça não apenas preços de mercado (M4), mas também benchmarks oficiais de compras governamentais. Isso aumenta a confiabilidade das cotações e facilita a justificativa de preços em processos licitatórios.

**Funcionamento Operacional:**  
M5 recebe uma query otimizada (produto + especificações). Faz requisição HTTP GET para a API pública do PNCP (Portal Nacional de Contratações Públicas). A API retorna lista de licitações que mencionam o produto. M5 extrai órgão comprador, valor unitário e data da licitação, ordena por data (mais recente primeiro), limita a top 5 resultados e retorna array formatado.

**Interações com Outros Módulos:**  
- **Depende de:** API PNCP (pública, externa, sem autenticação)
- **É usado por:** M4 (Busca de Preços) que chama M5 em paralelo com a busca no Google Shopping

**Status Atual:**  
✅ PRONTO - Funcional, mas sujeito a instabilidade da API governamental

---

## Funções do Módulo

1. **Busca de Preços no PNCP**
   - Input: Query otimizada (produto + especificações)
   - Output: Lista de licitações com preços, órgãos, datas
   - Método: HTTP GET para API pública do PNCP

2. **Formatação de Resultados**
   - Extrai: Órgão comprador, valor unitário, data da licitação
   - Ordena: Por data (mais recente primeiro)
   - Limita: Top 5 resultados

---

## Dependências

### Externas
- **PNCP API:** Pública, sem autenticação
- **Endpoint:** `https://pncp.gov.br/api/...` (verificar URL exata)

### Internas
- Nenhuma (módulo standalone, chamado por M4)

---

## Arquivos

- **`lib/pncp.js`** - Cliente PNCP (~100 linhas)

---

## Estado Atual

✅ Implementado e funcional  
⚠️ API PNCP pode estar lenta ou instável (fora do controle)

---

## Problemas Conhecidos

1. **Instabilidade da API PNCP**
   - Problema: API governamental pode ter downtime
   - Solução: Timeout de 10s, retorna array vazio se falhar

2. **Resultados Genéricos**
   - Problema: Query genérica retorna licitações não relacionadas
   - Solução: Depende de query otimizada de M1/M4

---

## Próximos Passos

- [ ] Monitorar taxa de sucesso da API
- [ ] Implementar cache de resultados PNCP (TTL 24h)
- [ ] Adicionar filtro de relevância (similaridade de descrição)

---

## Impacto

- **Dependentes:** M4 (busca paralela)
- **Severidade de Falha:** BAIXA (não bloqueia cotação de mercado)
- **Métrica:** Taxa de sucesso >70%

---

**Última Atualização:** 2025-12-10

---

## Histórico de Erros, Ajustes e Lições Aprendidas

### Erros Cometidos
1. **Não Implementar Timeout Adequado**
   - API PNCP pode ser lenta (>10s), sem timeout causava travamento
   - Solução: Timeout de 10s implementado

### Ajustes que Funcionaram
1. **Retornar Array Vazio em Caso de Falha**
   - Não bloqueia cotação de mercado (M4) se PNCP falhar
   - Sistema continua funcional mesmo com API governamental instável

### Ajustes que Não Funcionaram
1. **Retry Automático para PNCP**
   - Tentativa de retry aumentava latência sem melhorar taxa de sucesso
   - Descartado em favor de timeout único

### Práticas que NÃO Devem Ser Repetidas
1. **Depender Criticamente de API Governamental**
   - APIs governamentais são instáveis por natureza
   - Lição: PNCP deve ser sempre complementar, nunca crítico

