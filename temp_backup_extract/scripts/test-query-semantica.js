// ============================================================
// BLOCO 1: QUERY SEMÂNTICA (MERCADO - E-COMMERCE)
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
console.log("║" + " QUERY SEMÂNTICA (MERCADO - E-COMMERCE)".padEnd(78) + "║");
console.log("╚" + "═".repeat(78) + "╝");

// Limpeza AGRESSIVA - Foco em especificações comerciais
let cleaned = description
  .replace(/DEVERÁ\s+TER\s+NO\s+MÍNIMO/gi, '')
  .replace(/QUE\s+SERVE\s+DE\s+CABIDE/gi, '')
  .replace(/SENDO/gi, '')
  .replace(/INCORPORADO\s+EM/gi, '')
  .replace(/TODOS\s+OS\s+ITENS\s+FABRICADOS\s+EM/gi, '')
  .replace(/TRATAMENTO\s+CONTRA\s+A\s+AÇÃO\s+DOS\s+RAIOS\s+ULTRAVIOLETAS\s+E/gi, '')
  .replace(/MEDIDAS\s+APROXIMADAS\s*:\s*/gi, '')
  .replace(/ACOMPANHA/gi, '')
  .replace(/[–—\-]+/g, ' ')
  .replace(/[^\wÀ-ÿ\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Remove stopwords comerciais
const stopWords = new Set(['COM', 'DE', 'EM', 'PARA', 'POR', 'UMA', 'DAS', 'OU', 'E']);
const words = cleaned.split(' ').filter(w => w.length > 2 && !stopWords.has(w.toUpperCase()));

// Deduplica
const uniqueWords = [...new Set(words)];

// Retorna até 15 palavras principais
const querySemantica = uniqueWords.slice(0, 15).join(' ');

console.log("\n📦 OUTPUT:");
console.log(querySemantica);
console.log("\n📊 Total de palavras:", querySemantica.split(' ').length);
console.log("\n");
