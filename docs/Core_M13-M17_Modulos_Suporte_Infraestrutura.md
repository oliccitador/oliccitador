# M13-M17 – Módulos de Suporte e Infraestrutura

**Versão:** 1.0  
**Data:** 2025-12-10  

---

## Identificação dos Módulos

Este documento consolida os **Módulos de Suporte e Infraestrutura** do sistema O Licitador. Estes módulos fornecem funcionalidades transversais que otimizam performance, facilitam comunicação, garantem qualidade e estabelecem governança de desenvolvimento.

**Papel Estratégico Conjunto:**  
M13-M17 formam a espinha dorsal operacional do O Licitador. M13 otimiza custos de API via cache. M14 mantém usuários informados. M15 orquestra fluxos complexos. M16 garante qualidade através de testes automatizados. M17 estabelece as regras de deploy que protegem a estabilidade do sistema e os recursos da Netlify.

**Funcionamento Operacional Conjunto:**  
M13 intercepta chamadas a APIs caras e retorna dados cacheados quando possível. M14 envia emails transacionais via serviço externo. M15 coordena chamadas entre módulos (se implementado). M16 fornece scripts executáveis para validação local. M17 define workflow de desenvolvimento (não é código, é processo).

**Interações com Outros Módulos:**  
- **Dependem de:** M1 e M4 (M13 cacheia resultados), Resend ou similar (M14), todos os módulos (M16 testa), processo de desenvolvimento (M17)
- **São usados por:** M1 e M4 (podem usar cache), usuários (recebem emails de M14), desenvolvedores (usam M16 e seguem M17)

---

## M13: Cache (Otimização de Performance)

**Estado:** ✅ PRONTO (assumido)  
**Arquivo:** `lib/cache.js`

### Visão Geral
Cache de resultados de análise e cotações para reduzir chamadas redundantes a APIs externas.

### Funções
- Armazenar resultados de análise por hash de query
- Armazenar resultados de cotação por produto
- TTL configurável (ex: 24h para análise, 1h para preços)
- Invalidação manual de cache

### Implementação
- Provavelmente usa memória local ou Redis
- Hash da query como chave

### Próximos Passos
- [ ] Validar implementação atual
- [ ] Monitorar hit rate
- [ ] Considerar Redis para ambiente distribuído

---

## M14: Email (Notificações)

**Estado:** 🟡 PARCIAL (Templates existem, integração não validada)  
**Arquivos:** `lib/email-templates.ts`, `scripts/test-resend.js`

### Visão Geral
Envio de emails transacionais (confirmação, recuperação de senha, notificações).

### Funções
- Templates de email (HTML)
- Integração com serviço de email (Resend?)
- Envio de confirmação de registro
- Envio de recuperação de senha
- Notificações de quota excedida

### Dependências Externas
- **Resend** (ou similar)
  - Variável: `RESEND_API_KEY` (provável)

### Estado Atual
🟡 Templates existem, mas envio não testado

### Próximos Passos
- [ ] Validar envio de emails em produção
- [ ] Testar templates em diferentes clientes de email
- [ ] Implementar tracking de emails (abertos, clicados)

---

## M15: Orquestrador de Fluxo (Flow Orchestrator)

**Estado:** 🟢 RASCUNHO (Propósito não claro)  
**Arquivo:** `lib/flow-orchestrator.js`

### Visão Geral
Coordenação de fluxos complexos entre módulos. Propósito não totalmente definido.

### Funções Potenciais
- Orquestrar chamadas sequenciais (M1 → M4 → M5)
- Gerenciar fallbacks e retries
- Logging de fluxo completo
- Tratamento de erros centralizado

### Estado Atual
🟢 Arquivo existe, mas uso não está claro no código atual

### Próximos Passos
- [ ] Definir casos de uso específicos
- [ ] Integrar com M1 e M4 (se aplicável)
- [ ] OU remover se redundante

---

## M16: Scripts de Diagnóstico e Testes

