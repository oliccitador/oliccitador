# 🎯 GUIA DE ESTRATÉGIA DE CHATS MODULARES - O LICITADOR

**Versão:** 2.0  
**Data:** 2025-12-10  
**Propósito:** Guia operacional para abertura de chats modulares com foco, qualidade e zero regressão

---

## 📖 O QUE É ESTE GUIA?

Este documento é seu **manual de referência** para abrir chats modulares no projeto O Licitador. Ele garante que:

- ✅ Você não repita erros já cometidos
- ✅ Você reutilize soluções que funcionaram
- ✅ Você siga o workflow correto (teste local → validação → deploy)
- ✅ Você atualize a documentação após cada sessão
- ✅ Você mantenha foco absoluto em um módulo por vez

---

## 🚨 REGRA DE OURO

**NUNCA abra um chat modular sem:**
1. Ler a documentação do módulo (`Core_M[X]_*.md`)
2. Ler a seção "Lições Aprendidas" do módulo
3. Copiar e colar o template de prompt inicial (veja seção abaixo)

---

## 📋 TEMPLATE DE PROMPT INICIAL (Copie e Cole)

**Use este template SEMPRE ao abrir um novo chat modular:**

```
═══════════════════════════════════════════════════════════════
PROJETO: O Licitador - Sistema SaaS de Análise de Licitações
MÓDULO: M[X] - [Nome do Módulo]
MODELO RECOMENDADO: [Claude Sonnet 4.5 / Gemini 3 Pro / etc]
═══════════════════════════════════════════════════════════════

📚 DOCUMENTAÇÃO OBRIGATÓRIA (Ler ANTES de qualquer ação)

1. DOCUMENTO GLOBAL (Visão Macro):
   c:\Users\marco\.gemini\antigravity\playground\olicitador\docs\Olicitador_Project_Core_v1.md

2. DOCUMENTO DO MÓDULO (Visão Micro):
   c:\Users\marco\.gemini\antigravity\playground\olicitador\docs\Core_M[X]_[Nome].md

═══════════════════════════════════════════════════════════════

⚠️ LIÇÕES APRENDIDAS - LEITURA OBRIGATÓRIA

Antes de propor QUALQUER implementação, você DEVE:

1. Ler completamente a seção "Histórico de Erros, Ajustes e Lições Aprendidas"
2. Identificar erros já cometidos neste módulo
3. Identificar ajustes que funcionaram
4. Identificar ajustes que NÃO funcionaram
5. Identificar práticas que NÃO devem ser repetidas

REGRAS ABSOLUTAS:
- ❌ NUNCA repetir erros já registrados
- ✅ SEMPRE priorizar abordagens que já funcionaram
- ✅ SEMPRE evitar abordagens que foram descartadas
- ✅ SEMPRE consultar lições antes de gerar código

═══════════════════════════════════════════════════════════════

🎯 OBJETIVO DESTA SESSÃO

[Descreva o que você quer fazer]

Exemplo:
"Implementar retry logic para chamadas à API X, baseado nas lições aprendidas de M2."

═══════════════════════════════════════════════════════════════

📜 REGRAS OBRIGATÓRIAS (GEMINI.md - 23 Regras)

Resumo das mais críticas:
1. Deploy NÃO é ferramenta de debug
2. Validar TUDO localmente antes de deploy
3. Criar scripts de teste ANTES de implementar
4. Máximo de 1 deploy por sessão (só se validação local for 100%)
5. Se 2 deploys não resolveram, PAUSAR e diagnosticar localmente

═══════════════════════════════════════════════════════════════

🚀 PRÓXIMA AÇÃO

[Primeira tarefa específica]
```

---

## 🗂️ ÍNDICE DE MÓDULOS DO O LICITADOR

Use esta tabela para identificar rapidamente qual módulo trabalhar:

