# 🎨 FRONTEND - PLANO DE IMPLEMENTAÇÃO

> **Data:** 2025-12-12  
> **Versão:** v1.0 MVP  
> **Base:** DEV DOC 6/8 (Interface & UX)  
> **Backend:** ✅ 100% (37/37) - `test-output-full.json` como referência

---

## 📋 TECNOLOGIAS (conforme DEV DOC 6/8)

- **Framework:** Next.js 14 (App Router)
- **UI:** Componentes React
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Context + useState/useReducer
- **API:** `POST /api/analyze` (multipart + JSON)
- **Downloads:** Client-side (blob + download)

---

## 🗂️ ESTRUTURA DE PASTAS

```
app/
  page.tsx                    # Tela 01 - Nova Análise
  results/[batchId]/page.tsx  # Tela 02 - Resultado
  api/
    analyze/route.ts          # POST /api/analyze
components/
  UploadPanel.tsx
  CNPJPanel.tsx
  CompanyContextPanel.tsx
  QuestionBox.tsx             # Pré e Pós-análise
  PipelineStatusStepper.tsx
  ResultsDashboard.tsx
  SourcesPanel.tsx
  BlackBoxPanel.tsx
  DownloadsPanel.tsx
  OCRQualityBanner.tsx        # ⚠️ TRAVA DE EXIBIÇÃO
lib/
  types.ts                    # Types do backend
  api-client.ts               # Fetch wrappers
  state-machine.ts            # Estados globais
```

---

## 🎯 COMPONENTES PRIORITÁRIOS (Ordem de Implementação)

### **Sprint 1: Upload + Pipeline Status (Core)**
1. ✅ `UploadPanel` - Dropzone + validação
2. ✅ `PipelineStatusStepper` - 9 etapas com status
3. ✅ `POST /api/analyze` - Integração MasterLicitator
4. ✅ State Machine (idle → running → success)

### **Sprint 2: Resultados + Fontes**
5. ✅ `ResultsDashboard` - Seções por agente
6. ✅ `SourcesPanel` - Evidências navegáveis
7. ✅ `OCRQualityBanner` - ⚠️ TRAVA DE EXIBIÇÃO
8. ✅ Badges LOW_CONFIDENCE em campos sensíveis

### **Sprint 3: Opcionais + Downloads**
9. ✅ `CNPJPanel` - Busca + CNAEs
10. ✅ `CompanyContextPanel` - Contexto operacional
11. ✅ `QuestionBox` - Pré e Pós-análise
12. ✅ `BlackBoxPanel` - Auditoria
13. ✅ `DownloadsPanel` - PDFs/Excel/Minutas

---

## ⚠️ REGRA CRÍTICA: TRAVA DE EXIBIÇÃO OCR < 50%

### **Implementação Obrigatória:**

```tsx
// OCRQualityBanner.tsx
if (pipeline_summary.ocr_quality_avg < 0.5) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Leitura com baixa confiabilidade (OCR baixo)</AlertTitle>
      <AlertDescription>
        Alguns campos podem estar incorretos. 
        <Button variant="link">Anexar PDF melhor</Button>
      </AlertDescription>
    </Alert>
  );
}
```

### **Badge LOW_CONFIDENCE:**

```tsx
// Em campos sensíveis (modalidade, tipo julgamento, órgão, datas)
{lowOcrQuality && (
  <Badge variant="warning">LOW_CONFIDENCE</Badge>
)}
```

### **Campos sensíveis afetados:**
- modalidade
- tipo julgamento  
- órgão
- datas críticas (publicação/abertura/envio propostas)

---

## 📊 INTEGRAÇÃO COM BACKEND

### **Input:**
```typescript
POST /api/analyze
{
  files: File[],
  cnpj?: string,
  userQuestions?: Question[],
  userContext?: {
    estoque: "pronto" | "encomenda",
    alcance: "local" | "estadual" | "nacional",
    apetite_risco: "baixo" | "medio" | "alto",
    prazo_minimo_dias: number
  }
}
```

### **Output (do backend - test-output-full.json):**
```typescript
{
  status: string,
  batch_id: string,
  timestamp: string,
  pipeline_summary: {
    status: string,
    ocr_quality_avg: number,  // ⚠️ CRÍTICO para trava
    total_lines: number,
    total_pages: number
  },
  agents: {
    AGENT_02: {...},
    AGENT_03: {...},
    // ...
    AGENT_09: {...}
  },
  corpo_integrado: {...},
  black_box: {...}
}
```

---

## 🎨 DESIGN SYSTEM (Minimal MVP)

### **Cores:**
- Primary: Blue-600 (ação)
- Success: Green-600 (ok)
- Warning: Yellow-600 (partial/low confidence)
- Error: Red-600 (fail)
- Neutral: Gray-600 (fontes/metadados)

### **Componentes shadcn/ui:**
- Button
- Card
- Alert
- Badge
- Tabs / Accordion
- Table
- Dialog
- Dropzone (react-dropzone)

---

## 📋 CRITÉRIOS DE ACEITE (DoD - Frontend MVP)

- [ ] Upload multi-arquivo funciona
- [ ] Pipeline status exibe 9 etapas
- [ ] Resultados por seção (agents) exibem dados + alertas
- [ ] **OCR < 50% exibe banner + badges LOW_CONFIDENCE**
- [ ] Fontes navegáveis com referência copiável
- [ ] Caixa preta mostra timeline
- [ ] Downloads habilitam quando consolidado pronto
- [ ] CNPJ opcional (sem bloquear se falhar)
- [ ] QuestionBox pré/pós análise funcional

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. Criar projeto Next.js 14
2. Configurar Tailwind + shadcn/ui
3. Implementar Sprint 1 (Upload + Status)
4. Testar com `test-output-full.json` mockado
5. Integrar `/api/analyze` real
6. Implementar **OCRQualityBanner** (CRÍTICO)
7. Sprint 2 e 3

---

**✅ FRONTEND READY TO START**

**Backend:** 100% (37/37) - ESTÁVEL  
**DEV DOC 6/8:** ✅ RECEBIDO  
**Trava OCR:** ✅ PLANEJADA