**Estado:** ✅ PRONTO (Criados durante sessão atual)  
**Arquivos:** 
- `scripts/diagnose-ca-search.js`
- `scripts/test-price-priority.js`
- `scripts/test-catmat-api.js`
- `scripts/test-gemini.js`
- `scripts/debug-market-search.js`

### Visão Geral
Scripts para validação local de módulos antes de deploy. Essenciais para seguir regras do GEMINI.md.

### Funções
- Testar APIs (Gemini, Google Search, PNCP, SerpApi)
- Validar lógica de busca de preços
- Diagnosticar erros de integração
- Reproduzir bugs localmente

### Uso
```bash
node scripts/diagnose-ca-search.js
node scripts/test-price-priority.js
node scripts/test-catmat-api.js
```

### Próximos Passos
- [ ] Consolidar em suite de testes automatizada (Jest ou Vitest)
- [ ] Adicionar CI/CD para rodar testes antes de deploy
- [ ] Criar script de validação pré-deploy (checklist automático)

---

## M17: Regras de Deploy (GEMINI.md)

**Estado:** ✅ ATIVO (Regras internalizadas)  
**Arquivo:** `GEMINI.md` (fora do projeto, mas referenciado)

### Visão Geral
Governança de deploy e desenvolvimento. 23 regras para minimizar deploys, validar localmente e proteger créditos da Netlify.

### Regras Principais
1. Deploys minimizados ao máximo
2. Deploy NÃO é ferramenta de debug
3. Ambiente local = Netlify (mesma versão Node)
4. Obrigatório: `npm run build` e `netlify build` antes de deploy
5. Máximo 3 deploys/dia (salvo autorização)
6. Fluxo: Definir → Implementar → Testar → Aprovar → Deploy

### Violações Nesta Sessão
- ❌ Múltiplos deploys consecutivos (Steps 10505-10658)
- ❌ Deploy usado como debug (tentativa-erro)

### Lições Aprendidas
- Criar scripts de diagnóstico ANTES de deploy
- Validar localmente com chaves reais
- Pausar após 2 tentativas de deploy falhadas

### Próximos Passos
- [ ] Aderir estritamente às regras
- [ ] Criar checklist de pré-deploy
- [ ] Implementar gate de aprovação (manual ou automático)

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas (M13-M17)

### Erros Cometidos
1. **M17: Violação Massiva das Regras de Deploy**
   - 5+ deploys consecutivos para debug (Steps 10505-10658)
   - Violação das regras 1, 2, 7, 14, 17 do GEMINI.md
   - Impacto: Desperdício de créditos Netlify, instabilidade

2. **M16: Scripts Criados Tarde Demais**
   - Scripts de diagnóstico só foram criados APÓS problemas em produção
   - Deveriam ter sido criados ANTES do primeiro deploy

### Ajustes que Funcionaram
1. **M16: Scripts de Diagnóstico Salvaram o Projeto**
   - `diagnose-ca-search.js` identificou exatamente o problema (API desativada)
   - Evitou mais deploys às cegas

2. **M17: Regras Internalizadas**
   - Após violações, regras foram documentadas e seguidas estritamente
   - Próximos desenvolvimentos seguirão workflow correto

### Ajustes que Não Funcionaram
1. **Deploy como Ferramenta de Debug**
   - Tentativa de "ver o que acontece" em produção
   - Resultado: Problema persistiu, créditos desperdiçados

### Práticas que NÃO Devem Ser Repetidas
1. **Deploy Sem Validação Local (CRÍTICO)**
   - Lição mais importante desta sessão
   - Fluxo correto: Script de teste → Validação local → Aprovação → Deploy ÚNICO

2. **Não Seguir Regra dos 2 Deploys**
   - Regra #17: Se 2 deploys não resolveram, PAUSAR e diagnosticar localmente
   - Violação: Continuamos até 5+ deploys
   - Lição: Regras existem por um motivo, seguir rigorosamente

