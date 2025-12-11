/**
 * Direct Flow Test - Bypasses API authentication
 * Tests the flow orchestrator directly
 */

import { determineFlow, executeFlow } from '../lib/flow-orchestrator.js';

const testCases = [
    {
        name: "Flow 2 - PNCP (No CA/CATMAT)",
        description: "Cadeira ergonômica com apoio lombar ajustável",
        ca: "",
        catmat: ""
    },
    {
        name: "Flow 1 - CA",
        description: "Luva de segurança em PVC",
        ca: "12345",
        catmat: ""
    },
    {
        name: "Flow 3 - CATMAT",
        description: "Papel sulfite A4",
        ca: "",
        catmat: "67890"
    }
];

async function runTests() {
    console.log('='.repeat(60));
    console.log('DIRECT FLOW ORCHESTRATOR TEST');
    console.log('='.repeat(60));

    for (const test of testCases) {
        console.log(`\n[TEST] ${test.name}`);
        console.log(`Description: ${test.description}`);
        console.log(`CA: ${test.ca || "(empty)"}`);
        console.log(`CATMAT: ${test.catmat || "(empty)"}`);

        try {
            // Determine flow
            const flow = determineFlow(test);
            console.log(`✅ Flow determined: ${flow}`);

            // Execute flow
            const result = await executeFlow(flow, test);
            console.log(`✅ Flow executed successfully`);
            console.log(`Status: ${result.status}`);
            console.log(`Flow used: ${result.flow_used}`);

            if (result.error) {
                console.log(`⚠️  Error: ${result.error}`);
            }

            if (result.bloco_justificativa) {
                console.log(`✅ Justification generated (${result.bloco_justificativa.length} chars)`);
            }

        } catch (error) {
            console.error(`❌ Test failed:`, error.message);
            console.error(error.stack);
        }

        console.log('-'.repeat(60));
    }

    console.log('\n✅ All tests completed');
}

runTests();
