import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchGoogleWeb } from './serpapi.js';
import * as cheerio from 'cheerio';

/**
 * CA Real Search Service
 * ESTRATÉGIA:
 * 1. Tenta scraping direto em consultaca.com (fonte oficial)
 * 2. Se falhar, busca ampla na web (anúncios, PDFs, manuais)
 * 3. Usa IA como último recurso para interpretar snippets
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// MOCK DATA para fallback imediato
const MOCK_DB = {
    '40377': {
        numero_ca: '40377',
        fabricante: 'ESTIVAL CALCADOS DE SEGURANCA LTDA',
        nome_comercial: 'BOTINA DE SEGURANÇA NOBUCK',
        descricao_tecnica: 'Calçado ocupacional de uso profissional, tipo botina, fechamento em cadarço, confeccionado em couro nobuck, palmilha de montagem em material sintético montada pelo sistema strobel, biqueira de conformação, solado de poliuretano bidensidade antiderrapante injetado diretamente no cabedal, sistema de absorção de energia na região do salto, resistente ao óleo combustível.',
        validade: '21/07/2027',
        link_fonte: 'https://consultaca.com/40377'
    },
    '20565': {
        numero_ca: '20565',
        fabricante: '3M DO BRASIL LTDA',
        nome_comercial: 'RESPIRADOR PFF2 COM VÁLVULA',
        descricao_tecnica: 'Respirador purificador de ar tipo peça semifacial filtrante para partículas, classe PFF2 (S), com válvula de exalação. Formato dobrável.',
        validade: 'VIGENTE',
        link_fonte: 'https://consultaca.com/20565'
    }
};

export async function buscarDadosCA(caNumber) {
    const cleanCA = caNumber.replace(/\D/g, '');

    // ESTRATÉGIA 1: Scraping Direto no ConsultaCA.com (Fonte Oficial)
    console.log(`[CA-SEARCH] Tentativa 1: Scraping direto em consultaca.com...`);
    const scrapedData = await scrapeConsultaCA(cleanCA);

    if (scrapedData) {
        console.log(`[CA-SEARCH] ✅ Dados obtidos via scraping direto!`);
        return scrapedData;
    }

    // ESTRATÉGIA 2: SerpApi Organic Search (Busca Ampla - anúncios, PDFs)
    try {
        console.log(`[CA-SEARCH] Tentativa 2: Busca ampla via SerpApi (inclui anúncios)...`);

        let query = `CA ${cleanCA}`;
        let result = await searchGoogleWeb(query);

        if (!result.items || result.items.length === 0) {
            console.log("[CA-SEARCH] Tentativa 2a falhou. Tentando com contexto EPI...");
            query = `"CA ${cleanCA}" EPI`;
            result = await searchGoogleWeb(query);
        }

        if (result.items && result.items.length > 0) {
            console.log(`[CA-SEARCH] SerpApi retornou ${result.items.length} resultados.`);
            return await structureWithGemini(cleanCA, result.items.slice(0, 10));
        }

    } catch (error) {
        console.error(`[CA-SEARCH] Erro na SerpApi: ${error.message}`);
    }

    // ESTRATÉGIA 3: Fallback para Mock
    if (MOCK_DB[cleanCA]) {
        console.log(`[CA-SEARCH] Fallback: Usando Mock para CA ${cleanCA}`);
        return MOCK_DB[cleanCA];
    }

    return null;
}

/**
 * Scraping Direto no ConsultaCA.com (Estratégia Principal)
 * Adaptado de ca-scraper.js
 */
