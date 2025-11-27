# Configuração: Google Custom Search API

## Passo 1: Criar API Key do Google

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. No menu, vá em **APIs & Services** > **Library**
4. Procure por "Custom Search API"
5. Clique em **Enable**
6. Vá em **APIs & Services** > **Credentials**
7. Clique em **Create Credentials** > **API Key**
8. Copie a API Key gerada

## Passo 2: Criar Search Engine (Programmable Search Engine)

1. Acesse https://programmablesearchengine.google.com/
2. Clique em **Get Started** ou **Add**
3. Preencha:
   - **Search engine name**: "Olicitador Product Search"
   - **What to search**: Selecione "Search the entire web"
   - **Search settings**: Deixe em "Image search" OFF e "SafeSearch" ON
4. Clique em **Create**
5. Na tela de confirmação, clique em **Control Panel**
6. Copie o **Search engine ID** (cx)

## Passo 3: Configurar Variáveis de Ambiente

### Desenvolvimento Local (`.env.local`)

Adicione as seguintes linhas no arquivo `.env.local`:

```env
GOOGLE_API_KEY=sua_api_key_aqui
GOOGLE_SEARCH_ENGINE_ID=seu_search_engine_id_aqui
```

### Produção (Netlify)

```bash
netlify env:set GOOGLE_API_KEY "sua_api_key_aqui"
netlify env:set GOOGLE_SEARCH_ENGINE_ID "seu_search_engine_id_aqui"
```

## Passo 4: Testar Localmente

```bash
node scripts/debug-market-search.mjs "Cadeira Ergonômica"
```

**Resultado Esperado:**
```
[GOOGLE-SEARCH] Searching web for: Cadeira Ergonômica
[GOOGLE-SEARCH] Found 10 web results
[GEMINI-EXTRACT] Extracted 5 products with prices
--- MÓDULO 2: Retornando 3 candidatos. ---

[1] Cadeira Home Office - R$ 289
    Source: Magazine Luiza
[2] Cadeira Gamer Pro - R$ 350
    Source: Kabum
[3] Cadeira Executiva - R$ 420
    Source: Mercado Livre
```

## Limitações e Custos

### Google Custom Search API

**Plano Gratuito:**
- 100 consultas/dia
- 3.000 consultas/mês
- **GRÁTIS**

**Plano Pago:**
- Após 100/dia: $5 por 1000 consultas adicionais
- Máximo: 10.000 consultas/dia

### Estimativa de Uso

| Cenário | Consultas/Mês | Custo |
|---------|---------------|-------|
| 100 análises | 100 | **GRÁTIS** |
| 1.000 análises | 1.000 | **GRÁTIS** |
| 3.000 análises | 3.000 | **GRÁTIS** |
| 5.000 análises | 5.000 | $10 |

## Fallback Automático

Se o Google  Custom Search falhar ou não estiver configurado:
- O sistema automaticamente usa **Mercado Livre** via ScraperAPI
- Zero downtime garantido
- Nenhuma mensagem de erro para o usuário

## Troubleshooting

### Erro: "API key not configured"
- Verifique se `GOOGLE_API_KEY` está no `.env.local`
- Execute `echo $env:GOOGLE_API_KEY` (PowerShell) para confirmar

### Erro: "Search Engine ID not configured"
- Verifique se `GOOGLE_SEARCH_ENGINE_ID` está no `.env.local`
- O ID deve ter formato similar a: `012345678901234567890:abcdefgh`

### Erro: "API has not been used in project"
- Acesse o Google Cloud Console
- Certifique-se de que a Custom Search API está **habilitada**

### Nenhum produto encontrado
- Gemini está tentando extrair preços dos snippets
- Se falhar, o sistema usa Mercado Livre automaticamente
- Normal em algumas consultas genéricas
