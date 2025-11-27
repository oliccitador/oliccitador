/**
 * Manual Test Script for 3-Flow System
 * 
 * Instructions:
 * 1. Open browser to http://localhost:3000
 * 2. Login with: marcosmelo722@gmail.com / 225800
 * 3. Go to /analise page
 * 4. Run this test
 */

// Test data
const testCases = [
    {
        name: "Flow 2 - PNCP (No CA/CATMAT)",
        description: "Cadeira ergonômica com apoio lombar ajustável, braços reguláveis, base giratória com rodízios",
        ca: "",
        catmat: "",
        expectedFlow: "FLOW_2_PNCP"
    },
    {
        name: "Flow 1 - CA",
        description: "Luva de segurança em PVC",
        ca: "12345",
        catmat: "",
        expectedFlow: "FLOW_1_CA"
    },
    {
        name: "Flow 3 - CATMAT",
        description: "Papel sulfite A4",
        ca: "",
        catmat: "67890",
        expectedFlow: "FLOW_3_CATMAT"
    }
];

console.log("=".repeat(60));
console.log("3-FLOW SYSTEM TEST CASES");
console.log("=".repeat(60));

testCases.forEach((test, index) => {
    console.log(`\n[TEST ${index + 1}] ${test.name}`);
    console.log(`Description: ${test.description}`);
    console.log(`CA: ${test.ca || "(empty)"}`);
    console.log(`CATMAT: ${test.catmat || "(empty)"}`);
    console.log(`Expected Flow: ${test.expectedFlow}`);
    console.log("-".repeat(60));
});

console.log("\n\nMANUAL TESTING STEPS:");
console.log("1. Fill in the description field");
console.log("2. Fill in CA/CATMAT if specified");
console.log("3. Click 'Analisar'");
console.log("4. Check the response for:");
console.log("   - flow_used field (should match expected)");
console.log("   - status field (OK, CA_NAO_ENCONTRADO, etc.)");
console.log("   - No 'invalid api key' errors");
console.log("\n" + "=".repeat(60));
