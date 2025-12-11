# 🎯 PROMPT DE IDENTIFICAÇÃO AUTOMÁTICA DE MÓDULO - O LICITADOR

**Versão:** 1.0  
**Data:** 2025-12-10  
**Propósito:** Template simplificado para abertura de chats com identificação automática de módulo

---

## 📋 COMO USAR ESTE TEMPLATE

1. Copie TODO o conteúdo da seção "TEMPLATE PARA COPIAR E COLAR" abaixo
2. Abra um novo chat no Google AI Studio
3. Selecione o modelo: **Claude Sonnet 4.5**
4. Cole o template
5. Substitua apenas a seção `[DESCREVA SEU PROBLEMA AQUI]` com sua descrição
6. Envie

**A IA fará o resto:** identificar módulo, ler documentação, consultar lições aprendidas e perguntar o que fazer.

---

## 📝 TEMPLATE PARA COPIAR E COLAR

```
═══════════════════════════════════════════════════════════════
PROJETO: O Licitador - Sistema SaaS de Análise de Licitações
MODO: Identificação Automática de Módulo
MODELO RECOMENDADO: Claude Sonnet 4.5
═══════════════════════════════════════════════════════════════

📝 DESCRIÇÃO DO PROBLEMA/FUNCIONALIDADE

Estou tendo problema com a busca de Certificados de Aprovação (CA).

SINTOMAS:
- Quando tento consultar um CA na página de Consulta CA, o sistema retorna "CA not found"
- Isso acontece para TODOS os CAs, mesmo os que sabemos que existem (ex: CA 40677, CA 40377)
- O módulo estava funcionando antes, mas parou de funcionar

CONTEXTO:
- Identificamos que a Custom Search API estava desativada no projeto GCP 766773995616
- JÁ ATIVEI a Custom Search API no Google Cloud Console
- Aguardei 5 minutos para propagação
- O código já foi ajustado para usar GOOGLE_API_KEY (Commit 901a878)
- Existe um script de diagnóstico: scripts/diagnose-ca-search.js

O QUE PRECISO:
Validar que o módulo está funcional após a ativação da API e, se necessário, fazer deploy controlado.

═══════════════════════════════════════════════════════════════

🤖 INSTRUÇÕES PARA A IA (Siga esta ordem rigorosamente)

PASSO 1: IDENTIFICAÇÃO DO MÓDULO
1. Leia o documento global do projeto:
   c:\Users\marco\.gemini\antigravity\playground\olicitador\docs\Olicitador_Project_Core_v1.md

2. Com base na minha descrição acima, identifique qual módulo (M1-M23) está relacionado

3. Me confirme:
   - Qual módulo você identificou (ex: M2, M4, etc.)
   - Por que você identificou este módulo
   - Qual é o nome completo do módulo
   - Qual é o propósito deste módulo

═══════════════════════════════════════════════════════════════

PASSO 2: CONTEXTUALIZAÇÃO PROFUNDA
4. Leia a documentação específica do módulo identificado:
   c:\Users\marco\.gemini\antigravity\playground\olicitador\docs\Core_M[X]_[Nome].md

5. Leia ESPECIALMENTE a seção "Histórico de Erros, Ajustes e Lições Aprendidas"

6. Identifique e me informe:
   
   a) ERROS JÁ COMETIDOS (que NÃO devo repetir):
      - Liste todos os erros documentados
      - Destaque os mais relevantes para meu problema
   
   b) AJUSTES QUE FUNCIONARAM (que devo priorizar):
      - Liste soluções que já foram bem-sucedidas
      - Indique commits relevantes
   
   c) AJUSTES QUE NÃO FUNCIONARAM (que devo evitar):
      - Liste abordagens que foram descartadas
      - Explique por que não funcionaram
   
   d) PRÁTICAS QUE NÃO DEVEM SER REPETIDAS:
      - Liste comportamentos que causaram problemas
      - Destaque lições críticas

═══════════════════════════════════════════════════════════════

PASSO 3: DIAGNÓSTICO DO ESTADO ATUAL
7. Me informe:
   
   a) ESTADO ATUAL DO MÓDULO:
      - Pronto / Parcial / Bloqueado / Futuro
   
   b) PROBLEMAS CONHECIDOS:
      - Liste problemas já documentados
      - Indique se meu problema está relacionado
   
   c) DEPENDÊNCIAS:
      - APIs externas necessárias
      - Outros módulos dependentes
      - Variáveis de ambiente críticas
   
   d) ARQUIVOS PRINCIPAIS:
      - Código principal do módulo
      - Scripts de teste disponíveis
      - Documentação relacionada

═══════════════════════════════════════════════════════════════

PASSO 4: PLANEJAMENTO DE AÇÃO
8. Com base em TUDO que você leu, me pergunte:
   
   a) Confirme se entendeu meu problema corretamente
   
   b) Ofereça opções de ação baseadas nas lições aprendidas:
      - Opção A: [Baseada em ajuste que funcionou]
      - Opção B: [Baseada em outro ajuste que funcionou]
      - Opção C: [Nova abordagem, se necessário]
   
   c) Para cada opção, indique:
      - O que será feito
      - Por que esta abordagem (referência a lições)
      - Quais scripts de teste serão usados
      - Se haverá deploy (e quantos)
      - Tempo estimado

9. AGUARDE minha confirmação de qual opção escolher ANTES de propor código ou comandos

═══════════════════════════════════════════════════════════════

📜 REGRAS OBRIGATÓRIAS (GEMINI.md - Nunca Violar)

Você DEVE seguir rigorosamente:

1. ❌ NUNCA repetir erros já documentados em "Lições Aprendidas"
2. ✅ SEMPRE priorizar ajustes que já funcionaram anteriormente
3. ✅ SEMPRE evitar ajustes que foram descartados
4. ✅ SEMPRE criar/executar scripts de teste ANTES de implementar mudanças
5. ✅ SEMPRE validar 100% localmente ANTES de qualquer deploy
6. ✅ Deploy NÃO é ferramenta de debug
7. ✅ Máximo de 1 deploy por sessão (só se validação local for 100%)
8. ✅ Se 2 deploys não resolveram, PAUSAR e diagnosticar localmente
9. ✅ SEMPRE atualizar documentação ao final (Estado + Lições Aprendidas)

VIOLAÇÕES ANTERIORES DOCUMENTADAS (Aprender com elas):
- 5+ deploys consecutivos para debug (Steps 10505-10658)
- Deploy sem validação local
- Não criar script de diagnóstico antes de implementar
- Assumir que variáveis de ambiente estavam corretas

NÃO REPETIR ESSES ERROS.

═══════════════════════════════════════════════════════════════

✅ CHECKLIST DE VALIDAÇÃO (Você deve confirmar ao final)

Antes de propor qualquer solução, confirme que você:

- [ ] Leu Olicitador_Project_Core_v1.md
- [ ] Identificou o módulo correto
- [ ] Leu Core_M[X]_[Nome].md completo
- [ ] Leu seção "Lições Aprendidas" do módulo
- [ ] Identificou erros a NÃO repetir
- [ ] Identificou ajustes que funcionaram (para priorizar)
- [ ] Identificou ajustes que NÃO funcionaram (para evitar)
- [ ] Entendeu o estado atual do módulo
- [ ] Entendeu o problema descrito
- [ ] Ofereceu opções baseadas em lições aprendidas
- [ ] Aguardou confirmação antes de propor código

═══════════════════════════════════════════════════════════════

🚀 PRÓXIMA AÇÃO

Comece pelo PASSO 1: Identifique qual módulo está relacionado ao meu problema e me confirme sua identificação antes de prosseguir.
```

