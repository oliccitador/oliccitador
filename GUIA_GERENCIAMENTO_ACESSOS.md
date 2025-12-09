# 📘 Guia de Gerenciamento de Acessos

## 🎁 Como LIBERAR Acesso Gratuito (Plano Básico)

### Passo a Passo

1. **Abra o Terminal** no diretório do projeto:
   ```bash
   cd c:\Users\marco\.gemini\antigravity\playground\olicitador
   ```

2. **Execute o comando de liberação**:
   ```bash
   node scripts/grant-free-access.mjs EMAIL_DO_USUARIO
   ```
   
   **Exemplo real:**
   ```bash
   node scripts/grant-free-access.mjs joao.silva@gmail.com
   ```

3. **Aguarde o processo** (demora ~5-10 segundos):
   - O script verifica se o usuário já existe
   - Se não existir, cria a conta
   - Configura o plano Básico (50 análises/mês)
   - Define validade de 1 ano
   - Envia email automático com link de senha

4. **Resultado esperado**:
   ```
   ✨ Processo concluído com sucesso!
   📊 Resumo:
      Email: joao.silva@gmail.com
      User ID: abc123...
      Plano: Básico (50 análises/mês)
      Validade: 1 ano
      Status: Ativo
   ```

5. **Se o email falhar** (problema no Resend):
   - O script mostra um link manual no formato:
     ```
     🔗 Link de acesso:
        https://oliccitador.com.br/definir-senha#access_token=...
     ```
   - Copie e envie esse link para o usuário via WhatsApp/Email manual

### ⚠️ Observações Importantes

- **SENHA FIXA:** Todos os usuários de feedback recebem a senha: `Feedback2025!`
- **Senha BLOQUEADA:** Usuários de feedback **NÃO PODEM** alterar a senha
  - Se tentarem usar "Esqueci minha senha", verão uma tela de bloqueio
  - Se tentarem mudar no painel, a alteração será bloqueada
- **Usuário novo**: Não receberá email (senha é conhecida e fixa)
- **Usuário existente**: Plano será atualizado, mas NÃO receberá novo email
- **Validade**: Acesso gratuito dura 1 ano automaticamente
- **Quota**: 50 análises por mês (renova automaticamente)
- **Segurança**: A senha fixa facilita testes, mas mantém controle centralizado

---

## 🚫 Como BLOQUEAR Acesso de um Usuário

### Passo a Passo

1. **Abra o Terminal** no diretório do projeto:
   ```bash
   cd c:\Users\marco\.gemini\antigravity\playground\olicitador
   ```

2. **Execute o comando de bloqueio**:
   ```bash
   node scripts/revoke-access.mjs EMAIL_DO_USUARIO
   ```
   
   **Exemplo real:**
   ```bash
   node scripts/revoke-access.mjs joao.silva@gmail.com
   ```

3. **Aguarde o processo** (demora ~3-5 segundos):
   - O script busca o usuário no banco
   - Desativa a subscription (status = cancelled)
   - Zera a quota (quota_limit = 0)
   - Remove todas as sessões ativas (força logout)

4. **Resultado esperado**:
   ```
   ✅ Acesso bloqueado com sucesso!
   📊 Resumo:
      Email: joao.silva@gmail.com
      User ID: abc123...
      Status: Bloqueado
      Quota: 0
   
   💡 O usuário não conseguirá mais fazer análises.
   ```

5. **O que acontece com o usuário bloqueado**:
   - Se estiver logado, será desconectado imediatamente
   - Ao tentar fazer login novamente, conseguirá entrar
   - Mas ao tentar analisar um item, verá: "Quota esgotada"
   - Não poderá fazer mais análises até reativar

### ⚠️ Observações Importantes

- **Bloqueio não deleta a conta**: Apenas desativa o acesso
- **Reversível**: Você pode reativar executando `grant-free-access.mjs` de novo
- **Histórico preservado**: Análises antigas do usuário permanecem no banco

---

## 🔄 Como REATIVAR um Usuário Bloqueado

**Simples:** Execute novamente o comando de liberação:
```bash
node scripts/grant-free-access.mjs EMAIL_DO_USUARIO
```

Isso vai:
- Reativar a subscription
- Resetar a quota para 50
- Prolongar por mais 1 ano

---

## 📋 Checklist Rápido

### Antes de liberar acesso:
- [ ] Verificar se o email é válido
- [ ] Ter certeza que é um usuário de teste/feedback legítimo
- [ ] Terminal aberto na pasta do projeto

### Após liberar:
- [ ] Conferir se recebeu mensagem de sucesso
- [ ] Se email falhou, copiar link manual
- [ ] Avisar o usuário que o acesso foi liberado

### Antes de bloquear:
- [ ] Ter certeza absoluta (não tem ctrl+z!)
- [ ] Email do usuário está correto
- [ ] Terminal aberto na pasta do projeto

### Após bloquear:
- [ ] Verificar mensagem de confirmação
- [ ] Informar o usuário (se necessário)

---

## 🆘 Resolução de Problemas

### Erro: "Email inválido"
**Causa:** Você não digitou um email ou esqueceu o `@`  
**Solução:** Redigite o comando com email válido

### Erro: "Usuário não encontrado" (no bloqueio)
**Causa:** O email não está cadastrado no sistema  
**Solução:** Verifique se digitou corretamente

### Erro: "RESEND_API_KEY not found"
**Causa:** Variável de ambiente não configurada  
**Solução:** Verifique se `.env.local` tem `RESEND_API_KEY=...`

### Erro: "SUPABASE_SERVICE_ROLE_KEY not found"
**Causa:** Variável de ambiente não configurada  
**Solução:** Verifique se `.env.local` tem a chave do Supabase

### Email não chegou (no grant)
**Causa:** Problema temporário com Resend ou email em spam  
**Solução 1:** Usar o link manual que aparece no terminal  
**Solução 2:** Usuário usar "Esqueci minha senha" no site

---

## 📞 Suporte

Se algo der errado e você não souber resolver:
1. Copie a mensagem de erro completa
2. Verifique se as variáveis de ambiente estão ok
3. Tente executar novamente
4. Se persistir, verifique logs no Supabase Dashboard

---

**Criado em:** Dezembro 2024  
**Versão:** 1.0  
**Última atualização:** Deploy com sistema de recuperação de senha
