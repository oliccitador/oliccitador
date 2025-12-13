# SPRINT_DB1_DIARY.md

> **Sprint:** DB-1 - Banco de Dados (Persistência, Histórico, Cache)  
> **Data:** 2025-12-12  
> **Status:** ✅ COMPLETA (100%)  
> **Base:** DEV DOC 7/8 (Banco de Dados)  
> **Duration:** ~2h

---

## 1) Objetivo da Sprint

### O que foi implementado:
- **DB como fonte da verdade**: Migrar de localStorage temporário para persistência permanente
- **Histórico de análises**: Usuário pode acessar resultados antigos
- **Fundação para perguntas pós-análise**: Corpus persistido para reuso sem reprocessar
- **Ownership**: Batches vinculados a user_id (mesmo que placeholder "dev")

### O que NÃO foi implementado (escopo):
- Autenticação real (user_id = "dev" placeholder)
- Object Storage (S3/R2) - arquivos ficam em filesystem local
- Geração de PDFs (artefatos ainda não implementados)
- Comparação de batches
- Perguntas pós-análise (Sprint 3)

---

## 2) Decisões Técnicas

### **2.1 ORM: Prisma 6.x (não 7.x)**

**Decisão:** Usar Prisma 6.x ao invés de 7.x.

**Motivo:**
- Prisma 7.x está em early adoption e causou erros de compatibilidade:
  - `prisma.config.ts` não reconhecido
  - Migrations falhando com "Environment variable not found"
  - Documentação incompleta para SQLite + config.ts
- Prisma 6.x é production-ready e estável
- Migração futura 6→7 é simples quando estabilizar

**Tentativas falhadas com Prisma 7:**
1. ❌ Remover `url` do schema e criar `prisma.config.ts`
2. ❌ `npx prisma migrate dev` falhou com erro de módulo
3. ❌ 2 versões de `prisma.config.ts` testadas

**Solução final:**
```bash
npm install prisma@6 @prisma/client@6 --save-exact
```

**Resultado:** Migrations rodaram em 20s, zero problemas.

---

### **2.2 Database: SQLite (não Postgres)**

**Decisão:** SQLite para MVP, Postgres para produção.

**Motivo:**
- Zero setup (arquivo local `prisma/dev.db`)
- Perfeito para desenvolvimento/MVP
- Migração para Postgres é transparente (Prisma)
- DEV DOC 7/8 recomenda Postgres, mas permite SQLite no MVP

**Limitações conhecidas:**
- Não suporta múltiplos writes concorrentes (ok para MVP single-user)
- Tamanho ideal < 1GB (ok para ~100 batches)

**Migração futura:**
```prisma
// schema.prisma
datasource db {
  provider = "postgresql" // trocar sqlite → postgresql
  url      = env("DATABASE_URL")
}
```

---

### **2.3 Ownership: user_id = "dev" (placeholder)**

**Decisão:** Hardcode `user_id = "dev"` em todas APIs até auth existir.

**Motivo:**
- Sprint DB-1 foca em persistência, não auth
- Ownership é obrigatório no schema (DEV DOC 7/8)
- Facilita implementação futura de multi-tenancy

**Implementação:**
```typescript
const userId = 'dev'; // Placeholder até auth existir
const batch = await prisma.analysisBatch.findFirst({
  where: { id: batchId, userId: userId }
});
```

**Migração futura:** Substituir por `userId = session.user.id`.

---

### **2.4 Storage: JSON em campo vs Object Storage**

**Decisão:** Armazenar `results`, `agents`, `corpus` como JSON serializado no SQLite.

**Motivo:**
- Simplicidade para MVP
- SQLite aguenta ~1MB de JSON sem problemas
- Evita complexidade de S3/R2 agora

**Implementação:**
```typescript
pipelineSummary: JSON.stringify(result.pipeline_summary || {})
```

**Limitação conhecida:**
- `texto_completo` pode exceder 1MB em editais grandes
- Solução atual: `substring(0, 1000000)` (limita 1MB)

**Migração futura (DEV DOC 7/8):**
```typescript
// Se corpus > 5MB, salvar em storage
if (corpus.textoCompleto.length > 5_000_000) {
  storageUrlTexto = await saveToS3(corpus.textoCompleto);
  textoCompleto = null; // NULL no DB, URL no storage
}
```

---

## 3) Estrutura de Dados Final

### **Schema Prisma (8 modelos):**

#### **users**
```prisma
id, email, createdAt
```
Placeholder para auth futura.

#### **organizations**
```prisma
id, userId, cnpj, cnaes (JSON), createdAt, updatedAt
```
Vincula CNPJs às análises (Sprint 3).

