# M21-M23 – Módulos Futuros/Planejados

**Versão:** 1.0  
**Data:** 2025-12-10  
**Estado:** 🔵 FUTURO (Não implementados)

---

## Identificação dos Módulos

Este documento consolida os **Módulos Futuros/Planejados** do sistema O Licitador. Estes módulos representam a evolução do produto, agregando valor significativo para usuários avançados e aumentando a competitividade do sistema.

**Papel Estratégico Conjunto:**  
M21-M23 formam a camada de valor agregado do O Licitador. M21 permite reutilização e auditoria de análises anteriores. M22 profissionaliza a apresentação de resultados para inclusão em editais. M23 escala o sistema para processos licitatórios complexos com dezenas ou centenas de itens.

**Funcionamento Operacional Conjunto:**  
M21 armazena análises em banco de dados e oferece interface de consulta. M22 gera documentos PDF/Excel a partir de dados estruturados. M23 processa planilhas em background via sistema de filas, notificando usuários ao concluir.

**Interações com Outros Módulos:**  
- **Dependerão de:** M1 (análises a serem salvas em M21), M4 (cotações para M22), M10 (identificação de usuário), M12 (validação de quotas para M23), M14 (notificação de conclusão em M23)
- **Serão usados por:** Usuários avançados que precisam de histórico, relatórios profissionais e processamento em lote

---

## M21: Módulo de Histórico de Análises

**Estado:** 🔵 FUTURO  
**Prioridade:** ALTA

### Visão Geral
Armazenar e exibir histórico de análises realizadas por cada usuário. Permitir reutilização de análises anteriores.

### Funcionalidades Planejadas
- Salvar cada análise no Supabase (tabela `analises`)
- Exibir lista de análises anteriores (ordenadas por data)
- Busca/filtro por produto, CA, CATMAT
- Reutilizar análise anterior (copiar para nova cotação)
- Exportar histórico (CSV, PDF)

