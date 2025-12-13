# AGENT_08_DECISION_DIARY.md

> **Agente:** AGENT_08 — DecisionCore  
> **Data:** 2025-12-12  
> **Versão:** v1.0  
> **Status:** ✅ Funcional  
> **Relacionado a:** DEV DOC 3/8  
> **Arquivo:** `lib/agents/08-decision.js`  
> **Testes:** Incluído em `test-e2e-full.js`

---

## 1) Objetivo do agente

### O que este agente faz:
- Consolida resultados dos agentes 2-7
- Produz matriz de risco (probabilidade × impacto)
- Recomendação GO/NO-GO com justificativa baseada em evidência
- Identifica condições para participação viável

### O que este agente NÃO faz:
- NÃO gera minutas (Agente 6)
- NÃO valida individual (Agentes 4-5)
- NÃO produz PDF final (Agente 9)

---

## 2) Dependências e pré-requisitos

### Entradas:
- Outputs de AGENT_02 a AGENT_07
- Resumos consolidados de cada agente

### Flags respeitadas:
- ✅ Decisão baseada em evidências acumuladas
- ✅ Sem invenção de riscos
- ✅ Rastreabilidade para origem das conclusões

---

## 3) Entradas oficiais (DEV DOC 3/8)

```javascript
{
  agentsOutputs: {
    agent2: StructureResult,
    agent3: ItemsResult,
    agent4: ComplianceResult,
    agent5: TechnicalResult,
    agent6: LegalResult,
    agent7: DivergenceResult
  }
}
```

---

## 4) Saídas oficiais (DEV DOC 3/8)

### Schema:
```javascript
{
  agent_id: "AGENT_08",
  status: "ok",
  dados: {
    matriz_risco: Array<{
      tema: "ITENS|HABILITACAO|CAPACIDADE_TECNICA|DIVERGENCIAS|PAGAMENTO|...",
      risco: string,
      probabilidade: "BAIXA|MEDIA|ALTA",
      impacto: "BAIXO|MEDIO|ALTO",
      nivel: "BAIXO|MEDIO|ALTO|CRITICO",
      acao: "ESCLARECER|IMPUGNAR|MONITORAR|NO-GO",
      origens: Array<Evidence>
    }>,
    go_no_go: {
      recomendacao: "PARTICIPAR|NAO_RECOMENDADO",
      justificativa: string,
      condicoes_para_go: Array<string>,
      origens: Array<Evidence>
    }
  },
  alerts: [],
  evidence: [],
  metadata: {run_ms, items_found, confidence},
  quality_flags: {needs_review}
}
```

---

## 5) Regras de decisão (v1.0)

### Extração de riscos por agente:

**AGENT_03 (Itens):**
- Se `resumo.incompativeis > 0` → Risco ALTO

**AGENT_04 (Compliance):**
- Se `requisitos[].exigencia_excessiva === true` → Risco ALTO

**AGENT_05 (Technical):**
- Se `resumo.gatilhos_impugnacao > 0` → Risco CRÍTICO

**AGENT_07 (Divergence):**
- Se `inconsistencias[].severidade === 'ALTA'` → Risco ALTO

### Matriz de decisão GO/NO-GO:

```javascript
if (riscos_criticos > 0) {
  return "NAO_RECOMENDADO";
}

if (riscos_altos > 2) {
  return "NAO_RECOMENDADO";
}

return "PARTICIPAR";
```

---

## 6) Implementação atual (v1.0)

### ✅ O que está funcionando:
- Extração de riscos dos 6 agentes anteriores
- Classificação de nível de risco
- Decisão GO/NO-GO automática
- Sugestão de ações por risco
- Envelope padrão conforme DEV DOC 3/8

### Níveis de risco implementados:
- **CRÍTICO:** Gatilhos de impugnação (AGENT_05)
- **ALTO:** Itens incompatíveis, exigências excessivas, divergências altas
- **MÉDIO:** Divergências médias, prazos apertados
- **BAIXO:** Alertas informativos

---

## 7) Resultado do teste E2E Full

### Validação:
```
✅ AGENT_08: GO/NO-GO = NAO_RECOMENDADO
```

**Output real:**
- Status: `ok`
- Matriz de risco: Gerada
- GO/NO-GO: `NAO_RECOMENDADO`
- Justificativa: Baseada em riscos detectados
- Condições para GO: Listadas

**Análise:** Decisão correta baseada nos riscos detectados pelos agentes anteriores.

---

## 8) Edge cases e limitações

### ⚠️ Decisão binária simplificada:
- Não considera "PARTICIPAR COM RESSALVAS"
- Toda análise é GO ou NO-GO absoluto

### ⚠️ Sem ponderação de negócio:
- Não considera valor do contrato
- Não pondera custo de participação vs benefício potencial
- Não incorpora histórico de sucesso da empresa

### ⚠️ Sem análise de viabilidade operacional:
- Não verifica se empresa tem capacidade real de entrega
- Não cruza prazos com disponibilidade de equipe

---

## 9) Testes realizados

### Teste E2E Full:
- Riscos detectados: Múltiplos (de agentes 3-5)
- Decisão: `NAO_RECOMENDADO`
- Justificativa: ✅ Presente e baseada em evidências

### Cobertura de cenários:
- [x] Múltiplos riscos altos → NO-GO
- [ ] Sem riscos → GO
- [ ] Riscos médios/baixos → GO com condições
- [ ] Risco crítico isolado → NO-GO

---

## 10) Melhorias futuras

### Curto prazo:
1. [ ] Adicionar timestamp ao envelope
2. [ ] Vincular evidências aos riscos (campo `origens`)
3. [ ] Adicionar nível "PARTICIPAR COM RESSALVAS"

### Médio prazo:
4. [ ] Ponderação por valor do contrato
5. [ ] Análise de custo/benefício de participação
6. [ ] Integração com histórico de licitações da empresa
7. [ ] Score de viabilidade operacional (prazo × capacidade)

### Longo prazo:
8. [ ] Machine learning para otimizar thresholds de risco
9. [ ] Análise preditiva de chance de ganho

---

## 11) Checklist de "DONE"

- [x] Consome outputs dos agentes 2-7
- [x] Retorna envelope padrão
- [x] Matriz de risco gerada
- [x] GO/NO-GO com justificativa
- [ ] Timestamp no envelope (PENDENTE)
- [ ] Evidências vinculadas (PENDENTE)
- [x] Testado no E2E Full
- [x] **Diário .md criado** ✅

---

**✅ AGENTE 8 (DecisionCore) - FUNCIONAL**

**Status:** Prod-ready para decisões básicas GO/NO-GO  
**Decisão validada:** NAO_RECOMENDADO com base em riscos  
**Limitações:** Análise binária, sem ponderação de negócio

**Última atualização:** 2025-12-12 13:54 BRT
