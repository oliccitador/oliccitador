import * as cheerio from 'cheerio';

/**
 * Busca dados técnicos de um CA diretamente da fonte pública (consultaca.com)
 * @param {string} caNumber - Número do CA (apenas dígitos)
 * @returns {Promise<Object|null>} Dados do EPI ou null se não encontrar
 */
export async function scrapeCA(caNumber) {
    const cleanCA = caNumber.replace(/\D/g, '');
    if (!cleanCA) return null;

    const url = `https://consultaca.com/${cleanCA}`;
    console.log(`[CA-SCRAPER] Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.status === 404) {
            console.log('[CA-SCRAPER] CA não encontrado (404)');
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // O site consultaca.com tem estrutura bem definida
        // Título geralmente é "CA {Numero} - {Tipo EPI} - {Fabricante}" ou similar
        // Dados estão em tabelas ou listas

        const title = $('h1').text().trim();

        // Extração de Validade
        // Geralmente texto "Validade: DD/MM/AAAA"
        let validade = 'Não identificada';
        $('li, p, div').each((i, el) => {
            const text = $(el).text();
            if (text.includes('Validade:') && validade === 'Não identificada') {
                validade = text.split('Validade:')[1].trim().split(' ')[0]; // Pega só a data
            }
        });

        // Extração de Fabricante
        // Busca CNPJ ou Razão Social
        let fabricante = 'Não identificado';
        // Tenta achar em tabelas
        $('td').each((i, el) => {
            if ($(el).text().includes('Razão Social:')) {
                fabricante = $(el).next().text().trim();
            }
        });

        // Se não achou na tabela, tenta padrão de texto
        if (fabricante === 'Não identificado') {
            // Fallback simples: procura texto próximo a CNPJ
        }

        // Descrição Técnica
        // Geralmente tem um h2 "Descrição Completa" ou similar
        let descricao = '';
        $('h2').each((i, el) => {
            if ($(el).text().includes('Descrição Completa')) {
                descricao = $(el).next('p').text().trim();
            }
        });

        if (!descricao) {
            // Tenta pegar o primeiro paragrafo significativo após o titulo
            descricao = $('.description, .texto-ca').first().text().trim() || title;
        }

        // Se falhou tudo mas a página carregou, retorna ao menos o título
        if (!fabricante && title.includes('-')) {
            // Tenta extrair do titulo: CA 12345 - Luva - FABRICANTE
            const parts = title.split('-');
            if (parts.length > 2) fabricante = parts[parts.length - 1].trim();
        }

        // Estrutura de Retorno Realista
        // Precisamos refinar os seletores baseados no HTML real
        // Como não vi o HTML, vou fazer um dump no primeiro teste se falhar.
        // Mas o consultaca.com costumava ter classes simples.

        // TENTATIVA ROBUSTA: Extrair tudo que parece chave: valor
        const info = {};
        $('.table-striped tr').each((i, el) => {
            const key = $(el).find('td').first().text().trim().replace(':', '');
            const val = $(el).find('td').last().text().trim();
            if (key && val) info[key] = val;
        });

        return {
            ca: cleanCA,
            nome_comercial: title.replace(`CA ${cleanCA}`, '').replace(/[-–]/g, '').trim(),
            fabricante: info['Razão Social'] || info['Fabricante'] || fabricante,
            validade: info['Validade'] || validade,
            descricao_tecnica: info['Descrição Completa'] || descricao || "Descrição não encontrada",
            situacao: info['Situação'] || 'Desconhecida',
            link_fonte: url
        };

    } catch (error) {
        console.error('[CA-SCRAPER] Erro:', error.message);
        return null;
    }
}