async function scrapeConsultaCA(cleanCA) {
    const url = `https://consultaca.com/${cleanCA}`;
    console.log(`[CA-SCRAPER] Acessando: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.status === 404) {
            console.log('[CA-SCRAPER] CA não encontrado no consultaca.com (404)');
            return null;
        }

        if (!response.ok) {
            console.log(`[CA-SCRAPER] Erro HTTP: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extração estruturada do HTML
        const title = $('h1').text().trim();

        // Extração de Validade
        let validade = 'Consultar fonte oficial';
        $('li, p, div, td').each((i, el) => {
            const text = $(el).text();
            if (text.includes('Validade:') && validade === 'Consultar fonte oficial') {
                const match = text.match(/\d{2}\/\d{2}\/\d{4}/);
                if (match) validade = match[0];
            }
        });

        // Extração de Fabricante
        let fabricante = 'Não identificado';
        const info = {};

        // Tenta extrair de tabelas estruturadas
        $('.table-striped tr, table tr').each((i, el) => {
            const key = $(el).find('td').first().text().trim().replace(':', '');
            const val = $(el).find('td').last().text().trim();
            if (key && val && key !== val) {
                info[key] = val;
            }
        });

        fabricante = info['Razão Social'] || info['Fabricante'] || fabricante;

        // Se não achou em tabela, tenta extrair do título
        if (fabricante === 'Não identificado' && title.includes('-')) {
            const parts = title.split('-');
            if (parts.length > 2) {
                fabricante = parts[parts.length - 1].trim();
            }
        }

        // Descrição Técnica
        let descricao = '';

        // Tenta achar seção de descrição
        $('h2, h3').each((i, el) => {
            const heading = $(el).text();
            if (heading.includes('Descrição') || heading.includes('Descrição Completa')) {
                descricao = $(el).next('p, div').text().trim();
            }
        });

        // Fallback: busca classes comuns
        if (!descricao) {
            descricao = $('.description, .texto-ca, .descricao-tecnica').first().text().trim();
        }

        // Fallback final: usa conteúdo de parágrafos
        if (!descricao) {
            $('p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 50 && !descricao) {
                    descricao = text;
                }
            });
        }

        descricao = info['Descrição Completa'] || descricao || "Descrição não disponível";

        // Nome Comercial
        let nomeComercial = title.replace(`CA ${cleanCA}`, '').replace(/[-–]/g, '').trim();
        if (info['Nome do Produto']) {
            nomeComercial = info['Nome do Produto'];
        }

        // Valida se encontrou dados mínimos
        if (!nomeComercial && !fabricante && !descricao) {
            console.log('[CA-SCRAPER] Página carregou mas não conseguiu extrair dados');
            return null;
        }

        console.log('[CA-SCRAPER] ✅ Dados extraídos com sucesso!');

        return {
            numero_ca: cleanCA,
            nome_comercial: nomeComercial || 'Não identificado',
            fabricante: fabricante,
            descricao_tecnica: descricao,
            validade: validade,
            situacao: info['Situação'] || 'Desconhecida',
            link_fonte: url
        };

    } catch (error) {
        console.error('[CA-SCRAPER] Erro ao fazer scraping:', error.message);
        return null;
    }
}

// Função auxiliar Gemini (Fallback quando scraping falha)
async function structureWithGemini(ca, items) {
    console.log(`[CA-SEARCH] Gemini estruturando dados para CA ${ca} com ${items.length} snippets...`);

    const fallbackResult = {
        numero_ca: ca,
        fabricante: "Fabricante não identificado (IA Indisponível)",
        nome_comercial: items[0]?.title || "Produto Identificado na Web",
        descricao_tecnica: items[0]?.snippet || "Descrição técnica não pode ser estruturada pela IA, mas o CA existe.",
        validade: "Consulte o link fonte",
        link_fonte: items[0]?.link || ""
    };

    if (!GOOGLE_API_KEY) {
        console.error("[CA-SEARCH] GOOGLE_API_KEY missing! Usando fallback bruto.");
        return fallbackResult;
    }

    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const context = items.map(item => `
        TITULO: ${item.title}
        SNIPPET: ${item.snippet}
        LINK: ${item.link}
        `).join('\n---\n');

        const prompt = `
        Você é um especialista em Equipamentos de Proteção Individual (EPIs).
        Analise os resultados de busca sobre o Certificado de Aprovação (CA) ${ca}.
        
        Os resultados podem vir de anúncios, fichas técnicas, PDFs, etc.
        Extraia as informações técnicas do CA, independente da fonte.
        
        Regras:
        1. Extraia Nome Comercial e Fabricante de qualquer fonte que mencione o CA ${ca}
        2. Prefira a fonte mais detalhada em caso de conflito
        3. A descrição pode vir de snippets de lojas
        4. Se não encontrar validade, use "Consultar fonte oficial"
        5. Retorne APENAS o JSON válido. Sem markdown.
    
        CONTEXTO:
        ${context}

        JSON OBRIGATÓRIO:
        {
            "numero_ca": "${ca}",
            "fabricante": "Nome do Fabricante",
            "nome_comercial": "Nome Comercial",
            "descricao_tecnica": "Descrição completa",
            "validade": "DD/MM/AAAA ou 'Consultar fonte oficial'",
            "link_fonte": "URL da melhor fonte"
        }
        `;

        console.log("[CA-SEARCH] Chamando Gemini API (2.0-flash-exp)...");
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanedText);
            console.log("[CA-SEARCH] ✅ Gemini estruturou dados com sucesso!");
            return parsed;
        } catch (parseError) {
            console.error("[CA-SEARCH] Falha no Parse JSON. Usando Fallback.", parseError.message);
            return fallbackResult;
        }

    } catch (e) {
        console.error("[CA-SEARCH] Erro Geral no Gemini:", e.message);
        console.warn("[CA-SEARCH] ATIVANDO FALLBACK DE SEGURANÇA");
        return fallbackResult;
    }
}
