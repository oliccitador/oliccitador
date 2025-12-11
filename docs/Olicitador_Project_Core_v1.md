# O Licitador - Project Core Global v1.0

**Data de Criação:** 2025-12-10  
**Versão:** 1.0  
**Status:** Documentação Oficial  

---

## 📋 Visão Global do Sistema

**O Licitador** é uma plataforma SaaS especializada em análise inteligente de itens licitatórios, validação de EPIs (CA) e CATMAT, e cotação automatizada de preços de mercado. O sistema utiliza IA (Google Gemini) para extrair informações técnicas de descrições complexas e integra múltiplas fontes de dados (Google Shopping, PNCP, bases governamentais) para fornecer cotações precisas e referências oficiais.

### Propósito Principal
Automatizar e otimizar o processo de análise de itens em licitações públicas, reduzindo tempo de pesquisa, aumentando precisão de cotações e garantindo conformidade com normas técnicas (CAs, CATMAT).

### Público-Alvo
- Gestores de compras públicas
- Pregoeiros
- Empresas participantes de licitações
- Consultorias especializadas em licitações

---

## 🏗️ Arquitetura Geral

### Stack Tecnológico
- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **IA:** Google Generative AI (Gemini 1.5 Flash / 2.0 Flash Exp)
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Pagamentos:** MercadoPago
- **Deploy:** Netlify
- **APIs Externas:**
  - Google Custom Search API
  - SerpApi (Google Shopping)
  - PNCP API (Portal Nacional de Contratações Públicas)

### Arquitetura de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACE (Frontend)                      │
│  M6: Análise | M7: Consulta CA | M8: Consulta CATMAT        │
│                    M9: Dashboard                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   CORE MODULES (Backend)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ M1: IA   │  │ M2: CA   │  │ M3:CATMAT│  │ M4:Preços│   │
│  │ Gemini   │  │ Validação│  │ Validação│  │ Cotação  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │              │             │          │
│       └─────────────┴──────────────┴─────────────┘          │
│                          │                                   │
│                    M5: PNCP Client                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              CONTROLE E INFRAESTRUTURA                       │
│  M10: Auth | M11: Pagamentos | M12: Rate Limit             │
│  M13: Cache | M14: Email | M15: Orchestrator               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Relação Entre Módulos

### Fluxo Principal de Análise (Via IA)
1. **Usuário** → Input de descrição → **M6 (Página Análise)**
2. **M6** → Chama API → **M1 (Gemini)**
3. **M1** → Valida CA (se detectado) → **M2 (CA/EPI)**
4. **M1** → Valida CATMAT (se detectado) → **M3 (CATMAT)**
5. **M1** → Retorna análise estruturada → **M6**
6. **Usuário** → Clica "Cotar Preços" → **M6**
7. **M6** → Chama API → **M4 (Busca de Preços)**
8. **M4** → Busca paralela → **SerpApi** + **M5 (PNCP)**
9. **M4** → Retorna top 3 preços + referências → **M6**

### Fluxo Bypass (Consulta Direta CA)
1. **Usuário** → Input de CA → **M7 (Consulta CA)**
2. **M7** → Busca dados → **M2 (CA/EPI)**
3. **M2** → Busca Google + Parse Gemini → Retorna ficha técnica
4. **Usuário** → Clica "Buscar Preços" → **M7**
5. **M7** → Chama API → **M4 (Busca de Preços)** com "Plano Radical"
6. **M4** → Busca ESTRITA por CA exato → **SerpApi**
7. **M4** → Filtra resultados (CA no título) → Retorna → **M7**

### Fluxo Bypass (Consulta Direta CATMAT)
1. **Usuário** → Input de CATMAT → **M8 (Consulta CATMAT)**
2. **M8** → Busca local → **M3 (CATMAT)**
3. **M3** → Retorna dados do JSON → **M8**
4. **Usuário** → Clica "Cotar Item" → **M8**
5. **M8** → Chama API → **M4 (Busca de Preços)**
6. **M4** → Busca por descrição CATMAT → Retorna → **M8**

---

## 📜 Regras Gerais do Projeto

### Regras de Deploy (GEMINI.md - 23 Regras)
1. Deploys na Netlify devem ser minimizados ao máximo
2. Deploy NÃO é ferramenta de debug; sempre resolver erros localmente primeiro
3. O ambiente local deve usar a MESMA versão de Node da Netlify
4. Antes de qualquer deploy, é obrigatório rodar localmente: `npm run build` e `netlify build`
5. Se o build local falhar, o deploy fica PROIBIDO até tudo passar localmente
6. Netlify CLI (`netlify build` / `netlify dev`) é a fonte de verdade para simular produção
7. Nunca corrigir erros fazendo vários deploys seguidos; sempre reproduzir localmente
8. A branch main/prod é sagrada; deploy só a partir dela
9. Branches de features ou fixes devem ser usadas para testes e correções
10. Ajustes devem ser pequenos e focados; evitar reescrever grandes partes do código
11. Deploy Preview só deve ser usado quando necessário; preview desnecessário é proibido
12. Sempre validar variáveis de ambiente entre `.env.local` e painel da Netlify antes de deploy
13. Erros de ambiente devem ser corrigidos antes de mexer em código
14. Máximo de 3 deploys de produção por dia, salvo autorização explícita do usuário
15. Sempre informar impacto de custo ao sugerir deploy
16. Nunca sugerir deploy sem explicar exatamente por que é necessário
17. Se forem necessárias mais de 2 tentativas de deploy para o mesmo erro, PAUSAR e reavaliar localmente
18. Se build falhar em produção, nunca tentar corrigir pelo deploy; sempre corrigir via `netlify build` local
19. Proteger créditos da Netlify como recurso crítico do projeto
20. Antes de sugerir deploy, confirmar explicitamente se o usuário autoriza consumir um deploy
21. A IA é responsável por criar e executar scripts de teste para validar qualquer alteração antes de solicitar validação humana
22. Fluxo de Desenvolvimento: 1) Definir Saída Esperada com Usuário; 2) IA implementa e testa internamente até atingir o resultado exato; 3) Usuário aprova resultado local; 4) Só então Deploy é autorizado
23. Antes de executar qualquer tarefa, o agente deve analisar a natureza da demanda e recomendar o modelo de IA mais adequado

