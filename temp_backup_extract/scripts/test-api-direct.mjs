/**
 * Direct API Test for 3-Flow System
 * Tests the /api/analyze endpoint directly
 */

const testAnalysis = async () => {
    const testData = {
        description: "Cadeira ergonômica com apoio lombar ajustável",
        ca: "",
        catmat: ""
    };

    console.log('Testing /api/analyze endpoint...');
    console.log('Request:', JSON.stringify(testData, null, 2));

    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: This will fail without proper auth cookie
                // This is just to test if the endpoint is reachable
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        console.log('\nResponse Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (data.error) {
            console.error('\n❌ Error:', data.error);
        } else {
            console.log('\n✅ Success!');
            console.log('Flow used:', data.flow_used);
            console.log('Status:', data.status);
        }

    } catch (error) {
        console.error('\n❌ Request failed:', error.message);
    }
};

testAnalysis();