---

## 💡 EXEMPLO DE USO (Problema do CA)

**Você cola o template acima e a IA responde:**

```
Entendi seu problema. Vou seguir o processo de identificação.

═══════════════════════════════════════════════════════════════
PASSO 1: IDENTIFICAÇÃO DO MÓDULO
═══════════════════════════════════════════════════════════════

[Lendo Olicitador_Project_Core_v1.md...]

✅ MÓDULO IDENTIFICADO: M2 - CA/EPI (Validação e Busca de Certificados de Aprovação)

JUSTIFICATIVA:
Sua descrição menciona "busca de Certificados de Aprovação (CA)" e "página de Consulta CA".
No documento global, identifiquei que:
- M2 é responsável por buscar e validar dados oficiais de CAs
- M7 (Página de Consulta CA) depende 100% de M2
- O sintoma "CA not found" é característico de falha em M2

NOME COMPLETO: Módulo CA/EPI (Validação e Busca)

PROPÓSITO: 
Buscar dados oficiais de Certificados de Aprovação via Google Custom Search API,
estruturar com Gemini e fornecer informações como fabricante, validade, descrição técnica.

Confirma que identifiquei corretamente? Se sim, prossigo para o PASSO 2.
```

**Você responde:** "Sim, correto. Prossiga."

**IA continua:**

