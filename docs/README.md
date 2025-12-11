# Índice de Documentação - O Licitador

**Versão:** 1.0  
**Data:** 2025-12-10  
**Total de Módulos:** 23

---

## 📚 Estrutura da Documentação

### Documento Principal
- **`Olicitador_Project_Core_v1.md`** - Visão global, arquitetura, regras, roadmap

### Documentos Modulares

#### Core (Análise e Inteligência)
- **`Core_M1_Modulo_Analise_Gemini.md`** - IA principal (análise semântica)
- **`Core_M2_Modulo_CA_EPI.md`** - Validação de CAs (BLOQUEADO)
- **`Core_M3_Modulo_CATMAT.md`** - Validação de CATMAT
- **`Core_M4_Modulo_Busca_de_Precos.md`** - Cotação de preços (Plano Radical)
- **`Core_M5_Modulo_PNCP.md`** - Referências governamentais

#### Interface (Frontend)
- **`Core_M6-M9_Modulos_Interface.md`** - Páginas de análise, consulta CA/CATMAT, dashboard

#### Autenticação e Controle
- **`Core_M10-M12_Modulos_Autenticacao_Controle.md`** - Supabase Auth, MercadoPago, quotas

#### Suporte e Infraestrutura
- **`Core_M13-M17_Modulos_Suporte_Infraestrutura.md`** - Cache, email, scripts de teste, regras de deploy

#### Páginas Estáticas
- **`Core_M18-M20_Modulos_Paginas_Estaticas.md`** - Landing page, termos, privacidade, SICX

#### Módulos Futuros
- **`Core_M21-M23_Modulos_Futuros.md`** - Histórico, exportação, análise em lote

---

## 🚨 Status Crítico Atual

### Bloqueadores
1. **M2 (CA/EPI):** ❌ Custom Search API desativada no GCP
   - **Ação Necessária:** Usuário ativar API no [Console](https://console.developers.google.com/apis/api/customsearch.googleapis.com/overview?project=766773995616)
   - **Impacto:** M7 (Consulta CA) completamente inoperante

### Módulos Parciais
- **M7:** Bloqueado por M2
- **M12:** Código existe, integração pendente
- **M14:** Templates existem, envio não testado

---

## 📊 Resumo Executivo

| Categoria | Total | Pronto | Parcial | Rascunho | Futuro |
|-----------|-------|--------|---------|----------|--------|
| Core (IA) | 5 | 3 | 2 | 0 | 0 |
| Interface | 4 | 3 | 1 | 0 | 0 |
| Auth/Controle | 3 | 2 | 1 | 0 | 0 |
| Suporte | 5 | 3 | 1 | 1 | 0 |
| Páginas | 3 | 2 | 0 | 1 | 0 |
| Futuros | 3 | 0 | 0 | 0 | 3 |
| **TOTAL** | **23** | **13** | **5** | **2** | **3** |

---

## 🎯 Próximos Passos Imediatos

### Ação do Usuário (CRÍTICO)
1. Ativar Custom Search API no GCP Console
2. Verificar permissões da chave `GOOGLE_API_KEY`

### Ação do Desenvolvedor (Após Desbloqueio)
1. Executar `node scripts/diagnose-ca-search.js`
2. Validar busca de CA 40677
3. Deploy controlado (1 único deploy)
4. Monitorar logs de produção

### Médio Prazo
- Integrar M12 (quotas) em M1 e M4
- Validar M14 (envio de emails)
- Implementar M21 (histórico de análises)

---

## 📖 Como Usar Esta Documentação

### Para Novos Desenvolvedores
1. Leia `Olicitador_Project_Core_v1.md` (visão geral)
2. Leia documentos dos módulos core (M1-M5)
3. Explore módulos de interface (M6-M9)
4. Consulte módulos específicos conforme necessário

### Para Troubleshooting
1. Identifique o módulo com problema
2. Leia seção "Problemas Conhecidos" do documento
3. Consulte "Decisões Técnicas Registradas"
4. Execute scripts de diagnóstico (M16)

### Para Planejamento
1. Consulte `Core_M21-M23_Modulos_Futuros.md`
2. Revise roadmap em `Olicitador_Project_Core_v1.md`
3. Priorize baseado em valor vs complexidade

---

## 🔄 Manutenção da Documentação

### Quando Atualizar
- Após implementação de novo módulo
- Após mudança arquitetural significativa
- Após descoberta de bug crítico
- Após decisão técnica importante

### Como Atualizar
1. Edite o documento modular específico
2. Atualize data e versão
3. Adicione entrada em "Decisões Técnicas Registradas"
4. Atualize `Olicitador_Project_Core_v1.md` se necessário

---

**Esta documentação é a fonte da verdade do projeto O Licitador.**  
**Mantenha-a atualizada e consulte-a sempre.**

---

**Última Atualização:** 2025-12-10  
**Responsável:** Equipe de Desenvolvimento O Licitador  
**Próxima Revisão:** Após ativação da Custom Search API
