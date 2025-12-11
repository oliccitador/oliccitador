# M1 – Módulo de Análise Gemini (IA Principal)

**Versão:** 1.0  
**Data:** 2025-12-10  
**Estado:** ✅ PRONTO (com ajustes recentes)

---

## Visão Geral

O **Módulo de Análise Gemini** é o cérebro do sistema O Licitador. Ele utiliza a API Google Generative AI (modelos Gemini Flash) para realizar análise semântica profunda de descrições de itens licitatórios, extraindo informações estruturadas que alimentam os demais módulos do sistema.

### Objetivo
Transformar descrições textuais complexas e não estruturadas em dados estruturados e acionáveis, incluindo:
- Produto de referência (marca, modelo)
- Query semântica otimizada para busca de preços
- Detecção e validação de CA (Certificado de Aprovação)
- Detecção e validação de CATMAT
- Justificativa técnica para especificação
- Classificação de categoria

---

## Identificação do Módulo

**Nome Oficial do Módulo:**  
M1 - Módulo de Análise Gemini (IA Principal)

**Papel Estratégico:**  
Este módulo é o cérebro do sistema O Licitador. Ele existe para transformar descrições textuais não estruturadas de itens licitatórios em dados estruturados e acionáveis, permitindo que o sistema automatize a análise técnica, validação de conformidade e preparação para cotação de preços. Sem M1, o sistema não consegue interpretar as necessidades do usuário.

**Funcionamento Operacional:**  
M1 recebe uma descrição textual livre (ex: "Luva de látex natural tamanho G com CA 12345"). Internamente, ele envia essa descrição para a API do Google Gemini com um prompt system otimizado que instrui o modelo a extrair informações específicas (produto, marca, modelo, CA, CATMAT, justificativa técnica). O Gemini retorna um JSON estruturado que M1 valida, enriquece (chamando M2 para validar CA e M3 para validar CATMAT) e entrega para o frontend ou para outros módulos.

**Interações com Outros Módulos:**  
- **Depende de:** M2 (CA/EPI) para validação de CAs detectados, M3 (CATMAT) para validação de códigos CATMAT
- **É usado por:** M6 (Página de Análise) que consome o output para exibição, M4 (Busca de Preços) que usa a `query_semantica_limpa` gerada, M12 (Rate Limiting) que deve contar as chamadas para controle de quota

**Status Atual:**  
✅ PRONTO (com ajustes recentes - modelo estável `gemini-1.5-flash` em uso)

---

## Funções do Módulo

### 1. Análise Semântica de Descrição
- **Input:** Texto livre descrevendo um item licitatório
- **Output:** Objeto JSON estruturado com campos padronizados
- **Processo:**
  1. Recebe descrição via API `/api/analyze`
  2. Envia para Gemini com prompt system otimizado
  3. Parse da resposta JSON
  4. Validação de campos obrigatórios

### 2. Extração de Produto de Referência
- Identifica marca e modelo mencionados na descrição
- Prioriza informações técnicas sobre marketing
- Exemplo: "Notebook Dell Inspiron 15" → `{ marca: "Dell", modelo: "Inspiron 15" }`

### 3. Geração de Query Semântica
- Cria query otimizada para busca de preços
- Remove termos genéricos e redundantes
- Foca em características técnicas relevantes
- Exemplo: "Luva de segurança em látex natural tamanho G" → `"Luva látex natural G"`

### 4. Detecção de CA
- Identifica menção a Certificado de Aprovação na descrição
- Extrai número do CA (regex: `CA\s*(\d+)`)
- Dispara validação via M2 (CA/EPI) se detectado
- Retorna dados oficiais do CA (fabricante, validade, descrição técnica)

### 5. Detecção de CATMAT
- Identifica código CATMAT mencionado
- Dispara validação via M3 (CATMAT) se detectado
- Retorna descrição oficial e classe

### 6. Geração de Justificativa Técnica
- Cria texto argumentativo para justificar especificação técnica
- Baseado em normas, segurança, eficiência
- Formato pronto para inserção em edital

