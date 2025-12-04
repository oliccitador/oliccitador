// Script para validar a lógica de limpeza (cleanAndExtract)
// Caso: ESCORREGADOR - COMPARAÇÃO COM PNCP

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

console.log("=".repeat(80));
console.log("QUERY SEMÂNTICA (MERCADO) - cleanAndExtract");
console.log("=".repeat(80));

// LÓGICA QUERY SEMÂNTICA: Limpeza por Padrões de Expressão
const cleanAndExtract = (text, wordLimit) => {
    if (!text) return "";

    let cleaned = text
        .replace(/R\$\s?[\d\.]+,?\d{0,2}/gi, '')
        .replace(/\b\d{1,3}(\.\d{3})*,\d{2}\b/g, '')
        .replace(/\bUN\b\s+[\d,\.]+/gi, '')
        .replace(/\b\d+,\d{4}\b/g, '')
        .replace(/\b[\d,\.]+\s+[\d,\.]+\s+[\d,\.]+\b(?!\s+[A-Z])/g, '');

    cleaned = cleaned
        .replace(/DEVERÁ\s+(TER|SER|POSSUIR|CONTER)\s+(NO\s+MÍNIMO|MÍNIMO DE|PELO\s+MENOS)?/gi, '')
        .replace(/DEVERÁ\s+TER\s+NO\s+MÍNIMO/gi, '')
        .replace(/QUE\s+SERVE\s+(DE|PARA|COMO)\s+\w+/gi, '')
        .replace(/SENDO\s+(EM|DE|COM)?/gi, '')
        .replace(/FABRICADOS?\s+EM/gi, '')
        .replace(/INCORPORADO\s+EM/gi, '')
        .replace(/MEDIDAS\s+APROXIMADAS\s*:\s*/gi, '')
        .replace(/DIMENSÕES\s+COM\s+TOLERÂNCIA\s+DE\s+[^\.]*/gi, '')
        .replace(/APRESENTAR\s+LAUDO\s+[^\.,]*(,|\.)/gi, '')
        .replace(/ATENDENDO\s+(AS|ÀS|A|AO)\s+EXIGÊNCIAS\s+(DA|DO|DE)\s+[\w\s\d\-:]+/gi, '')
        .replace(/TRATAMENTO\s+CONTRA\s+A\s+AÇÃO\s+DOS\s+RAIOS\s+ULTRAVIOLETAS\s+E/gi, 'ANTI UV')
        .replace(/CONTRA\s+A\s+AÇÃO\s+DOS?\s+RAIOS/gi, '')
        .replace(/DA\s+MATÉRIA\s+PRIMA\s+(DE|COM)?/gi, '')
        .replace(/TODOS\s+OS\s+ITENS/gi, '')
        .replace(/PRODUTO\s+COM/gi, '')
        .replace(/ACOMPANHA/gi, 'INCLUI')
        .replace(/\s+(EM|COM|DE|PARA|POR)\s+UMA\s+DAS\s+LATERAIS/gi, '')
        .replace(/\s+EM\s+LATERAIS/gi, '')
        .replace(/TIPO\s+(FUNCIONAMENTO|CONSTRUTIVO|USO|DE\s+PNEU|PNEU\s+TRASEIRO|FREIO)\s*:\s*/gi, '')
        .replace(/MATERIAL\s+ESTRUTURA\s*:\s*/gi, 'MATERIAL ')
        .replace(/ACABAMENTO\s+(ESTRUTURA|DO\s+ENCOSTO\s+E\s+ASSENTO)\s*:\s*/gi, '')
        .replace(/APOIO\s+(BRAÇO|PERNAS|PANTURRILHA|PÉS)\s*:\s*/gi, '')
        .replace(/TAMANHO\s*:\s*/gi, '')
        .replace(/CAPACIDADE\s+MÁXIMA\s*:\s*/gi, 'CAPACIDADE ');

    cleaned = cleaned
        .replace(/[–—\-]+/g, ' ')
        .replace(/[^\wÀ-ÿ\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    cleaned = cleaned
        .replace(/\bAUTOLIMPEZA\b/gi, 'AUTOLIMPANTE')
        .replace(/\bACO\s+INOX\b/gi, 'INOX')
        .replace(/\bACO\s+CARBONO\b/gi, 'AÇO CARBONO');

    const capacityMatch = text.match(/\b(\d+)L\b/i);
    const capacity = capacityMatch ? `CAPACIDADE ${capacityMatch[1]}l` : '';

    const dimensionsPattern = /LARGURA\s+(\d+)\s*CM.*?ALTURA\s+(\d+)\s*CM.*?COMPRIMENTO\s+(\d+)\s*CM/i;
    const dimMatch = text.match(dimensionsPattern);
    let dimensions = '';
    if (dimMatch) {
        dimensions = `LARGURA ${dimMatch[1]}CM ALTURA ${dimMatch[2]}CM COMPRIMENTO ${dimMatch[3]}CM`;
    }

    const words = cleaned.split(' ').filter(w => w.length > 2);

    const uniqueWords = [];
    const seen = new Set();

    for (const word of words) {
        const key = word.toUpperCase();
        if (!seen.has(key)) {
            seen.add(key);
            uniqueWords.push(word);
        }
    }

    let result = [];
    if (uniqueWords[0]) result.push(uniqueWords[0]);
    if (capacity) result.push(capacity);

    const voltage = uniqueWords.find(w => w.match(/\d+V$/i));
    const otherAttrs = uniqueWords.slice(1).filter(w => {
        return w !== voltage && !w.match(/^\d+L$/i);
    });
    result.push(...otherAttrs);

    if (dimensions) result.push(dimensions);
    if (voltage) result.push(voltage);

    return result.join(' ');
};

const querySemantica = cleanAndExtract(description, 50);
console.log(querySemantica);
console.log("\nPalavras:", querySemantica.split(' ').length);
