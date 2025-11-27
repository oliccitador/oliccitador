# 🎯 O Licitador

**O Cérebro Lógico das Compras Públicas**

Sistema inteligente de análise de editais e precificação para licitações públicas, baseado nas **4 Regras de Ouro** e na Lei nº 14.133/21.

## 🚀 Funcionalidades

### As 4 Regras de Ouro

1. **📄 Regra do Edital Gêmeo**
   - Extração automática de snippet para busca no PNCP
   - Identifica as primeiras 15-25 palavras-chave da descrição técnica

2. **🔍 Detetive de Códigos**
   - Detecção de códigos CA (Certificado de Aprovação)
   - Identificação de códigos CATMAT/BR
   - Extração inteligente de identificadores técnicos

3. **🛒 Busca de Mercado**
   - Geração de query semântica otimizada
   - Integração com múltiplos marketplaces
   - Ranking de Top 3 candidatos validados
   - Filtro anti-acessórios (elimina ruído de busca)
   - Exibição de preços, marcas e links diretos

4. **⚖️ Justificativa Técnica**
   - Geração automática de texto jurídico-técnico
   - Conformidade com Lei 14.133/21
   - Interpretação de limites numéricos ambíguos
   - Defesa contra contestações

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 + React 18
- **Styling**: TailwindCSS
- **IA**: Google Gemini 2.5 Flash
- **Icons**: Lucide React
- **Deploy**: Netlify

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/olicitador.git

# Entre no diretório
cd olicitador

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua GOOGLE_API_KEY
```

## 🔑 Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
GOOGLE_API_KEY=sua-chave-do-google-gemini
```

Para obter sua API Key do Google Gemini:
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API Key
3. Cole no arquivo `.env.local`

## 💻 Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

## 🏗️ Build

```bash
# Gerar build de produção
npm run build

# Iniciar servidor de produção
npm start
```

## 📖 Como Usar

1. **Cole a descrição técnica** do item do edital no campo de texto
2. **Clique em "Analisar Item"** e aguarde o processamento
3. **Visualize os resultados** organizados pelas 4 Regras de Ouro:
   - Snippet para busca no PNCP
   - Códigos detectados (CA, CATMAT)
   - Top 3 produtos com preços validados
   - Justificativa técnica completa
4. **Use "Fazer Nova Busca"** para limpar e iniciar nova análise

## 🎨 Interface

- Design moderno e responsivo
- Feedback visual de loading
- Cards coloridos por ranking (🥇 Ouro, 🥈 Prata, 🥉 Bronze)
- Links diretos aos produtos
- Sistema de reset inteligente

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para modernizar as compras públicas no Brasil**