#### **analysis_batches** ⭐ (núcleo)
```prisma
id (= batch_id), userId, organizationId, status,
pipelineSummary (JSON), pipelineWarnings (JSON),
preAnalise (JSON), results (JSON), agents (JSON),
blackBox (JSON), ocrQualityAvg, documentsTotal,
pipelineVersion, inputFingerprint
```

#### **uploaded_documents**
```prisma
id, batchId, filenameOriginal, docType, storageUrl,
filesize, sha256, uploadedAt, ocrQuality, needsReview
```

#### **integrated_corpus**
```prisma
id, batchId (unique 1:1), textoCompleto, globalLines (JSON),
segments (JSON), lineMap (JSON), metadata (JSON)
```

#### **user_questions**
```prisma
id, batchId, mode (pre/post), category, questionText, createdAt
```
Sprint 3.

#### **user_answers**
```prisma
id, questionId, batchId, agentId, answerText,
evidence (JSON), alerts (JSON), createdAt
```
Sprint 3.

#### **generated_artifacts**
```prisma
id, batchId, type, storageUrl, sizeBytes, checksumSha256, createdAt
```
Futuro (PDFs).

---

## 4) Rotas Criadas e Contratos

### **POST /api/analyze**

**Entrada:**
```typescript
FormData {
  files: File[]
}
```

**Saída:**
```json
{
  "batch_id": "uuid",
  "status": "success|warning|partial|error",
  "pipeline_summary": {...},
  "results": {...},
  "agents": {...},
  ...
}
```

**O que persiste:**
1. `analysis_batches` (batch principal)
2. `uploaded_documents` (cada arquivo com SHA256)
3. `integrated_corpus` (CORPO_INTEGRADO completo)

---

### **GET /api/batches/:batchId**

**Entrada:**
```
GET /api/batches/{batch_id}
```

**Ownership:** Valida `userId = "dev"`.

**Saída:**
```json
{
  "batch_id": "uuid",
  "status": "success",
  "timestamp": "2025-12-12T...",
  "pipeline_summary": {...},
  "results": {...},
  "agents": {...},
  "corpo_integrado": {...},
  "uploaded_documents": [...],
  "artifacts": [...]
}
```

**Comportamento:**
- 404 se batch não existe ou não pertence ao usuário
- 500 se erro de DB

---

### **GET /api/history**

**Entrada:**
```
GET /api/history
```

**Saída:**
```json
{
  "batches": [
    {
      "id": "uuid",
      "status": "success",
      "createdAt": "2025-12-12T...",
      "ocrQualityAvg": 0.85,
      "documentsTotal": 3,
      "orgao": "TRIBUNAL XYZ"
    }
  ]
}
```

**Comportamento:**
- Retorna últimos 20 batches do usuário
- Ordenados por `createdAt DESC`
- Extrai `orgao` do JSON `preAnalise`

---

## 5) Testes Executados

### **Teste 1: Migration e Schema**
```bash
npx prisma migrate dev --name init_db
```
**Resultado:** ✅ Migration criada, DB gerado em `prisma/dev.db`

---

### **Teste 2: Persistência em /api/analyze**
**Ação:** Upload de 1 PDF → Processar

**Validação:**
```sql
SELECT * FROM analysis_batches;
SELECT * FROM uploaded_documents;
SELECT * FROM integrated_corpus;
```

**Resultado:**
- ✅ 1 registro em `analysis_batches`
- ✅ 1 registro em `uploaded_documents` com SHA256
- ✅ 1 registro em `integrated_corpus` com globalLines/segments

---

### **Teste 3: GET /api/batches/:batchId**
**Ação:** `curl http://localhost:3000/api/batches/{batch_id}`

**Resultado:**
- ✅ JSON completo retornado
- ✅ Ownership validado (404 se user_id diferente)

---

### **Teste 4: Página /history**
**Ação:** Acessar `http://localhost:3000/history`

**Resultado:**
- ✅ Lista com 1 batch
- ✅ Status, data, órgão corretos
- ✅ Link "Ver Resultado" funcional

---

### **Teste 5: Reload sem perder dados**
**Ação:**
1. Upload → Processar → Redireciona para /results/{batch_id}
2. F5 (reload)

**Resultado:**
- ✅ Dashboard renderiza completo (dados do DB)
- ✅ localStorage NÃO é fonte de verdade (apenas cache)

---

## 6) Problemas Encontrados e Correções

### **Problema 1: Prisma 7 incompatível**
**Erro:**
```
Error: The datasource property `url` is no longer supported
```

**Causa:** Prisma 7 mudou config para `prisma.config.ts`.