### Regras de Código
- **TypeScript:** Preferencial para novos arquivos (`.ts`, `.tsx`)
- **JavaScript:** Aceitável para scripts e módulos legados (`.js`)
- **Nomenclatura:** camelCase para variáveis/funções, PascalCase para componentes React
- **Comentários:** Obrigatórios em funções complexas e decisões técnicas não óbvias
- **Error Handling:** Todo módulo que faz chamada externa deve ter try/catch e fallback

---

## 🔐 Dependências Externas

### APIs Críticas
| API | Propósito | Variável de Ambiente | Status |
|-----|-----------|---------------------|--------|
| Google Generative AI | Análise semântica (M1, M2) | `GOOGLE_API_KEY` | ✅ Ativa |
| Google Custom Search | Busca de dados CA (M2) | `GOOGLE_SEARCH_CX`, `GOOGLE_API_KEY` | ❌ Desativada (GCP) |
| SerpApi | Cotação Google Shopping (M4) | `SERPAPI_KEY` | ✅ Ativa |
| PNCP API | Referências governamentais (M5) | Nenhuma (pública) | ✅ Ativa |
| Supabase | Auth + DB (M10) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Ativa |
| MercadoPago | Pagamentos (M11) | `MERCADOPAGO_ACCESS_TOKEN` | ✅ Ativa (assumido) |

### Arquivos de Dados
- `catmat-db.json` (46MB) - Base de dados CATMAT local (M3)

---

## 🛡️ Requisitos de Segurança

### Autenticação
- Todas as rotas de API (exceto `/api/login`, `/api/register`) devem validar JWT via Supabase
- Tokens devem ser renovados automaticamente antes de expirar

### Proteção de Chaves
- Chaves de API NUNCA devem ser commitadas no repositório
- `.env.local` deve estar no `.gitignore`
- Variáveis de produção devem ser configuradas apenas no painel da Netlify

### Rate Limiting
- M12 deve limitar chamadas por usuário/plano
- Quotas devem ser definidas por tier de assinatura

### Validação de Input
- Todos os inputs de usuário devem ser sanitizados antes de envio para APIs externas
- Validação de formato de CA (apenas números)
- Validação de formato de CATMAT (números)

---

## 📊 Responsabilidades de Cada Parte

### Frontend (M6-M9, M18-M20)
- Validação de input (formato, tamanho)
- Exibição de loading states
- Tratamento de erros de API (mensagens amigáveis)
- Navegação entre módulos

### Backend Core (M1-M5)
- Lógica de negócio (análise, validação, cotação)
- Integração com APIs externas
- Tratamento de erros e fallbacks
- Logging de operações críticas

### Infraestrutura (M10-M17)
- Autenticação e autorização
- Controle de quotas
- Cache de resultados
- Monitoramento de uso

---

## 🗺️ Roadmap Macro

### ✅ Fase 1: MVP (Concluída)
- M1: Análise Gemini
- M6: Interface de análise
- M4: Cotação de preços básica
- M10: Autenticação

### 🟡 Fase 2: Validação e Precisão (Em Andamento)
- M2: Validação CA (BLOQUEADO - API desativada)
- M3: Validação CATMAT (CONCLUÍDO)
- M7: Consulta CA direta (BLOQUEADO)
- M8: Consulta CATMAT direta (CONCLUÍDO)
- M4: "Plano Radical" (filtro estrito de CA) (CONCLUÍDO)

### 🔵 Fase 3: Escala e Otimização (Planejada)
- M12: Rate limiting em produção
- M13: Cache otimizado
- M21: Histórico de análises
- M22: Exportação de relatórios

### 🔵 Fase 4: Expansão (Futura)
- M23: Análise em lote
- Integração com sistemas de compras públicas
- API pública para parceiros

---

## 🚨 Bloqueadores Críticos Atuais

### 1. Custom Search API Desativada (CRÍTICO)
- **Módulos Afetados:** M2, M7
- **Impacto:** Impossível validar CAs em produção
- **Solução:** Usuário deve ativar API no [Google Cloud Console](https://console.developers.google.com/apis/api/customsearch.googleapis.com/overview?project=766773995616)
- **Status:** Aguardando ação do usuário

### 2. Chave de API Inválida
- **Problema:** `GOOGLE_SEARCH_API_KEY` (AIzaSyAIOLq...) está revogada
- **Solução:** Código já ajustado para usar `GOOGLE_API_KEY` como fallback
- **Status:** Resolvido no código (commit `901a878`), aguardando ativação da API

---

## 📝 Notas Finais

Este documento é a **fonte da verdade** do projeto O Licitador. Qualquer decisão técnica, mudança de arquitetura ou novo módulo deve ser documentado aqui e nos respectivos arquivos modulares.

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador  
**Próxima Revisão:** Após ativação da Custom Search API e validação completa de M2/M7
