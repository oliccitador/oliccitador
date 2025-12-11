
const descriptions = [
    "CATMAT227068",
    "CATMAT 227068",
    "CATMAT:227068",
    "CATMAT-227068",
    "CATMAT_227068",
    "CATMAT=227068",
    "CATMAT.227068",
    "CODIGO 123456",
    "BR 654321"
];

// Current regex from lib/flow-orchestrator.js
const currentRegex = /(?:CATMAT|BR|CÓDIGO|CODIGO)[\s:.-]+(\d{5,8})/i;

// Proposed regex (updated to include _ and =)
const proposedRegex = /(?:CATMAT|BR|CÓDIGO|CODIGO)[\s:._=-]*(\d{5,8})/i;

console.log("--- Testing Current Regex ---");
descriptions.forEach(desc => {
    const match = desc.match(currentRegex);
    console.log(`"${desc}" -> ${match ? match[1] : "NO MATCH"}`);
});

console.log("\n--- Testing Proposed Regex ---");
descriptions.forEach(desc => {
    const match = desc.match(proposedRegex);
    console.log(`"${desc}" -> ${match ? match[1] : "NO MATCH"}`);
});