**Solução:** Downgrade para Prisma 6.
```bash
npm install prisma@6 @prisma/client@6 --save-exact
```

**Tempo perdido:** ~30min

---

### **Problema 2: DATABASE_URL não encontrada**
**Erro:**
```
Environment variable not found: DATABASE_URL
```

**Causa:** Prisma procura `.env` (não `.env.local`).

**Solução:** Criar `.env` com:
```
DATABASE_URL="file:./prisma/dev.db"
```

**Tempo perdido:** ~5min

---

### **Problema 3: Corpus muito grande**
**Erro (potencial):** `texto_completo` pode exceder 1MB em SQLite.

**Solução temporária:** Limitar a 1MB:
```typescript
textoCompleto: corpus.textoCompleto?.substring(0, 1000000) || null
```

**Solução futura:** Usar `storageUrlTexto` quando > 5MB.

---

## 7) Arquitetura Implementada

### **Fluxo de Dados:**

```
1. Upload (POST /api/analyze)
   ↓
2. MasterLicitator.execute()
   ↓
3. Resultado gerado
   ↓
4. Persistência Prisma:
   - analysis_batches
   - uploaded_documents
   - integrated_corpus
   ↓
5. Retorna batch_id
   ↓
6. Frontend redireciona /results/{batch_id}
   ↓
7. Carrega via GET /api/batches/:batchId
   ↓
8. Dashboard renderiza
```

### **Singleton PrismaClient:**

```typescript
// lib/db.ts
const globalForPrisma = globalThis as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Benefício:** Evita múltiplas conexões em Next.js dev/hot-reload.

---

## 8) Pendências e Próximos Riscos

### **Pendências (não bloqueiam MVP):**

#### **8.1 Autenticação**
- `user_id = "dev"` é placeholder
- Precisa implementar NextAuth ou similar

#### **8.2 Object Storage (S3/R2)**
- Arquivos grandes excedem SQLite
- `storage_url` está como path local `/uploads/...`
- Migração futura para S3/R2

#### **8.3 Geração de PDFs**
- `generated_artifacts` criado mas vazio
- Precisa módulo de produção de PDFs

#### **8.4 input_fingerprint (reuso)**
- Campo existe mas não implementado
- SHA-256 dos arquivos para detectar duplicatas

---

### **Riscos para Sprint 3:**

#### **Risco 1: Corpus > 1MB**
**Mitigação:** Implementar storage condicional:
```typescript
if (textoCompleto.length > 1_000_000) {
  // Salvar em S3/R2
}
```

#### **Risco 2: Perguntas pós-análise sem corpus**
**Mitigação:** Validar `integrated_corpus` existe antes de processar.

#### **Risco 3: Múltiplos users com SQLite**
**Mitigação:** Migrar para Postgres antes de produção real.

---

## 9) Métricas

- **Modelos Prisma:** 8
- **Migrations:** 1 (`20251212175909_init_db`)
- **Rotas criadas:** 3 (analyze, batches, history)
- **Páginas criadas:** 1 (/history)
- **Linhas de código:** ~700
- **Tempo total:** ~2h
- **Problemas bloqueantes:** 2 (Prisma 7, DATABASE_URL)

---

## 10) Checklist de "DONE"

- [x] Prisma 6.x instalado e estável
- [x] Schema com 8 modelos (DEV DOC 7/8)
- [x] Migrations criadas e aplicadas
- [x] Database SQLite criado
- [x] lib/db.ts (singleton)
- [x] POST /api/analyze persiste batch + docs + corpus
- [x] GET /api/batches/:batchId com ownership
- [x] GET /api/history com últimos 20 batches
- [x] /results/[batchId] carrega do DB (não localStorage)
- [x] /history página funcional
- [x] F5 não perde dados (DB = fonte verdade)
- [x] localStorage vira cache UX
- [x] **Diário .md criado** ✅

---

## 11) Próximos Passos (Sprint 3)

### **Escopo:**
- CNPJPanel (consulta Receita)
- CompanyContextPanel (estoque/alcance/risco)
- QuestionBox (pré e pós-análise)
- Respostas usando corpus do DB (sem rerodar pipeline)
- Template jurídico para Pedido de Esclarecimento

### **Dependências:**
- ✅ `integrated_corpus` já persistido
- ✅ `user_questions` e `user_answers` já no schema
- ⏳ Implementar lógica de resposta

---

**✅ SPRINT DB-1 COMPLETA - DB COMO FONTE DA VERDADE**

**Fundação sólida para:** Histórico, Reuso, Perguntas Pós-Análise  
**Migração futura:** Postgres + S3 + Auth real

**Última atualização:** 2025-12-12 15:06 BRT
