# M10-M12 – Módulos de Autenticação e Controle

**Versão:** 1.0  
**Data:** 2025-12-10  

---

## Identificação dos Módulos

Este documento consolida os **Módulos de Autenticação e Controle** do sistema O Licitador. Estes módulos garantem segurança, monetização e governança de uso do sistema.

**Papel Estratégico Conjunto:**  
M10-M12 formam a camada de controle e segurança do O Licitador. M10 garante que apenas usuários autorizados acessem o sistema. M11 monetiza o serviço através de assinaturas. M12 protege recursos (APIs, quotas) e garante sustentabilidade financeira ao limitar uso por tier de assinatura.

**Funcionamento Operacional Conjunto:**  
M10 valida credenciais e gerencia sessões via Supabase Auth. M11 processa pagamentos via MercadoPago e atualiza status de assinatura no banco de dados. M12 rastreia chamadas a APIs críticas (M1, M4) e bloqueia usuários que excedem quotas definidas por plano.

**Interações com Outros Módulos:**  
- **Dependem de:** Supabase (M10), MercadoPago (M11), M1 e M4 (M12 rastreia uso)
- **São usados por:** Todos os módulos que requerem autenticação (M6-M9) e controle de quota (M1, M4)

---

## M10: Autenticação (Supabase)

**Estado:** ✅ PRONTO  
**Arquivos:** `lib/supabase.ts`, `app/api/login/route.ts`, `app/login/page.tsx`, `app/register/page.tsx`

### Visão Geral
Gerenciamento de autenticação via Supabase Auth. Login, registro, sessão e proteção de rotas.

### Funções
- Login via email/senha
- Registro de novos usuários
- Gerenciamento de tokens JWT
- Middleware de proteção de rotas
- Logout

### Dependências Externas
- **Supabase Auth**
  - Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Estado Atual
✅ Funcional em produção

### Próximos Passos
- [ ] Implementar recuperação de senha
- [ ] Adicionar autenticação social (Google, Microsoft)
- [ ] Implementar 2FA

---

## M11: Controle de Assinaturas (MercadoPago)

**Estado:** ✅ PRONTO (assumido)  
**Arquivos:** `app/api/checkout/mercadopago/route.ts`, `app/api/webhooks/mercadopago/route.ts`

### Visão Geral
Gerenciamento de planos e pagamentos via MercadoPago. Checkout, webhooks e atualização de status.

### Funções
- Checkout de assinaturas (planos mensais/anuais)
- Webhooks de confirmação de pagamento
- Atualização de status de assinatura no Supabase
- Cancelamento de assinaturas

### Dependências Externas
- **MercadoPago API**
  - Variável: `MERCADOPAGO_ACCESS_TOKEN`

### Estado Atual
✅ Implementado (não testado nesta sessão)

### Próximos Passos
- [ ] Validar webhooks em produção
- [ ] Implementar renovação automática
- [ ] Adicionar gestão de faturas

---

## M12: Controle de Uso (Rate Limiting + Quotas)

**Estado:** 🟡 PARCIAL (Código existe, integração não validada)  
**Arquivos:** `lib/usage-tracker.js`, `lib/rate-limiter.js`

### Visão Geral
Limitar uso de APIs por usuário/plano. Rastreamento de chamadas e bloqueio de usuários que excedem quota.

### Funções
- Rastreamento de chamadas à API Gemini (M1)
- Rastreamento de cotações de preços (M4)
- Bloqueio de usuários que excedem quota
- Dashboard de uso (planejado)

### Dependências Internas
- M1 (Análise Gemini) - Deve registrar cada chamada
- M4 (Busca de Preços) - Deve registrar cada cotação
- M10 (Autenticação) - Identificação de usuário

### Estado Atual
🟡 Código existe, mas não está integrado nos endpoints

### Problemas Conhecidos
- Não testado em produção
- Integração com M1 e M4 pendente

### Próximos Passos
- [ ] Integrar `usage-tracker` em `/api/analyze` e `/api/prices`
- [ ] Definir quotas por tier de assinatura
- [ ] Testar limites em ambiente de staging
- [ ] Implementar dashboard de uso para usuários

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas (M10-M12)

### Erros Cometidos
1. **M12: Não Integrar Quotas em Produção**
   - Código existe mas não está ativo em M1 e M4
   - Risco: Usuários podem exceder quotas de APIs pagas

### Ajustes que Funcionaram
1. **M10: Supabase Auth Simplifica Autenticação**
   - Gerenciamento de sessão robusto sem código custom
   - Reduz superfície de ataque de segurança

### Práticas que NÃO Devem Ser Repetidas
1. **Implementar Funcionalidade Sem Integrar**
   - M12 existe mas não está sendo usado
   - Lição: Código não integrado é código morto (ou pior, dívida técnica)

