# M18-M20 – Módulos de Páginas Estáticas e Legais

**Versão:** 1.0  
**Data:** 2025-12-10  

---

## Identificação dos Módulos

Este documento consolida os **Módulos de Páginas Estáticas e Legais** do sistema O Licitador. Estes módulos fornecem informações institucionais, conformidade legal e pontos de conversão.

**Papel Estratégico Conjunto:**  
M18-M20 formam a camada de marketing, compliance e suporte do O Licitador. M18 atrai e converte visitantes em usuários (landing page), garante conformidade legal (termos, privacidade) e confirma transações (obrigado). M19 oferece canal de suporte. M20 tem propósito não documentado (possível integração externa).

**Funcionamento Operacional Conjunto:**  
M18 são páginas estáticas ou semi-estáticas (Next.js SSG/SSR) que apresentam conteúdo informativo. M19 pode ter formulário de contato ou FAQ interativo. M20 pode ser endpoint de webhook ou página de integração com sistema externo.

**Interações com Outros Módulos:**  
- **Dependem de:** M10 (Autenticação - para página obrigado), M11 (Pagamentos - para página obrigado)
- **São usados por:** Visitantes (landing page), usuários (termos, privacidade, suporte), sistemas externos (M20?)

---

## M18: Páginas Institucionais

**Estado:** ✅ PRONTO (assumido)  
**Arquivos:** 
- `app/page.tsx` (Landing page)
- `app/terms/page.tsx` (Termos de uso)
- `app/privacy/page.tsx` (Política de privacidade)
- `app/obrigado/page.tsx` (Pós-checkout)

### Visão Geral
Páginas de marketing, legais e transacionais.

### Funções
- **Landing Page:** Apresentação do produto, CTAs, pricing
- **Termos de Uso:** Condições de uso do serviço
- **Política de Privacidade:** LGPD compliance
- **Obrigado:** Confirmação pós-checkout

### Próximos Passos
- [ ] Revisão jurídica de termos e privacidade
- [ ] Otimização SEO da landing page
- [ ] A/B testing de CTAs

---

## M19: Página de Atendimento/Suporte

**Estado:** ✅ PRONTO (assumido)  
**Arquivo:** `app/atendimento/page.tsx`

### Visão Geral
Interface de contato ou FAQ para suporte ao usuário.

### Funções
- Formulário de contato
- FAQ (perguntas frequentes)
- Links para documentação
- Chat (se implementado)

### Próximos Passos
- [ ] Integrar com sistema de tickets (ex: Zendesk)
- [ ] Implementar chatbot (ex: Intercom)
- [ ] Adicionar base de conhecimento

---

## M20: Página SICX (Integração Externa?)

**Estado:** 🟢 RASCUNHO (Propósito não claro)  
**Arquivos:** `app/sicx/page.tsx`, `app/api/notify-sicx/route.ts`

### Visão Geral
Módulo de propósito não documentado. Possivelmente integração com sistema externo.

### Hipóteses
- Integração com sistema de compras públicas (SICX?)
- Notificação de eventos externos
- Webhook para sistema parceiro

### Estado Atual
🟢 Código existe, mas não foi utilizado/testado nesta sessão

### Próximos Passos
- [ ] Documentar propósito do módulo
- [ ] Validar se ainda é necessário
- [ ] Remover se obsoleto

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas (M18-M20)

### Erros Cometidos
1. **M20 (SICX): Propósito Não Documentado**
   - Módulo existe mas ninguém sabe para que serve
   - Risco: Código órfão, possível remoção acidental

### Práticas que NÃO Devem Ser Repetidas
1. **Criar Código Sem Documentar Propósito**
   - Todo módulo deve ter documentação clara de objetivo
   - Lição: Se não está documentado, não existe oficialmente

