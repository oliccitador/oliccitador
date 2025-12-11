# Documentação de Integração PNCP / Compras.gov.br

## Estratégia de Busca de Preços de Referência (Validada em Dez/2025)

Após extensos testes e diagnósticos, identificamos que a API pública de Compras possui peculiaridades críticas. Esta documentação descreve a estratégia "Híbrida Otimizada" implementada em `lib/pncp-client.js`.

### 1. Descobertas Críticas

*   **API de Materiais (`/modulo-material/4_consultarItemMaterial`)**: É instável para buscas textuais genéricas. Retorna frequentemente 0 resultados ou Erro 400 se não configurada perfeitamente.
*   **API de Preços (`/modulo-pesquisa-preco/1_consultarMaterial`)**: É a **JÓIA DA COROA**. Retorna dados detalhados (Marca, Modelo, Fornecedor, Preço Unitário), mas exige obrigatoriamente um **Código CATMAT**. Não aceita busca por texto.
*   **Parâmetros Obrigatórios**: Todos os endpoints exigem `tamanhoPagina >= 10`. Valores menores causam `Erro 400 Bad Request` com mensagem criptica.

### 2. A Solução: PncpClient

Implementamos um cliente inteligente que atua em camadas:

#### Camada 1: Resolução de CATMAT (Cache Inteligente)
Como a busca de CATMAT é o gargalo, mantemos um dicionário interno (`CATMAT_CACHE`) com os códigos dos itens mais comuns (Notebook, Cadeira, Mesa, etc). Isso garante performance instantânea e 100% de sucesso para os termos mais usados.

#### Camada 2: Busca de Preço (Alta Fidelidade)
Uma vez obtido o código (via cache ou API), consultamos o módulo de preços.
*   **Retorno:** Dados normalizados com Marca, Preço, Fornecedor e Data.
*   **Qualidade:** Alta. Permite comparação direta de mercado.

#### Camada 3: Fallback PNCP (Baixa Fidelidade)
Se não encontrarmos código CATMAT, recorremos à API genérica do PNCP (`/atas`).
*   **Retorno:** Dados macro da contratação.
*   **Uso:** Apenas indicativo. Não serve para cotação precisa pois falta detalhe do item.

### 3. Como Manter

Para adicionar suporte a novos itens com qualidade máxima:
1. Descubra o código CATMAT oficial do item (via portal Comprasnet web ou pesquisas manuais).
2. Adicione ao `CATMAT_CACHE` em `lib/pncp-client.js`.

### Exemplo de Uso

```javascript
import { pncpClient } from './lib/pncp-client.js';

const resultados = await pncpClient.buscarPrecos("NOTEBOOK");
// Retorna array de objetos padronizados:
// {
//   descricao: "Notebook i7...",
//   marca: "DELL",
//   preco: 4500.00,
//   ...
// }
```