```
═══════════════════════════════════════════════════════════════
PASSO 2: CONTEXTUALIZAÇÃO PROFUNDA
═══════════════════════════════════════════════════════════════

[Lendo Core_M2_Modulo_CA_EPI.md...]
[Lendo seção "Histórico de Erros, Ajustes e Lições Aprendidas"...]

a) ERROS JÁ COMETIDOS (NÃO repetir):

   🔴 CRÍTICO - Chave de API Inválida Não Detectada Localmente
   - Erro: Não validar chaves de API antes de deploy
   - Sintoma: GOOGLE_SEARCH_API_KEY estava revogada
   - Impacto: M2 e M7 inoperantes, "CA not found" para TODOS os CAs
   - Data: 2025-12-10

   🔴 CRÍTICO - Custom Search API Não Ativada no GCP
   - Erro: Assumir que API estava ativada sem verificar
   - Sintoma: Erro 403 "SERVICE_DISABLED"
   - Impacto: Bloqueio total de M2
   - Data: 2025-12-10

   🔴 Múltiplos Deploys para Debug
   - Erro: Tentar corrigir via deploy em vez de diagnóstico local
   - Sintoma: 5+ deploys consecutivos sem resolver
   - Impacto: Desperdício de créditos Netlify
   - Data: 2025-12-10

b) AJUSTES QUE FUNCIONARAM (priorizar):

   ✅ Criação de Script de Diagnóstico Local
   - Solução: scripts/diagnose-ca-search.js
   - Resultado: Identificou exatamente o problema (API desativada)
   - Data: 2025-12-10

   ✅ Priorização de GOOGLE_API_KEY (Commit 901a878)
   - Solução: Usar GOOGLE_API_KEY em vez de chave dedicada revogada
   - Resultado: Código usa chave do projeto GCP ativo
   - Data: 2025-12-10

   ✅ Implementação de Retry com Query Alternativa (Commit f1e64b4)
   - Solução: Se query falhar, tentar query mais genérica
   - Resultado: Aumento de taxa de sucesso estimado de 70% para 85%
   - Data: 2025-12-10

c) AJUSTES QUE NÃO FUNCIONARAM (evitar):

   ❌ Tentativa de Usar Chave Dedicada de Busca
   - Abordagem: GOOGLE_SEARCH_API_KEY separada
   - Problema: Chave estava revogada
   - Resultado: Erro 400, descartada

   ❌ Deploy para "Testar" Se API Funcionaria
   - Abordagem: Fazer deploy esperando que problema se resolvesse
   - Problema: API continuou desativada
   - Resultado: Desperdício de deploy

d) PRÁTICAS QUE NÃO DEVEM SER REPETIDAS:

   🚫 Deploy Sem Validação Local de APIs Externas (CRÍTICO)
   - Lição: SEMPRE criar script de diagnóstico que testa APIs externas ANTES de deploy

   🚫 Assumir que Variáveis de Ambiente Estão Corretas
   - Lição: Script deve validar: (1) Chave existe, (2) Chave é válida, (3) API ativada

   🚫 Usar Deploy como Ferramenta de Debug
   - Lição: Se 2 deploys não resolveram, PAUSAR e diagnosticar localmente

═══════════════════════════════════════════════════════════════
PASSO 3: DIAGNÓSTICO DO ESTADO ATUAL
═══════════════════════════════════════════════════════════════

a) ESTADO ATUAL: 🔴 BLOQUEADO (mas você já ativou a API, então deve estar resolvido)

b) PROBLEMA CONHECIDO: Custom Search API desativada (você já resolveu isso)

c) DEPENDÊNCIAS:
   - Google Custom Search API (você ativou ✓)
   - Google Gemini API (para estruturar dados)
   - Variáveis: GOOGLE_API_KEY, GOOGLE_SEARCH_CX

d) ARQUIVOS PRINCIPAIS:
   - lib/ca-real-search.js (lógica de busca)
   - scripts/diagnose-ca-search.js (teste local - JÁ EXISTE)

═══════════════════════════════════════════════════════════════
PASSO 4: PLANEJAMENTO DE AÇÃO
═══════════════════════════════════════════════════════════════

CONFIRMAÇÃO: Entendi que você ativou a Custom Search API e quer validar
que M2 está funcional. Correto?

OPÇÕES DE AÇÃO (baseadas em lições aprendidas):

┌─────────────────────────────────────────────────────────────┐
│ OPÇÃO A: Validação Local com Script de Diagnóstico         │
│ (RECOMENDADA - Baseada em "Ajuste que Funcionou")          │
├─────────────────────────────────────────────────────────────┤
│ O QUE: Executar script de diagnóstico local                │
│ POR QUÊ: Lição aprendida - script identificou problema     │
│ SCRIPT: node scripts/diagnose-ca-search.js                 │
│ DEPLOY: 0 (só validação local)                             │
│ TEMPO: 2 minutos                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OPÇÃO B: Validação + Deploy Controlado                     │
│ (Se Opção A for 100% bem-sucedida)                         │
├─────────────────────────────────────────────────────────────┤
│ O QUE: Validar local → Deploy único → Testar produção      │
│ POR QUÊ: Lição aprendida - validar antes de deploy         │
│ SCRIPT: diagnose-ca-search.js + git push                   │
│ DEPLOY: 1 (máximo permitido)                               │
│ TEMPO: 5 minutos                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OPÇÃO C: Diagnóstico de Erro Residual                      │
│ (Se Opção A falhar)                                        │
├─────────────────────────────────────────────────────────────┤
│ O QUE: Analisar erro do script → Corrigir → Testar         │
│ POR QUÊ: Lição aprendida - não fazer deploy se local falha │
│ SCRIPT: diagnose-ca-search.js (iterativo)                  │
│ DEPLOY: 0 (até validação local passar)                     │
│ TEMPO: 10-30 minutos (depende do erro)                     │
└─────────────────────────────────────────────────────────────┘

Qual opção você escolhe? 
(Recomendo começar pela Opção A)
```

---

**Pronto! Template final criado e exemplificado com o problema real do CA.** 🎯✨

