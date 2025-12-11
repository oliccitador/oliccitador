# M24 – Módulo de Cotação Híbrida Inteligente (Hybrid Quotation Engine)

**Versão:** 1.0  
**Data:** 2025-12-11  
**Estado:** ✅ IMPLEMENTADO (Aguardando Deploy)  
**Dependência:** Exclusivo para fluxo de Análise (M1)

---

## CHANGELOG

### 2025-12-11 - v1.0 - Criação do Módulo
- ✅ **Scanner de Texto:** Capacidade de detectar CA e Padrões dentro de descrições sujas.
- ✅ **Lógica Híbrida:** Alterna dinamicamente entre busca "CA-Exclusiva" e "Texto Livre".
- ✅ **Fallback em Camadas:** Prioriza IA (Gemini) > Limpeza Manual (NLP) para garantir que nunca retorne erro por falta de query.
- ✅ **Isolamento:** Desacoplado do M4 (que deve permanecer estrito/puro).

---

## Visão Geral

O **Módulo M24** é o motor de cotação "Todo-Terreno" do sistema O Licitador. Diferente do M4 (que exige dados estruturados e limpos), o M24 foi desenhado para lidar com a imprevisibilidade do input de texto livre vindo do Módulo de Análise (M1). Ele atua como uma camada de inteligência final que "salva" a cotação mesmo quando a IA falha ou quando o usuário insere dados misturados.

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M24 - Módulo de Cotação Híbrida Inteligente

**Papel Estratégico:**  
Resolver o problema de "Cotação de Descrição Literal". Enquanto M2 e M3 lidam com códigos perfeitos, o M1 lida com o caos dos editais. O M24 é o braço executor do M1, capaz de minerar um preço válido a partir de descrições burocráticas, incompletas ou misturadas com códigos.

**Funcionamento Operacional:**  
O M24 recebe o payload da Análise e executa um pipeline de decisão em 3 fases:
1.  **Scanner:** Procura por "Pérolas" no texto (CAs ocultos).
2.  **Decisor de Estratégia:**
    *   Achou CA? -> Ativa Modo **CA-HYBRID** (Busca CA + EPI).
    *   Tem Query da IA? -> Ativa Modo **SEMANTIC-GEMINI** (Prioridade).
    *   Só tem Lixo? -> Ativa Modo **NLP-CLEANER** (Limpeza manual conservadora).
3.  **Executor:** Busca no Google Shopping e PNCP em paralelo.

**Interações com Outros Módulos:**  
- **Exclusivo de:** M1 (Análise) e Página `/analise`.
- **Não utilizado por:** M2 (Consulta CA) e M3 (Consulta CATMAT), que continuam usando M4.

**Status Atual:**  
✅ IMPLEMENTADO (Aguardando validação em produção).

---

## Funções do Módulo

### 1. Re-Scanner Inteligente
Mesmo que o M1 não tenha detectado um CA explicitamente, o M24 faz uma segunda varredura no texto da query final usando Regex robusto para tentar "salvar" a busca redirecionando para a estratégia de CA.
*   *Exemplo:* Input "Luva raspa ca 12345" (M1 não viu) -> M24 vê -> Busca "CA 12345 EPI".

### 2. Estratégia CA-Híbrida (Diferente do M4)
Enquanto o M4 retorna vazio se não achar o CA exato, o M24 (por lidar com incerteza) pode ser mais permissivo.
*   **Prioridade:** Busca "CA {num} EPI".
*   **Fallback:** Se não achar, permite buscar pelo nome do produto (ao contrário do M4 v3 que é estrito).

### 3. Limpeza NLP Conservadora (Fallback de Último Recurso)
Se a IA do Gemini (M1) falhar e não entregar uma `query_semantica`, o M24 entra com um algoritmo manual (`cleanTextNLP`):
*   **Remove:** Termos burocráticos pesados ("Aquisição de", "Objeto do pregão", "Edital", "Licitação").
*   **Mantém:** Preposições ("de", "com", "para") e termos conectivos, preservando a semântica de produtos compostos.
*   **Garante:** Que a busca nunca seja feita com lixo jurídico (o que geraria zero resultados).

---

## Estratégias de Decisão (Pipeline)

### Cenário A: CA Detectado no Texto
*   **Condição:** Regex encontra `CA \d+`.
*   **Ação:** Ignora o texto restante e foca na busca pelo certificado.
*   **Query:** `"CA {numero} EPI"`

### Cenário B: Sem CA, com IA (Padrão)
*   **Condição:** M1 enviou `query_semantica` válida (> 3 chars).
*   **Ação:** Confia cegamente na IA.
*   **Query:** `query_semantica`

### Cenário C: Sem CA, Sem IA (Falha M1)
*   **Condição:** Input cru, sem dados da IA.
*   **Ação:** Aciona limpeza manual.
*   **Query:** `cleanTextNLP(descrição_original)`

---

## Arquivos Principais

### Código
- **`lib/m24-quotation.js`** (Core)
  - `buscarMelhoresPrecosM24()`: Função principal exportada.
  - `decideStrategy()`: Lógica de escolha.
  - `cleanTextNLP()`: Lógica de limpeza manual.

- **`app/api/prices/route.js`** (Router)
  - Atualizado para direcionar chamadas com `use_m24: true` para este módulo.

### Testes
- **`scripts/test-m24-logic.js`**
  - Script de validação de cenários de decisão (sem consumo de API).

---

## Histórico de Aprendizado (Motivação do Módulo)

### Por que criar o M24?
O M4 (Motor de Cotação Original) evoluiu para ser **extremamente rigoroso** (Exigindo CA no título, rejeitando parciais), o que é ótimo para quem busca por código (Modules M2/M3).
Porém, para a **Análise de Texto Livre (M1)**, esse rigor causava "falsos negativos" (retornava vazio quando havia produtos similares).
Separar o M24 permite que o M1 tenha uma "Rede de Segurança" mais flexível e resiliente a erros de input, sem comprometer a exatidão métrica do M4 para os outros módulos.

---

**Responsável:** Módulo Automático  
**Última Atualização:** 2025-12-11