| Código | Nome do Módulo | Propósito | Arquivo de Documentação | Prioridade |
|--------|----------------|-----------|------------------------|------------|
| **M1** | Análise Gemini (IA Principal) | Análise semântica de descrições licitatórias | `Core_M1_Modulo_Analise_Gemini.md` | 🟢 Pronto |
| **M2** | CA/EPI (Validação de CAs) | Busca e validação de Certificados de Aprovação | `Core_M2_Modulo_CA_EPI.md` | 🔴 BLOQUEADO |
| **M3** | CATMAT (Validação) | Validação de códigos CATMAT | `Core_M3_Modulo_CATMAT.md` | 🟢 Pronto |
| **M4** | Busca de Preços (Cotação) | Cotação de preços via Google Shopping + PNCP | `Core_M4_Modulo_Busca_de_Precos.md` | 🟢 Pronto |
| **M5** | PNCP (Referências Gov.) | Busca de referências governamentais | `Core_M5_Modulo_PNCP.md` | 🟢 Pronto |
| **M6** | Página de Análise | Interface principal de análise | `Core_M6-M9_Modulos_Interface.md` | 🟢 Pronto |
| **M7** | Consulta CA (Bypass IA) | Consulta direta de CA | `Core_M6-M9_Modulos_Interface.md` | 🔴 BLOQUEADO |
| **M8** | Consulta CATMAT (Bypass IA) | Consulta direta de CATMAT | `Core_M6-M9_Modulos_Interface.md` | 🟢 Pronto |
| **M9** | Dashboard Principal | Hub de navegação | `Core_M6-M9_Modulos_Interface.md` | 🟢 Pronto |
| **M10** | Autenticação (Supabase) | Login, registro, sessão | `Core_M10-M12_Modulos_Autenticacao_Controle.md` | 🟢 Pronto |
| **M11** | Assinaturas (MercadoPago) | Pagamentos e planos | `Core_M10-M12_Modulos_Autenticacao_Controle.md` | 🟢 Pronto |
| **M12** | Controle de Quotas | Rate limiting e quotas | `Core_M10-M12_Modulos_Autenticacao_Controle.md` | 🟡 Parcial |
| **M13** | Cache | Otimização de performance | `Core_M13-M17_Modulos_Suporte_Infraestrutura.md` | 🟢 Pronto |
| **M14** | Email (Notificações) | Envio de emails transacionais | `Core_M13-M17_Modulos_Suporte_Infraestrutura.md` | 🟡 Parcial |
| **M15** | Orquestrador de Fluxo | Coordenação de módulos | `Core_M13-M17_Modulos_Suporte_Infraestrutura.md` | 🟢 Rascunho |
| **M16** | Scripts de Diagnóstico | Testes e validação local | `Core_M13-M17_Modulos_Suporte_Infraestrutura.md` | 🟢 Pronto |
| **M17** | Regras de Deploy (GEMINI.md) | Governança de deploy | `Core_M13-M17_Modulos_Suporte_Infraestrutura.md` | 🟢 Ativo |
| **M18** | Páginas Institucionais | Landing, termos, privacidade | `Core_M18-M20_Modulos_Paginas_Estaticas.md` | 🟢 Pronto |
| **M19** | Atendimento/Suporte | FAQ, contato | `Core_M18-M20_Modulos_Paginas_Estaticas.md` | 🟢 Pronto |
| **M20** | SICX (Integração Externa?) | Propósito não documentado | `Core_M18-M20_Modulos_Paginas_Estaticas.md` | 🟢 Rascunho |
| **M21** | Histórico de Análises | Armazenamento de análises | `Core_M21-M23_Modulos_Futuros.md` | 🔵 Futuro |
| **M22** | Exportação (PDF/Excel) | Geração de relatórios | `Core_M21-M23_Modulos_Futuros.md` | 🔵 Futuro |
| **M23** | Análise em Lote | Processamento de planilhas | `Core_M21-M23_Modulos_Futuros.md` | 🔵 Futuro |

