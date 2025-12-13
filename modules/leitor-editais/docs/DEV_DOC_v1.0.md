# 🧩 DEV DOC v1.0 — ARQUITETURA OFICIAL DO SISTEMA O LICITADOR BLINDADO

**Documento Técnico para Desenvolvedores e Arquitetos de Software**

---

## 1. VISÃO GERAL DO SISTEMA

O Licitador Blindado é um sistema de análise automática de licitações públicas baseado em:

- **OCR obrigatório**
- **Leitura de múltiplos documentos**
- **Análise técnica, jurídica e estratégica**
- **Classificação inteligente via CNAE**
- **Detecção de divergências**
- **Geração de relatórios e minutas jurídicas**
- **Arquitetura multi-agentes com um orquestrador central**

O objetivo é interpretar editais e documentos correlatos com precisão, **sem alucinação**, e entregar análises completas ao usuário em formato de relatório e PDF.

---

## 2. FUNDAMENTAÇÃO LEGAL OBRIGATÓRIA

Toda interpretação deve estar em conformidade com:

- **Lei 14.133/2021**
- **Lei 8.666/1993**
- **Lei 10.520/2002**
- **Lei 12.462/2011** (RDC)
- **Lei 13.303/2016** (Estatais)
- **LC 123/2006**
- **Jurisprudência aplicável** (TCU e TCEs)

**Nenhuma conclusão pode contrariar este conjunto normativo.**

---

## 3. ARQUITETURA MULTI-AGENTES

O sistema deve ser implementado com:

- **1 Orquestrador Central** (Master Agent)
- **8 Agentes Especializados**
- **Fluxo determinístico**
- **Chamadas independentes**
- **Entradas e saídas tipadas por JSON**

**Cada agente tem responsabilidades exclusivas.**

---

## 4. ORQUESTRADOR CENTRAL — MASTER LICITATOR

### Papel:
Coordenar todos os agentes, verificar consistência, consolidar resultados.

### Responsabilidades:
- Gerenciar fluxo de execução
- Validar inputs/outputs
- Garantir regras anti-alucinação
- Unificar conclusões
- Produzir resposta final estruturada
- Chamar agente PDF
- Registrar logs de execução

### Nunca faz:
- OCR
- Leitura documental
- Análise técnica ou jurídica

**O orquestrador apenas organiza e valida.**

---

## 5. AGENTES ESPECIALIZADOS (DETALHADOS)

### AGENTE 1 — Ingestão e OCR (Ingestor Engine)

**Funções:**
- Receber arquivos
- Identificar tipo: edital, TR, minuta, atas, anexos, planilhas
- Aplicar OCR em 100% dos casos
- Padronizar formatação
- Remover ruídos
- Criar estrutura paginada e indexada

**Output:**
```json
{
  "tipo": "edital|tr|minuta|ata|anexo|planilha",
  "texto": "...",
  "paginas": [...],
  "linhas": [...]
}
```

---

### AGENTE 2 — Extração Estrutural (Structure Mapper)

**Funções:**
- Extrair metadados do certame
- Detectar modalidade, número do processo, órgão
- Identificar datas críticas
- Mapear seções e capítulos
- Gerar estrutura hierárquica do edital

**Output:**
```json
{
  "modalidade": "...",
  "processo": "...",
  "datas": {...},
  "secoes": [...]
}
```

---

### AGENTE 3 — Análise do Objeto e Itens (Item Classifier)

**Funções:**
- Extrair informações de cada item
- Detectar normas técnicas, marcas, serviços
- Cruzar com CNAE da empresa
- Classificar itens:
  - **ELEGÍVEL**
  - **DÚVIDA**
  - **INCOMPATÍVEL**

**Output:**
```json
[
  {
    "item": 1,
    "descricao": "...",
    "classificacao": "ELEGIVEL|DUVIDA|INCOMPATIVEL",
    "motivo": "..."
  }
]
```

---

### AGENTE 4 — Habilitação (Compliance Checker)

**Funções:**
- Interpretar exigências fiscais, contábeis e cadastrais
- Classificar riscos
- Identificar ilegalidades de habilitação
- Criar checklist automático

---

### AGENTE 5 — Capacidade Técnica (Technical Validator)

