// ============================================================
// BLOCO 2: SNIPPET PNCP (EDITAL GÊMEO)
// ============================================================

const description = `ESCORREGADOR – DEVERÁ TER NO MÍNIMO 01
ESCADA COM DEGRAUS TEXTURIZADOS SENDO
ANTIDERRAPANTE E CORRIMÃO INCORPORADO EM
LATERAIS COM FORMATO LÚDICO DE GOLFINHO COM
NARIZ QUE SERVE DE CABIDE, ELEFANTE COM
TROMBINA QUE SERVE DE CABIDE OU PALHACINHO
COM NARIZ QUE SERVE DE CABIDE, 01 RAMPA RETA OU
ONDULADA, COM TRAVAMENTO POR ROSCA.
ACOMPANHA ARO DE BASQUETE EM UMA DAS
LATERAIS. TODOS OS ITENS FABRICADOS EM
POLIETILENO ROTOMOLDADO, ATÓXICO, COM
TRATAMENTO CONTRA A AÇÃO DOS RAIOS
ULTRAVIOLETAS E ANTIESTÁTICO. MEDIDAS
APROXIMADAS: LARGURA 78 CM X ALTURA 102 CM X
COMPRIMENTO 167 CM.`;

console.log("╔" + "═".repeat(78) + "╗");
console.log("║" + " SNIPPET PNCP (EDITAL GÊMEO - HISTÓRICO LICITAÇÕES)".padEnd(78) + "║");
console.log("╚" + "═".repeat(78) + "╝");

const cleanForPNCP = (text) => {
    // Limpeza SELETIVA - Preserva palavras-chave do edital original
    let cleaned = text
        // Remove apenas frases burocráticas extremas
        .replace(/DEVERÁ\s+TER\s+NO\s+MÍNIMO/gi, '')
        .replace(/QUE\s+SERVE\s+DE\s+CABIDE/gi, '')
        .replace(/MEDIDAS\s+APROXIMADAS\s*:\s*/gi, '')
        .replace(/[–—\-]+/g, ' ')
        .replace(/[^\wÀ-ÿ\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Remove apenas stopwords MUITO básicas (mantém mais contexto)
    const stopWords = new Set(['COM', 'DE', 'EM', 'E']);
    const words = cleaned.split(' ').filter(w => w.length > 2 && !stopWords.has(w.toUpperCase()));

    // Deduplica
    const uniqueWords = [...new Set(words)];

    // Retorna até 25 palavras (mais que a Query Semântica para manter contexto do edital)
    return uniqueWords.slice(0, 25).join(' ');
};

const snippetPNCP = cleanForPNCP(description);

console.log("\n📄 OUTPUT:");
console.log(snippetPNCP);
console.log("\n📊 Total de palavras:", snippetPNCP.split(' ').length);
console.log("\n");
