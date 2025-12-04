// Script para validar a lógica de limpeza para PNCP (Edital Gêmeo)
// Caso: ESCORREGADOR

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
COMPRIMENTO 167 CM. DIMENSÕES COM
TOLERÂNCIA DE +/– 5%. PRODUTO COM CERTIFICAÇÃO
ABNT NBR NM 300–1 E ABNT NBR NM 300–3.
APRESENTAR LAUDO ANTI– UV DA MATÉRIA PRIMA DE
NO MÍNIMO 2000 HORAS, ATENDENDO AS EXIGÊNCIAS
DA ASTM G 154, APRESENTAR LAUDO DA MATÉRIA
PRIMA DE RESISTÊNCIA A CONDUTIVIDADE ELÉTRICA
(ANTIESTÁTICO), ATENDENDO AS EXIGÊNCIAS DA ABNT
NBR 14922:2013 E APRESENTAR LAUDO DA MATÉRIA
PRIMA DE RESISTIVIDADE VOLUMÉTRICA E
SUPERFICIAL, PARA AVALIAR AS CARACTERÍSTICAS
CONDUTIVAS, ANTIESTÁTICAS E ISOLANTES DA
MATÉRIA PRIMA, ATENDENDO AS EXIGÊNCIAS DA
ASTM D 257–14`;

console.log("--- INPUT ---");
console.log(description);
console.log("\n--- LÓGICA PNCP (EDITAL GÊMEO) ---");

// LÓGICA PNCP: Preserva mais palavras-chave do edital original
const cleanForPNCP = (text, wordLimit) => {
    if (!text) return "";

    // 1. Remove apenas o LIXO EXTREMO (Billing, Preços, Unidades soltas)
    let cleaned = text
        .replace(/R\$\s?[\d\.]+,?\d{0,2}/gi, '')
        .replace(/\b\d{1,3}(\.\d{3})*,\d{2}\b/g, '')
        .replace(/\bUN\b\s+[\d,\.]+/gi, '')
        .replace(/\b\d+,\d{4}\b/g, '')
        .replace(/\b[\d,\.]+\s+[\d,\.]+\s+[\d,\.]+\b(?!\s+[A-Z])/g, ''); // Sequências numéricas sem contexto

    // 2. Remove FRASES BUROCRÁTICAS (mas mantém o conteúdo técnico)
    cleaned = cleaned
        .replace(/DEVERÁ\s+(TER|SER|POSSUIR|CONTER)\s+(NO\s+MÍNIMO|MÍNIMO DE|PELO\s+MENOS)?/gi, '')
        .replace(/QUE\s+SERVE\s+(DE|PARA|COMO)\s+\w+/gi, '')
        .replace(/SENDO\s+(EM|DE|COM)?/gi, '')
        .replace(/FABRICADOS?\s+EM/gi, '')
        .replace(/MEDIDAS\s+APROXIMADAS\s*:\s*/gi, '')
        .replace(/DIMENSÕES\s+COM\s+TOLERÂNCIA\s+DE\s+[^\.]*/gi, '')
        .replace(/APRESENTAR\s+LAUDO\s+[^\.,]*(,|\.)/gi, '')
        .replace(/ATENDENDO\s+(AS|ÀS|A|AO)\s+EXIGÊNCIAS\s+(DA|DO|DE)\s+[\w\s\d\-:]+/gi, '')
        .replace(/TRATAMENTO\s+CONTRA\s+A\s+AÇÃO\s+DOS\s+RAIOS\s+ULTRAVIOLETAS/gi, 'ANTI UV')
        .replace(/DA\s+MATÉRIA\s+PRIMA/gi, '')
        .replace(/TODOS\s+OS\s+ITENS/gi, '')
        .replace(/PRODUTO\s+COM\s+CERTIFICAÇÃO/gi, '')
        .replace(/ACOMPANHA/gi, '');

    // 3. Normalização básica
    cleaned = cleaned
        .replace(/[–—\-]+/g, ' ')
        .replace(/[^\wÀ-ÿ\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // 4. Seleção de Palavras-Chave (Diferente da Query Comercial)
    // Aqui não reorganizamos tanto, tentamos manter a "frase" original do edital
    // mas removendo stop words comuns para busca full-text
    const stopWords = new Set(['COM', 'DE', 'EM', 'PARA', 'POR', 'UMA', 'DAS', 'DOS', 'OU', 'E', 'QUE', 'AS', 'OS', 'AO', 'NA', 'NO', 'SE', 'UM', 'UNS', 'UMA', 'UMAS']);

    const words = cleaned.split(' ').filter(w => w.length > 1 && !stopWords.has(w.toUpperCase()));

    // 5. Deduplicate
    const uniqueWords = [...new Set(words)];

    // 6. Limite de palavras (um pouco maior que a query comercial para pegar mais contexto)
    return uniqueWords.slice(0, wordLimit).join(' ');
};

const result = cleanForPNCP(description, 20); // Testando com 20 palavras

console.log("\n--- OUTPUT PNCP ---");
console.log(result);