### Schema Proposto (Supabase)
```sql
CREATE TABLE analises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  resultado JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Dependências
- M10 (Autenticação) - Identificação de usuário
- M1 (Análise Gemini) - Salvar resultado após análise

### Próximos Passos
- [ ] Definir schema no Supabase
- [ ] Criar endpoint `/api/analises` (GET, POST)
- [ ] Criar página `/dashboard/historico`
- [ ] Implementar busca/filtro
- [ ] Adicionar exportação

### Impacto
- **Valor para Usuário:** ALTO (reutilização, auditoria)
- **Complexidade:** MÉDIA
- **Tempo Estimado:** 1-2 semanas

---

## M22: Módulo de Exportação (PDF/Excel)

**Estado:** 🔵 FUTURO  
**Prioridade:** MÉDIA

### Visão Geral
Exportar resultados de análise e cotações em formatos profissionais (PDF, Excel) para inclusão em editais e relatórios.

### Funcionalidades Planejadas
- **PDF:**
  - Relatório de análise completo (produto, CA, CATMAT, justificativa)
  - Tabela de cotação de preços (top 3 + referências PNCP)
  - Logo, cabeçalho, rodapé customizáveis
  - Geração via biblioteca (ex: jsPDF, Puppeteer)

- **Excel:**
  - Planilha com dados estruturados
  - Múltiplas abas (análise, cotação, referências)
  - Formatação profissional
  - Geração via biblioteca (ex: ExcelJS)

### Dependências
- M1 (Análise Gemini) - Dados de análise
- M4 (Busca de Preços) - Dados de cotação
- M21 (Histórico) - Exportação em lote (opcional)

### Bibliotecas Sugeridas
- **PDF:** `jsPDF` ou `Puppeteer` (headless Chrome)
- **Excel:** `ExcelJS` ou `xlsx`

### Próximos Passos
- [ ] Definir templates de PDF e Excel
- [ ] Escolher bibliotecas
- [ ] Implementar endpoint `/api/export` (POST)
- [ ] Adicionar botão "Exportar" nas páginas de análise
- [ ] Testar em diferentes navegadores

### Impacto
- **Valor para Usuário:** ALTO (profissionalização de relatórios)
- **Complexidade:** MÉDIA-ALTA
- **Tempo Estimado:** 2-3 semanas

---

## M23: Módulo de Análise em Lote

**Estado:** 🔵 FUTURO  
**Prioridade:** BAIXA (mas alto valor para usuários avançados)

### Visão Geral
Analisar múltiplos itens de uma vez via upload de planilha (Excel/CSV). Processar em background e retornar resultados consolidados.

### Funcionalidades Planejadas
- Upload de planilha (Excel ou CSV)
- Validação de formato (colunas obrigatórias: "Descrição", "Quantidade")
- Processamento em background (queue)
- Progresso em tempo real (WebSocket ou polling)
- Download de planilha com resultados (análise + cotação)

### Fluxo
```
1. Usuário faz upload de planilha (ex: 50 itens)
2. Sistema valida formato
3. Cria job de processamento (queue)
4. Processa item por item (M1 + M4)
5. Atualiza progresso (ex: "10/50 concluídos")
6. Ao finalizar, gera planilha de saída
7. Notifica usuário (email + dashboard)
8. Usuário baixa planilha com resultados
```

### Dependências
- M1 (Análise Gemini) - Análise de cada item
- M4 (Busca de Preços) - Cotação de cada item
- M12 (Controle de Uso) - Validar quota (50 análises de uma vez!)
- M14 (Email) - Notificação de conclusão
- **Queue System:** Redis + Bull (ou similar)

### Desafios Técnicos
- **Quota de APIs:** 50 análises = 50 chamadas Gemini + 50 cotações SerpApi
- **Timeout:** Processamento pode levar minutos (não pode ser síncrono)
- **Concorrência:** Limitar processamento paralelo (ex: 5 itens por vez)

### Próximos Passos
- [ ] Definir formato de planilha de entrada (template)
- [ ] Escolher sistema de queue (Redis + Bull)
- [ ] Implementar worker de processamento
- [ ] Criar endpoint `/api/batch-analyze` (POST upload)
- [ ] Criar endpoint `/api/batch-status/:jobId` (GET progresso)
- [ ] Criar página `/dashboard/lote` (upload + progresso)
- [ ] Implementar notificação de conclusão

### Impacto
- **Valor para Usuário:** MUITO ALTO (economia de tempo massiva)
- **Complexidade:** ALTA
- **Tempo Estimado:** 4-6 semanas
- **Custo de Infraestrutura:** Aumenta (Redis, workers)

---

## Roadmap de Implementação

### Fase 1: Fundação (Concluída)
- ✅ M1-M5 (Core)
- ✅ M6-M9 (Interface)
- ✅ M10-M12 (Auth/Controle)

### Fase 2: Estabilização (Em Andamento)
- 🟡 M2 (Desbloqueio de CA)
- 🟡 M12 (Integração de quotas)
- 🟡 M14 (Validação de emails)

### Fase 3: Valor Agregado (Próximos 3 meses)
- 🔵 M21 (Histórico) - Prioridade 1
- 🔵 M22 (Exportação) - Prioridade 2
- 🔵 M23 (Lote) - Prioridade 3

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas (M21-M23)

### Lições Aprendidas de Módulos Anteriores (Para Aplicar nos Futuros)

1. **Sempre Criar Scripts de Teste ANTES da Implementação**
   - Lição de M2: Scripts de diagnóstico devem existir desde o início
   - Para M21-M23: Criar scripts de teste antes de escrever código de produção

2. **Documentar Dependências Externas Claramente**
   - Lição de M2: APIs externas precisam de configuração manual
   - Para M21-M23: Documentar TODAS as configurações necessárias (DB, APIs, permissões)

3. **Implementar com Modo Degradado**
   - Lição de M7: Dependência 100% de módulo bloqueado = sistema inoperante
   - Para M21-M23: Sempre ter fallback ou modo offline

4. **Validar Localmente Antes de Deploy**
   - Lição de M17: Deploy não é ferramenta de debug
   - Para M21-M23: Fluxo rigoroso: Teste local → Aprovação → Deploy ÚNICO

5. **Priorizar Precisão Sobre Recall**
   - Lição de M4: Melhor retornar vazio do que retornar errado
   - Para M22 (Exportação): Validar dados antes de gerar PDF/Excel
   - Para M23 (Lote): Validar cada item, não processar se houver erro crítico

### Práticas Recomendadas para Implementação Futura

1. **M21 (Histórico):**
   - Implementar paginação desde o início (não esperar base crescer)
   - Adicionar índices no Supabase para queries rápidas

2. **M22 (Exportação):**
   - Validar schema de dados antes de gerar documento
   - Implementar preview antes de download final

3. **M23 (Lote):**
   - Implementar sistema de filas robusto (Redis + Bull)
   - Validar quota ANTES de aceitar upload
   - Implementar cancelamento de job em progresso
   - Notificar usuário a cada 10% de progresso