**Funções:**
- Extrair requisitos de atestados
- Comparar com proporcionalidade e pertinência
- Detectar abusos
- Sinalizar gatilhos de impugnação

---

### AGENTE 6 — Jurídico (Legal Mind Engine)

**Agente crítico e de maior responsabilidade.**

**Funções:**
- Interpretar cláusulas jurídicas
- Validar base legal
- Detectar ilegalidades
- Montar minutas:
  - Impugnação
  - Recursos
  - Notificações
  - Esclarecimentos

**Regras:**
- ✅ Citar documento, página e trecho **literalmente**
- ❌ **Jamais inventar dado jurídico**

---

### AGENTE 7 — Divergências (Divergence Scanner)

**Funções:**
- Comparar **Edital × TR**
- Detectar diferenças em:
  - quantidades
  - descrições
  - prazos
  - condições técnicas
- Criar tabela de divergências

---

### AGENTE 8 — Decisão Estratégica (Decision Core)

**Funções:**
- Avaliar somatório de riscos
- Considerar logística, habilitação, pagamento, penalidades
- Emitir decisão final:
  - **PARTICIPAR**
  - **NÃO PARTICIPAR**
- Justificar decisão com base documental

---

### AGENTE 9 — Relatórios, PDFs e Anexo I (Report Synthesizer)

**Funções:**
- Montar relatório final em HTML visual
- Gerar PDF
- Criar Anexo I com todos os itens
- Disponibilizar arquivos para download

---

## 6. REGRAS ABSOLUTAS DO SISTEMA

### 6.1 Zero alucinação
- ❌ Sem inferência
- ❌ Sem dados não encontrados
- ✅ Use `"SEM DADOS NO ARQUIVO"`

### 6.2 Citação obrigatória
Toda conclusão deve trazer:
```json
{ 
  "documento": "...", 
  "página": "...", 
  "trecho": "..." 
}
```

### 6.3 Apenas Edital × TR será comparado
Demais cruzamentos **não devem ser implementados**.

### 6.4 Classificação dos itens
Baseada **somente no CNAE da empresa**.

---

## 7. FLUXO DETALHADO DE EXECUÇÃO

1. **Passo 1** — Upload (Usuário envia múltiplos arquivos)
2. **Passo 2** — Orquestrador aciona Agente 1 (OCR)
3. **Passo 3** — Orquestrador aciona Agente 2 (Estrutura)
4. **Passo 4** — Agente 3 analisa itens e CNAE
5. **Passo 5** — Agente 4 analisa habilitação
6. **Passo 6** — Agente 5 analisa capacidade técnica
7. **Passo 7** — Agente 6 executa análise jurídica
8. **Passo 8** — Agente 7 detecta divergências
9. **Passo 9** — Agente 8 emite GO/NO-GO
10. **Passo 10** — Agente 9 produz relatório e PDF
11. **Passo 11** — Orquestrador consolida e entrega

---

## 8. MODELO DE DADOS PARA COMUNICAÇÃO ENTRE AGENTES

Todos os dados devem circular em JSON padronizado, exemplo:

```json
{
  "agente": "TechnicalValidator",
  "status": "ok",
  "dados": {...},
  "origem": {
     "documento": "Edital.pdf",
     "pagina": 12,
     "trecho": "O prazo de entrega será de 5 dias úteis."
  }
}
```

---

## 9. PADRÃO DE LOGS E ERROS

Erros devem ser registrados no formato:

```json
{
  "tipo": "erro",
  "agente": "ItemClassifier",
  "mensagem": "Item 3 sem descrição literal.",
  "acao": "retornar SEM DADOS NO ARQUIVO"
}
```

---

## 10. SAÍDAS FINAIS OBRIGATÓRIAS DO SISTEMA

- ✅ Relatório estratégico completo (HTML + PDF)
- ✅ Quadro de divergências
- ✅ Anexo I (PDF)
- ✅ Minutas jurídicas sugeridas
- ✅ Recomendações GO/NO-GO
- ✅ Caixa preta mostrando tudo que foi encontrado

---

**FIM DO DOCUMENTO OFICIAL**  
**Versão:** 1.0  
**Data:** 2025-12-12
