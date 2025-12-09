# 📊 Guia do Painel Administrativo

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Estatísticas Rápidas](#estatísticas-rápidas)
3. [Painel Completo Interativo](#painel-completo-interativo)
4. [Recursos do Menu](#recursos-do-menu)
5. [Interpretando os Dados](#interpretando-os-dados)
6. [Resolução de Problemas](#resolução-de-problemas)

---

## 🎯 Visão Geral

O sistema possui **2 ferramentas de visualização** de dados dos usuários:

| Ferramenta | Comando | Tipo | Quando usar |
|------------|---------|------|-------------|
| **Estatísticas Rápidas** | `node scripts/quick-stats.mjs` | Não-interativo | Visão geral rápida |
| **Painel Completo** | `node scripts/admin-dashboard.mjs` | Interativo | Análise detalhada |

---

## ⚡ Estatísticas Rápidas

### Como usar

1. **Abra o terminal** no diretório do projeto:
   ```bash
   cd c:\Users\marco\.gemini\antigravity\playground\olicitador
   ```

2. **Execute o comando**:
   ```bash
   node scripts/quick-stats.mjs
   ```

3. **Resultado instantâneo** (exemplo):
   ```
   ╔════════════════════════════════════════════════════════════════╗
   ║         📊 O LICITADOR - ESTATÍSTICAS RÁPIDAS                  ║
   ╚════════════════════════════════════════════════════════════════╝

   👥 USUÁRIOS:
      Total: 10
      ✓ Ativos: 8
      ✗ Bloqueados: 2

   📊 PLANOS:
      Básico: 6
      Pro: 3
      Premium: 1

   💎 USO TOTAL DE QUOTA:
      Usado: 145 de 550 (26.4%)

   📈 ÚLTIMOS 5 USUÁRIOS CADASTRADOS:
      1. joao.silva@gmail.com - ATIVO
      2. maria.santos@hotmail.com - ATIVO
      3. pedro.costa@yahoo.com - INATIVO
      4. ana.ferreira@gmail.com - ATIVO
      5. carlos.oliveira@outlook.com - ATIVO
   ```

### O que mostra

- ✅ Total de usuários cadastrados
- ✅ Quantidade de ativos vs bloqueados
- ✅ Distribuição por planos (Básico, Pro, Premium)
- ✅ Uso total de quota do sistema
- ✅ Últimos 5 cadastros (mais recentes primeiro)

### Vantagens

- ⚡ **Rápido** - Resultado em 1-2 segundos
- 🎯 **Direto** - Sem necessidade de interação
- 📱 **Prático** - Perfeito para checar status rapidamente

---

## 🎮 Painel Completo Interativo

### Como usar

1. **Abra o terminal** no diretório do projeto:
   ```bash
   cd c:\Users\marco\.gemini\antigravity\playground\olicitador
   ```

2. **Execute o comando**:
   ```bash
   node scripts/admin-dashboard.mjs
   ```

3. **Menu Principal** (exemplo):
   ```
   ╔════════════════════════════════════════════════════════════════╗
   ║         📊 PAINEL ADMINISTRATIVO - O LICITADOR                 ║
   ╚════════════════════════════════════════════════════════════════╝

   Menu Principal:

     1. 👥 Listar TODOS os usuários
     2. 💚 Listar usuários ATIVOS
     3. 🚫 Listar usuários BLOQUEADOS
     4. 🔍 Buscar usuário por email
     5. 📈 Estatísticas gerais
     6. 📊 Ranking de uso
     7. 📄 Exportar relatório CSV
     0. ❌ Sair

   Escolha uma opção:
   ```

4. **Digite o número** da opção desejada e pressione ENTER

5. **Navegação**: Após ver os resultados, pressione ENTER para voltar ao menu

---

## 🛠️ Recursos do Menu

### 1️⃣ Listar TODOS os usuários

**O que faz:** Mostra lista completa com todos os detalhes de cada usuário.

**Exemplo de saída:**
```
📋 LISTA COMPLETA DE USUÁRIOS
Total: 10 usuários

1. joao.silva@gmail.com
   ID: abc123...
   Status: ATIVO
   Plano: BÁSICO
   Quota: ████████████░░░░░░░░ 30/50 (60%)
   Válido até: 08/12/2025 15:30
   Criado em: 26/11/2025 14:22

2. maria.santos@hotmail.com
   ID: def456...
   Status: ATIVO
   Plano: PRO
   Quota: ████░░░░░░░░░░░░░░░░ 15/150 (10%)
   Válido até: 10/12/2025 09:15
   Criado em: 27/11/2025 10:45
```

**Quando usar:** Para ter visão completa do sistema.

---

### 2️⃣ Listar usuários ATIVOS

**O que faz:** Filtra e mostra apenas usuários com subscription ativa.

**Exemplo de saída:**
```
💚 USUÁRIOS ATIVOS
Total: 8 usuários ativos

1. joao.silva@gmail.com BÁSICO
   Uso: ████████████░░░░░░░░ 30/50 (60%)
   Expira: 08/12/2025 15:30

2. maria.santos@hotmail.com PRO
   Uso: ████░░░░░░░░░░░░░░░░ 15/150 (10%)
   Expira: 10/12/2025 09:15
```

**Quando usar:** Para monitorar apenas contas ativas e uso de quota.

---

### 3️⃣ Listar usuários BLOQUEADOS

**O que faz:** Mostra usuários com subscription cancelada.

**Exemplo de saída:**
```
🚫 USUÁRIOS BLOQUEADOS
Total: 2 usuários bloqueados

1. teste@exemplo.com
   ID: xyz789...
   Bloqueado em: 05/12/2025 18:20

2. spam@fake.com
   ID: qwe321...
   Bloqueado em: 03/12/2025 12:00
```

**Quando usar:** Para auditar bloqueios ou identificar usuários para reativação.

---

### 4️⃣ Buscar usuário por email

**O que faz:** Pesquisa um usuário específico e mostra todos os detalhes.

**Fluxo:**
```
📧 Digite o email: joao.silva@gmail.com

═══════════════════════════════════════════════════════════════
           DETALHES DO USUÁRIO
═══════════════════════════════════════════════════════════════

Email: joao.silva@gmail.com
ID: abc123-def456-ghi789
Criado em: 26/11/2025 14:22
Última atualização: 08/12/2025 10:30
Email confirmado: Sim

📊 SUBSCRIPTION:
  Status: ATIVO
  Plano: BÁSICO
  Quota: ████████████░░░░░░░░ 30/50 (60%)
  Período atual termina: 08/12/2025 15:30
  Última atualização: 08/12/2025 10:30

═══════════════════════════════════════════════════════════════
```

**Quando usar:** Para investigar problema de um usuário específico, ou antes de liberar/bloquear acesso.

---

### 5️⃣ Estatísticas gerais

**O que faz:** Dashboard completo com números agregados do sistema.

**Exemplo de saída:**
```
📈 ESTATÍSTICAS GERAIS

👥 Total de usuários: 10
   ├─ Ativos: 8
   ├─ Bloqueados: 2
   └─ Sem subscription: 0

📊 Por Plano:
   ├─ Básico: 6
   ├─ Pro: 3
   └─ Premium: 1

💎 Uso de Quota Total:
   ████████░░░░░░░░░░░░ 145/550 (26.4%)

📈 Média de uso (ativos): 32.5%
```

**Quando usar:** Para entender saúde geral do sistema e planejamento de capacidade.

---

### 6️⃣ Ranking de uso

**O que faz:** Top 10 usuários que mais consomem quota.

**Exemplo de saída:**
```
🏆 RANKING DE USO (Top 10)

🥇 power.user@empresa.com
   ████████████████████ 48/50 (96%)

🥈 heavy.user@gmail.com
   ██████████████░░░░░░ 135/150 (90%)

🥉 active.client@hotmail.com
   ████████████░░░░░░░░ 35/50 (70%)

4. normal.user@yahoo.com
   ████████░░░░░░░░░░░░ 20/50 (40%)
```

**Quando usar:** Para identificar usuários power (possível upgrade) ou detectar uso anormal.

---

### 7️⃣ Exportar relatório CSV

**O que faz:** Gera arquivo Excel/CSV com todos os dados dos usuários.

**Fluxo:**
```
📄 EXPORTANDO RELATÓRIO...

✅ Relatório exportado: users_report_2025-12-08.csv
   Total: 10 usuários
```

**Estrutura do CSV:**
```csv
Email,User ID,Status,Plano,Quota Usada,Quota Limite,% Uso,Criado Em,Expira Em
joao@email.com,abc123,active,basico,30,50,60.0,"26/11/2025 14:22","08/12/2025 15:30"
maria@email.com,def456,active,pro,15,150,10.0,"27/11/2025 10:45","10/12/2025 09:15"
```

**Quando usar:** 
- Para análise em Excel/Google Sheets
- Para backup de dados administrativos
- Para gerar relatórios para gestão

---

## 📊 Interpretando os Dados

### Barras de Progresso (Quota)

```
████████████░░░░░░░░ 30/50 (60%)
```

- **Blocos cheios (█):** Quota usada
- **Blocos vazios (░):** Quota disponível
- **Números:** Usado / Limite Total
- **Porcentagem:** % de consumo

**Cores:**
- 🟢 Verde (0-50%): Uso normal
- 🟡 Amarelo (51-80%): Atenção
- 🔴 Vermelho (81-100%): Crítico

### Badges de Status

| Badge | Significado | Ação necessária |
|-------|-------------|-----------------|
| `ATIVO` (verde) | Subscription ativa | Nenhuma |
| `BLOQ` (vermelho) | Subscription cancelada | Reativar se necessário |
| `EXPIR` (amarelo) | Período expirado | Renovar |
| `INDF` (cinza) | Status indefinido | Investigar |

### Badges de Plano

| Badge | Quota | Valor |
|-------|-------|-------|
| `BÁSICO` (azul) | 50 análises/mês | Gratuito |
| `PRO` (roxo) | 150 análises/mês | Pago |
| `PREMIUM` (amarelo) | 1000 análises/mês | Pago |

---

## 🆘 Resolução de Problemas

### Erro: "0 usuários" (mas existem usuários no Supabase)

**Causa:** Chave `SUPABASE_SERVICE_ROLE_KEY` incorreta ou ausente.

**Solução:**
1. Acesse: Supabase Dashboard > Settings > API
2. Vá na aba "Legacy anon, service_role API keys"
3. Copie a chave `service_role` (começa com `eyJ...`)
4. Atualize no `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJ...sua.chave.completa...
   ```
5. Execute novamente

---

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas.

**Solução:**
```bash
npm install
```

---

### Painel não atualiza após mudanças

**Causa:** O painel lê dados em tempo real do banco.

**Solução:** Se fez mudanças diretas no banco (via painel web do Supabase), simplesmente execute o script novamente. Ele sempre busca dados atualizados.

---

### Relatório CSV com caracteres estranhos

**Causa:** Encoding UTF-8 não reconhecido pelo Excel.

**Solução:** 
1. Abra o CSV no Notepad
2. Salve como: "UTF-8 with BOM"
3. Ou use Google Sheets (reconhece UTF-8 automaticamente)

---

### Erro: "Permission denied"

**Causa:** Chave sem permissões administrativas.

**Solução:** Certifique-se de usar a chave `service_role` (secret), não a `anon` (public).

---

## 💡 Dicas de Uso

### Monitoramento Diário
```bash
# Comando rápido para check matinal
node scripts/quick-stats.mjs
```

### Investigação Profunda
```bash
# Use o painel completo para análises
node scripts/admin-dashboard.mjs
# Opção 5: Ver estatísticas
# Opção 6: Ver top usuários
```

### Backup Semanal
```bash
# Toda segunda, gere um CSV
node scripts/admin-dashboard.mjs
# Opção 7: Exportar relatório
# Salve o arquivo em pasta segura
```

### Troubleshooting de Usuário
```bash
# Quando usuário reportar problema
node scripts/admin-dashboard.mjs
# Opção 4: Buscar por email
# Digite o email do usuário
# Verifique quota, status, validade
```

---

## 🔐 Segurança

⚠️ **ATENÇÃO:**

1. **Nunca compartilhe** a chave `service_role` - ela tem acesso administrativo total
2. **Não versione** o `.env.local` no Git
3. **Limite o acesso** aos scripts - só admins devem executá-los
4. **Relatórios CSV** contêm dados sensíveis - proteja-os adequadamente

---

## 📋 Checklist de Validação

Antes de usar em produção, verifique:

- [ ] Chave `SUPABASE_SERVICE_ROLE_KEY` configurada corretamente no `.env.local`
- [ ] Comando `quick-stats.mjs` mostra número correto de usuários
- [ ] Painel interativo abre sem erros
- [ ] Busca por email funciona
- [ ] Exportação CSV gera arquivo válido
- [ ] Dados do painel batem com painel web do Supabase

---

## 🎓 Comandos de Referência Rápida

```bash
# Estatísticas instantâneas
node scripts/quick-stats.mjs

# Dashboard completo
node scripts/admin-dashboard.mjs

# Liberar acesso gratuito
node scripts/grant-free-access.mjs email@usuario.com

# Bloquear usuário
node scripts/revoke-access.mjs email@usuario.com
```

---

**Criado em:** Dezembro 2024  
**Versão:** 2.0  
**Última atualização:** Sistema de Painel Administrativo Completo
