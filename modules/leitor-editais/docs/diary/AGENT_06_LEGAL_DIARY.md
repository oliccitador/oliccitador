# AGENT_06_LEGAL_DIARY.md

> **Agente:** AGENT_06 — LegalMindEngine  
> **Data:** 2025-12-12  
> **Versão:** v1.0 (BÁSICO)  
> **Status:** ⚠️ Parcial - Implementação básica funcional  
> **Relacionado a:** DEV DOC 3/8 + DEV DOC 4/8 + DEV DOC 5/8  
> **Arquivo:** `lib/agents/06-legal.js`  
> **Testes:** Incluído em `test-e2e-full.js`

---

## 1) Objetivo do agente

### O que este agente faz:
- Responde perguntas do usuário usando APENAS evidências do CORPUS
- Gera minutas (esclarecimento/impugnação) com template fixo
- **REGRA CRÍTICA:** SOMENTE gera minuta quando houver gatilho + evidência
- Lista fundamentos legais aplicáveis SEM extrapolar fatos

### O que este agente NÃO faz:
- NÃO decide participação (Agente 8)
- NÃO valida habilitação/técnico (Agentes 4 e 5)
- NÃO consolida relatório (Agente 9)
- **NÃO inventa minutas sem gatilho comprovado**

---

## 2) Dependências e pré-requisitos

### Entradas:
- `CORPO_INTEGRADO` (texto completo + evidências)
- `alerts[]` dos agentes 4, 5 e 7 (gatilhos para minutas)
- `userQuestions[]` (opcional)

### Flags respeitadas:
- ✅ **Anti-alucinação CRÍTICA:** Minuta SOMENTE com gatilho + evidência
- ⚠️ Ausência: Retorna "SEM DADOS NO ARQUIVO" (implementação básica)
- ⚠️ Rastreabilidade: Limitada na v1.0

---

## 3) Entradas oficiais (DEV DOC 3/8)

```javascript
{
  corpoIntegrado: CORPO_INTEGRADO,
  params: {
    alerts: Array<Alert>, // De agentes 4,5,7
    userQuestions: Array<{ text, category }>
  }
}
```

---

## 4) Saídas oficiais (DEV DOC 3/8)

### Schema:
```javascript
{
  agent_id: "AGENT_06",
  status: "ok|partial|fail",
  dados: {
    respostas_usuario: Array<{
      pergunta: string,
      categoria: string,
      resposta: string,
      origens: Array<Evidence>
    }>,
    minutas: Array<{
      tipo: "ESCLARECIMENTO|IMPUGNACAO|RECURSO",
      titulo: string,
      texto: string,
      gatilho: string,
      origens: Array<Evidence>
    }>
  },
  alerts: [],
  evidence: [],
  metadata: {run_ms, items_found, confidence},
  quality_flags: {needs_review}
}
```

---

## 5) Regras e gatilhos

### Gatilhos para minuta de IMPUGNAÇÃO:
- Alert com `action_suggested: 'IMPUGNACAO'`
- Alert de AGENT_04 ou AGENT_05 com evidência de restrição
- Divergência crítica (AGENT_07)

### Template fixo de impugnação:
```
MINUTA DE IMPUGNAÇÃO

Ao [ÓRGÃO]

[EMPRESA], CNPJ [X], vem respeitosamente IMPUGNAR o Edital [X]:

1. FATOS
[gatilho.message com evidência]

2. FUNDAMENTO LEGAL
Lei 14.133/2021

3. PEDIDO
Retificação do edital

Atenciosamente,
[EMPRESA]
```

---

## 6) Implementação atual (v1.0)

### ✅ O que está funcionando:
- Geração de minutas baseada em alerts
- **VALIDADO NO TESTE:** Só gera com gatilho (2 minutas geradas, ambas com gatilho)
- Template básico implementado
- Envelope padrão conforme DEV DOC 3/8

### ⚠️ Limitações conhecidas:
- Respostas a perguntas são placeholder ("implementação futura com IA")
- Evidências não são vinculadas às minutas (campo `origens: []` vazio)
- Fundamentos legais são genéricos (sempre "Lei 14.133/2021")
- Sem integração com IA (Groq/Gemini) para análise contextual

---

## 7) Resultado do teste E2E Full

### Validação:
```
✅ AGENT_06: Minutas SOMENTE com gatilho (2) ✅ CRÍTICO
```

**Output real:**
- Status: `ok`
- Minutas geradas: 2
- Todas com gatilho: ✅ SIM
- Evidências: ⚠️ Vazias (não implementado)

---

## 8) Edge cases e riscos

### ⚠️ Sem IA, análise é limitada:
- Não contextualiza gravidade da restrição
- Não personaliza minuta por tipo de edital
- Não valida se fundamento legal é pertinente

### ⚠️ Gatilhos podem ser falsos positivos:
- Se AGENT_04 ou 05 errarem na detecção, gera minuta desnecessária
- Sem segunda camada de validação

### ⚠️ Template genérico:
- Pode precisar ajuste manual pelo usuário
- Não inclui jurisprudência

---

## 9) Melhorias futuras

### Curto prazo:
1. [ ] Vincular evidências às minutas (campo `origens`)
2. [ ] Adicionar timestamp ao envelope
3. [ ] Implementar respostas básicas a perguntas usando regex do CORPUS

### Médio prazo:
4. [ ] Integração com Groq para análise contextual
5. [ ] Templates específicos por tipo de minuta
6. [ ] Base de jurisprudência relevante
7. [ ] Validação de fundamento legal por tipo de restrição

---

## 10) Checklist de "DONE"

- [x] Consome apenas CORPO_INTEGRADO + alerts
- [x] Retorna envelope padrão
- [x] **Minuta SOMENTE com gatilho** ✅ CRÍTICO
- [ ] Timestamp no envelope (PENDENTE)
- [ ] Evidências vinculadas (PENDENTE)
- [x] Testado no E2E Full
- [x] **Diário .md criado** ✅

---

**⚠️ AGENTE 6 (LegalMindEngine) - PARCIAL (v1.0 Básico)**

**Funcional para:** Gerar minutas com gatilho  
**Limitações:** Sem IA, evidências vazias, respostas placeholder  
**Próximo passo:** Integrar Groq e vincular evidências

**Última atualização:** 2025-12-12 13:54 BRT
