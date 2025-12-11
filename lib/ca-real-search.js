import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchGoogleWeb } from './serpapi.js';
import { parse } from 'node-html-parser';

/**
 * CA Real Search Service
 * ESTRATÉGIA:
 * 1. Scraping direto em consultaca.com (fonte oficial, Node.js compatible)
 * 2. Se falhar, busca ampla na web (anúncios, PDFs)
 * 3. Usa IA como fallback
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

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

    console.log(`[CA-SEARCH] Tentativa 1: Scraping direto em consultaca.com...`);
    const scrapedData = await scrapeConsultaCA(cleanCA);

    if (scrapedData) {
        console.log(`[CA-SEARCH] ✅ Dados obtidos via scraping direto!`);
        return scrapedData;
    }

    try {
        console.log(`[CA-SEARCH] Tentativa 2: Busca ampla via SerpApi...`);

        let query = `CA ${cleanCA}`;
        let result = await searchGoogleWeb(query);

        if (!result.items || result.items.length === 0) {
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

    if (MOCK_DB[cleanCA]) {
        console.log(`[CA-SEARCH] Fallback: Usando Mock para CA ${cleanCA}`);
        return MOCK_DB[cleanCA];
    }

    return null;
}

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
            console.log('[CA-SCRAPER] CA não encontrado (404)');
            return null;
        }

        if (!response.ok) {
            console.log(`[CA-SCRAPER] Erro HTTP: ${response.status}`);
            return null;
        }

        const html = await response.text();
        const root = parse(html);

        const h1 = root.querySelector('h1');
        const title = h1 ? h1.text.trim() : '';

        let validade = 'Consultar fonte oficial';
        const allElements = root.querySelectorAll('li, p, div, td');
        for (const el of allElements) {
            const text = el.text;
            if (text.includes('Validade:')) {
                const match = text.match(/\d{2}\/\d{2}\/\d{4}/);
                if (match) {
                    validade = match[0];
                    break;
                }
            }
        }

        let fabricante = 'Não identificado';
        const info = {};

        const tableRows = root.querySelectorAll('.table-striped tr, table tr');
        for (const row of tableRows) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const key = cells[0].text.trim().replace(':', '');
                const val = cells[1].text.trim();
                if (key && val && key !== val) {
                    info[key] = val;
                }
            }
        }

        fabricante = info['Razão Social'] || info['Fabricante'] || fabricante;

        if (fabricante === 'Não identificado' && title.includes('-')) {
            const parts = title.split('-');
            if (parts.length > 2) {
                fabricante = parts[parts.length - 1].trim();
            }
        }

        let descricao = '';
        const headings = root.querySelectorAll('h2, h3');
        for (const heading of headings) {
            const headingText = heading.text;
            if (headingText.includes('Descrição')) {
                const nextEl = heading.nextElementSibling;
                if (nextEl) {
                    descricao = nextEl.text.trim();
                    break;
                }
            }
        }

        if (!descricao) {
            const descEl = root.querySelector('.description, .texto-ca');
            if (descEl) descricao = descEl.text.trim();
        }

        if (!descricao) {
            const paragraphs = root.querySelectorAll('p');
            for (const p of paragraphs) {
                const text = p.text.trim();
                if (text.length > 50) {
                    descricao = text;
                    break;
                }
            }
        }

        descricao = info['Descrição Completa'] || descricao || "Descrição não disponível";

        let nomeComercial = title.replace(`CA ${cleanCA}`, '').replace(/[-–]/g, '').trim();
        if (info['Nome do Produto']) {
            nomeComercial = info['Nome do Produto'];
        }

        if (!nomeComercial && fabricante === 'Não identificado' && !descricao) {
            return null;
        }

        console.log('[CA-SCRAPER] ✅ Dados extraídos!');

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
        console.error('[CA-SCRAPER] Erro:', error.message);
        return null;
    }
}

async function structureWithGemini(ca, items) {
    const fallbackResult = {
        numero_ca: ca,
        fabricante: "Fabricante não identificado",
        nome_comercial: items[0]?.title || "Produto Identificado",
        descricao_tecnica: items[0]?.snippet || "Descrição não disponível",
        validade: "Consultar fonte",
        link_fonte: items[0]?.link || ""
    };

    if (!GOOGLE_API_KEY) {
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
        Analise os resultados sobre CA ${ca}.
        Extraia: fabricante, nome comercial, descrição técnica.
        Retorne APENAS JSON válido.
    
        CONTEXTO:
        ${context}

        JSON:
        {
            "numero_ca": "${ca}",
            "fabricante": "Nome",
            "nome_comercial": "Nome",
            "descricao_tecnica": "Descrição",
            "validade": "DD/MM/AAAA ou Consultar",
            "link_fonte": "URL"
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            return fallbackResult;
        }

    } catch (e) {
        return fallbackResult;
    }
}