**Legenda:**
- 🔴 BLOQUEADO - Não funciona, precisa de ação urgente
- 🟡 PARCIAL - Funciona parcialmente, precisa de integração/validação
- 🟢 PRONTO - Funcional em produção
- 🔵 FUTURO - Planejado, não implementado

---

## 🎯 ORDEM DE PRIORIDADE RECOMENDADA

### **🔴 CRÍTICO (Fazer Agora)**

1. **M2 (CA/EPI)** - BLOQUEADOR
   - **Por quê:** M7 depende 100% de M2
   - **Ação:** Validar que Custom Search API está ativa
   - **Tempo estimado:** 30 minutos

### **🟡 IMPORTANTE (Fazer em Seguida)**

2. **M12 (Controle de Quotas)**
   - **Por quê:** Proteger custos de APIs pagas
   - **Ação:** Integrar em M1 e M4
   - **Tempo estimado:** 2-3 horas

3. **M4 (Validação do Plano Radical)**
   - **Por quê:** Monitorar eficácia em produção
   - **Ação:** Coletar métricas, ajustar se necessário
   - **Tempo estimado:** 1-2 horas

### **🟢 MELHORIAS (Fazer Depois)**

4. **M14 (Validação de Emails)**
   - **Por quê:** Garantir que notificações funcionam
   - **Tempo estimado:** 1 hora

5. **M21 (Histórico de Análises)**
   - **Por quê:** Valor agregado para usuários
   - **Tempo estimado:** 1-2 semanas

6. **M22 (Exportação PDF/Excel)**
   - **Por quê:** Profissionalização de relatórios
   - **Tempo estimado:** 2-3 semanas

7. **M23 (Análise em Lote)**
   - **Por quê:** Escala para usuários avançados
   - **Tempo estimado:** 4-6 semanas

---

## 🔄 WORKFLOW OBRIGATÓRIO

**Siga esta ordem SEMPRE:**

```
1. Ler Olicitador_Project_Core_v1.md (Visão Macro)
   ↓
2. Ler Core_M[X]_[Nome].md (Visão Micro)
   ↓
3. Ler seção "Lições Aprendidas" (GATE DE QUALIDADE)
   ↓
4. Identificar:
   - Erros a NÃO repetir
   - Ajustes que funcionaram
   - Ajustes que NÃO funcionaram
   ↓
5. IA cria scripts de teste (ANTES de implementar)
   ↓
6. Você executa scripts localmente
   ↓
7. IA implementa mudanças
   ↓
8. Você valida localmente (100% OK)
   ↓
9. IA atualiza documentação (Estado + Lições)
   ↓
10. Você aprova deploy (se necessário, máximo 1)
   ↓
11. Fechar chat com resumo
```

---

## ✅ CHECKLIST ANTES DE ABRIR CHAT

- [ ] Identifiquei qual módulo vou trabalhar (M1-M23)
- [ ] Li a documentação do módulo (`Core_M[X]_*.md`)
- [ ] Li a seção "Lições Aprendidas" do módulo
- [ ] Identifiquei objetivo específico da sessão
- [ ] Preparei ambiente local (chaves de API, dependências)
- [ ] Copiei template de prompt inicial
- [ ] Selecionei modelo de IA adequado

---

## ✅ CHECKLIST AO FINALIZAR CHAT

- [ ] Objetivo da sessão foi alcançado
- [ ] Lições Aprendidas foram consultadas ANTES de implementar
- [ ] Erros documentados NÃO foram repetidos
- [ ] Scripts de teste foram criados e executados
- [ ] Validação local foi 100% bem-sucedida
- [ ] **Documentação foi atualizada:**
  - [ ] Seção "Estado Atual"
  - [ ] Seção "Histórico de Erros, Ajustes e Lições Aprendidas"
  - [ ] Seção "Próximos Passos"