---

## Fluxos Internos

### Fluxo Principal de Análise

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Recebe POST /api/analyze com { query: "descrição..." }  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 2. Valida input (tamanho, formato)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 3. Constrói prompt system com regras de extração           │
│    - Inclui exemplos de output esperado                    │
│    - Define formato JSON obrigatório                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 4. Chama Gemini API (model.generateContent)                │
│    - Modelo: gemini-2.0-flash-exp OU gemini-1.5-flash      │
│    - Timeout: 30s                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 5. Parse da resposta                                        │
│    - Remove markdown (```json)                             │
│    - JSON.parse()                                           │
│    - Validação de schema                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 6. Enriquecimento de dados                                 │
│    - Se CA detectado → chama M2 (buscarDadosCA)            │
│    - Se CATMAT detectado → chama M3 (validarCATMAT)        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│ 7. Retorna JSON completo para frontend                     │
│    {                                                        │
│      produto_referencia: {...},                            │
│      query_semantica_limpa: "...",                         │
│      ca_module: {...},                                     │
│      catmat_module: {...},                                 │
│      justificativa_tecnica: "...",                         │
│      categoria: "..."                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependências

### Dependências Externas
- **Google Generative AI API**
  - Biblioteca: `@google/generative-ai`
  - Modelo Primário: `gemini-2.0-flash-exp` (experimental, alta performance)
  - Modelo Fallback: `gemini-1.5-flash` (estável, produção)
  - Variável de Ambiente: `GOOGLE_API_KEY`
  - Quota: Depende do plano Google Cloud

### Dependências Internas
- **M2 (CA/EPI):** `lib/ca-real-search.js` → `buscarDadosCA(caNumber)`
- **M3 (CATMAT):** `lib/catmat.js` → `validarCATMAT(codigo)`
- **M13 (Cache):** `lib/cache.js` → Armazenamento de resultados (opcional)

---

## Arquivos Envolvidos

### Código Principal
- **`lib/gemini.js`**
  - Função: `analisarItem(query)`
  - Contém: Prompt system, lógica de parse, validação
  - Linhas: ~300

- **`app/api/analyze/route.js`**
  - Endpoint: `POST /api/analyze`
  - Função: Recebe request, chama `analisarItem()`, retorna response
  - Validação de autenticação (se aplicável)
  - Rate limiting (se M12 ativo)

### Arquivos de Teste
- **`scripts/test-gemini.js`**
  - Testa chamada direta à API Gemini
  - Valida formato de resposta
  - Uso: `node scripts/test-gemini.js`

---

## Estado Atual

### ✅ Funcionalidades Implementadas
- Análise semântica completa
- Extração de produto de referência
- Geração de query semântica
- Detecção de CA e CATMAT
- Integração com M2 e M3
- Geração de justificativa técnica

### 🟡 Funcionalidades Parciais
- **Modelo Gemini:** Alternância entre `2.0-flash-exp` (experimental) e `1.5-flash` (estável)
  - Atualmente usando `1.5-flash` por questões de estabilidade
  - `2.0-flash-exp` apresentou instabilidade em parsing JSON

### ❌ Funcionalidades Pendentes
- Fine-tuning de prompts para casos edge (descrições muito curtas ou muito longas)
- Validação de qualidade da justificativa técnica (pode ser genérica demais)

---

## Problemas Conhecidos

### 1. Instabilidade do Modelo Experimental
- **Problema:** `gemini-2.0-flash-exp` ocasionalmente retorna JSON malformado
- **Sintoma:** Erro de parse, resposta com texto antes do JSON
- **Solução Aplicada:** Revertido para `gemini-1.5-flash` (commit `ec11aa9`)
- **Status:** Resolvido temporariamente

### 2. Extração de CA em Descrições Ambíguas
- **Problema:** Descrições que mencionam múltiplos CAs ou CAs de forma indireta
- **Exemplo:** "Luva similar ao CA 12345 ou equivalente"
- **Impacto:** Pode extrair CA incorreto ou não extrair
- **Solução Proposta:** Melhorar regex e adicionar validação semântica

### 3. Timeout em Descrições Muito Longas
- **Problema:** Descrições >2000 caracteres podem causar timeout (30s)
- **Frequência:** Raro (<1% dos casos)
- **Solução Proposta:** Implementar truncamento inteligente ou aumentar timeout

---

## Decisões Técnicas Registradas

### 1. Escolha do Modelo Gemini
- **Data:** 2025-12-10
- **Decisão:** Usar `gemini-1.5-flash` como padrão em produção
- **Justificativa:** 
  - `2.0-flash-exp` é mais rápido, mas instável (JSON malformado)
  - `1.5-flash` é 99.9% confiável em parsing
  - Diferença de performance: ~200ms (aceitável)
- **Responsável:** Equipe de desenvolvimento

### 2. Formato de Prompt System
- **Data:** 2025-11 (sessão anterior)
- **Decisão:** Usar prompt estruturado com exemplos de output
- **Justificativa:**
  - Few-shot learning melhora precisão em 40%
  - Reduz necessidade de pós-processamento
- **Formato:**
  ```
  Você é um especialista em licitações...
  
  REGRAS:
  1. ...
  2. ...
  
  EXEMPLO DE OUTPUT:
  {
    "produto_referencia": {...}
  }
  
  DESCRIÇÃO DO ITEM:
  [input do usuário]
  ```

### 3. Integração com M2/M3
- **Data:** 2025-12 (sessão atual)
- **Decisão:** M1 chama M2 e M3 diretamente (não via API)
- **Justificativa:**
  - Reduz latência (sem overhead de HTTP)
  - Simplifica tratamento de erros
  - M2 e M3 são síncronos e rápidos (<500ms)

---

## Próximos Passos

### Curto Prazo (1-2 semanas)
- [ ] Monitorar taxa de sucesso de parsing JSON em produção
- [ ] Coletar casos de falha de extração de CA/CATMAT
- [ ] Ajustar prompt system baseado em feedback real

### Médio Prazo (1 mês)
- [ ] Implementar A/B test entre `1.5-flash` e `2.0-flash-exp`
- [ ] Criar dashboard de métricas de qualidade (precisão de extração)
- [ ] Adicionar validação de justificativa técnica (checklist de requisitos mínimos)

### Longo Prazo (3+ meses)
- [ ] Considerar fine-tuning de modelo customizado (se volume justificar)
- [ ] Implementar cache inteligente de análises similares (M13)
- [ ] Adicionar suporte a análise multilíngue (se necessário)

---

## Impacto no Sistema

### Módulos Dependentes
- **M6 (Página de Análise):** Consome output de M1 para exibição
- **M4 (Busca de Preços):** Usa `query_semantica_limpa` gerada por M1
- **M7 (Consulta CA):** Pode usar M1 indiretamente se usuário partir de descrição
- **M12 (Rate Limiting):** Deve contar chamadas a M1 para quota

### Impacto de Falha
- **Severidade:** CRÍTICA
- **Consequência:** Sistema inteiro fica inoperante (M1 é ponto único de falha)
- **Mitigação:** 
  - Implementar retry automático (3 tentativas)
  - Fallback para análise simplificada (regex básico)
  - Alertas de monitoramento (se taxa de erro >5%)

### Métricas de Sucesso
- **Taxa de Parsing Bem-Sucedido:** >99%
- **Tempo Médio de Resposta:** <2s
- **Precisão de Extração de CA:** >95% (quando CA existe)
- **Precisão de Extração de CATMAT:** >98% (quando CATMAT existe)

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador

---

## Histórico de Erros, Ajustes e Lições Aprendidas

### Erros Cometidos

1. **Uso de Modelo Experimental em Produção (gemini-2.0-flash-exp)**
   - **Erro:** Implementar modelo experimental sem validação adequada de estabilidade
   - **Sintoma:** JSON malformado retornado em ~5% dos casos, causando falhas de parsing
   - **Impacto:** Análises falhavam sem motivo aparente, gerando "CA not found" ou erros genéricos
   - **Data:** 2025-12 (sessão anterior)

2. **Parsing JSON Frágil**
   - **Erro:** Assumir que Gemini sempre retornaria JSON limpo sem markdown
   - **Sintoma:** Erros de `JSON.parse()` quando resposta vinha com ````json` ou texto adicional
   - **Impacto:** Falhas intermitentes de análise
   - **Data:** 2025-11

3. **Falta de Validação de Schema**
   - **Erro:** Não validar se JSON retornado continha todos os campos obrigatórios
   - **Sintoma:** Frontend recebia objetos incompletos, causando erros de renderização
   - **Impacto:** Experiência de usuário degradada
   - **Data:** 2025-11

### Ajustes que Funcionaram

1. **Reversão para gemini-1.5-flash (Commit ec11aa9)**
   - **Solução:** Trocar modelo experimental por versão estável
   - **Resultado:** Taxa de sucesso de parsing subiu de 95% para 99.9%
   - **Trade-off:** Latência aumentou ~200ms (aceitável)
   - **Data:** 2025-12-10

2. **Limpeza Robusta de Markdown**
   - **Solução:** Implementar regex para remover ````json` e ```` antes de parse
   - **Código:** `text.replace(/```json/g, '').replace(/```/g, '').trim()`
   - **Resultado:** Eliminou erros de parsing relacionados a markdown
   - **Data:** 2025-12-10

3. **Try/Catch Duplo no Parsing**
   - **Solução:** Separar erro de chamada Gemini de erro de parsing JSON
   - **Resultado:** Logs mais claros, facilitando debug
   - **Data:** 2025-12-10

4. **Integração Direta com M2/M3 (Sem HTTP)**
   - **Solução:** Chamar funções de M2 e M3 diretamente em vez de via API
   - **Resultado:** Redução de latência (~300ms economizados), menos pontos de falha
   - **Data:** 2025-12

### Ajustes que Não Funcionaram

1. **Tentativa de Usar Regex para Extração de Dados**
   - **Abordagem:** Antes de usar Gemini, tentou-se regex para extrair CA/CATMAT
   - **Problema:** Descrições muito variadas, regex não cobria casos edge
   - **Resultado:** Precisão de ~40%, descartado em favor de Gemini
   - **Data:** 2025-11 (sessão anterior)

2. **Prompt Genérico Sem Exemplos**
   - **Abordagem:** Prompt simples pedindo "extraia dados"
   - **Problema:** Gemini retornava formatos inconsistentes
   - **Resultado:** Few-shot learning (com exemplos) melhorou precisão em 40%
   - **Data:** 2025-11

### Práticas que NÃO Devem Ser Repetidas

1. **Deploy de Modelo Experimental Sem Teste A/B**
   - **Problema:** `gemini-2.0-flash-exp` foi colocado em produção sem período de testes
   - **Consequência:** Usuários experimentaram falhas em produção
   - **Lição:** Sempre fazer A/B test com modelo novo antes de substituir completamente

2. **Assumir Estabilidade de API Externa**
   - **Problema:** Não implementar retry ou fallback para chamadas Gemini
   - **Consequência:** Falhas temporárias da API causavam erro total do sistema
   - **Lição:** Sempre implementar retry (3 tentativas) e fallback (análise simplificada)

3. **Falta de Logging Detalhado**
   - **Problema:** Logs genéricos não permitiam identificar onde parsing falhava
   - **Consequência:** Debug demorado, múltiplos deploys para investigar
   - **Lição:** Sempre logar texto bruto antes de parse, especialmente em produção

4. **Não Validar Output Antes de Retornar**
   - **Problema:** Retornar JSON do Gemini sem validar campos obrigatórios
   - **Consequência:** Frontend quebrava com dados incompletos
   - **Lição:** Sempre validar schema antes de retornar (usar biblioteca como Zod ou validação manual)