- [ ] Commit foi feito com mensagem descritiva
- [ ] Deploy foi controlado (máximo 1, se necessário)
- [ ] Regras GEMINI.md foram seguidas

---

## 🚨 ERROS COMUNS A EVITAR

### **❌ NÃO FAÇA:**

1. **Abrir chat sem ler documentação**
   - Consequência: Repetir erros já cometidos
   - Solução: Sempre ler `Core_M[X]_*.md` antes

2. **Fazer deploy sem validação local**
   - Consequência: Desperdício de créditos, instabilidade
   - Solução: Executar scripts de teste localmente

3. **Misturar múltiplos módulos em um chat**
   - Consequência: Perda de foco, contexto confuso
   - Solução: Um chat = Um módulo = Um objetivo

4. **Não atualizar documentação ao final**
   - Consequência: Perda de conhecimento, repetição de erros
   - Solução: Sempre atualizar "Lições Aprendidas"

5. **Fazer múltiplos deploys para debug**
   - Consequência: Violação de regras, desperdício
   - Solução: Se 2 deploys não resolveram, PAUSAR e diagnosticar localmente

### **✅ FAÇA:**

1. **Consulte "Lições Aprendidas" ANTES de implementar**
2. **Crie scripts de teste ANTES de escrever código**
3. **Valide 100% localmente ANTES de deploy**
4. **Atualize documentação SEMPRE ao final**
5. **Siga workflow obrigatório (não pule etapas)**

---

## 📝 EXEMPLO PRÁTICO: CHAT PARA M2

**Situação:** Preciso validar que M2 está funcional após ativar Custom Search API.

**Passo 1: Ler Documentação**
```
Abrir: docs/Core_M2_Modulo_CA_EPI.md
Ler: Seção "Lições Aprendidas"
```

**Passo 2: Identificar Lições Relevantes**
- ❌ Erro: Não validar chaves de API antes de deploy
- ✅ Ajuste que funcionou: Script de diagnóstico local
- ❌ Prática a NÃO repetir: Deploy sem validação local

**Passo 3: Copiar Template de Prompt**
```
PROJETO: O Licitador
MÓDULO: M2 - CA/EPI
MODELO: Claude Sonnet 4.5

[... resto do template ...]

OBJETIVO: Validar que Custom Search API está funcional

PRÓXIMA AÇÃO: Executar node scripts/diagnose-ca-search.js
```

**Passo 4: Abrir Chat e Colar Prompt**

**Passo 5: Seguir Instruções da IA**
- Executar script de diagnóstico
- Validar resultados
- Se OK → Aprovar deploy
- Se NOK → Diagnosticar localmente

**Passo 6: Atualizar Documentação**
- Atualizar "Estado Atual" de M2 (BLOQUEADO → PRONTO)
- Adicionar em "Lições Aprendidas": "Resolução do bloqueador: Ativação da API no GCP resolveu problema"

**Passo 7: Fechar Chat**

---

## 🎯 RESUMO EXECUTIVO

**Este guia garante:**
- ✅ Zero erros repetidos
- ✅ Máxima reutilização de soluções
- ✅ Workflow consistente
- ✅ Documentação sempre atualizada
- ✅ Foco absoluto em um módulo por vez

**Fluxo Simplificado:**
```
Ler Docs → Consultar Lições → Testar Local → Implementar → Atualizar Lições → Deploy (se necessário)
```

---

## 📞 SUPORTE

**Se tiver dúvidas:**
1. Consulte `Olicitador_Project_Core_v1.md` (visão geral)
2. Consulte `Core_M[X]_*.md` (módulo específico)
3. Consulte este guia (`GUIA_Estrategia_Chats_Modulares.md`)

**Documentação sempre atualizada em:**
`c:\Users\marco\.gemini\antigravity\playground\olicitador\docs\`

---

**Última Atualização:** 2025-12-10  
**Versão:** 2.0  
**Status:** Guia Operacional Definitivo ✅
