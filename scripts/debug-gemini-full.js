const https = require('https');

const API_KEY = "AIzaSyANKM6Cuv5fefOXrrV9Xvv3xe_5_1JQ9YM"; // The latest key provided

async function listModels(version) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/${version}/models?key=${API_KEY}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: responseBody });
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
}

async function makeRequest(version, model) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            contents: [{
                parts: [{ text: "Hello, this is a test." }]
            }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/${version}/models/${model}:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: responseBody });
            });
        });

        req.on('error', (error) => reject(error));
        req.write(data);
        req.end();
    });
}

async function runDiagnostics() {
    console.log("=== STARTING DEEP DIAGNOSTICS (LIST MODELS) ===");
    console.log(`API Key Prefix: ${API_KEY.substring(0, 10)}...`);

    const version = "v1beta";
    console.log(`\n--- Listing Models (Version: ${version}) ---`);

    try {
        const result = await listModels(version);

        if (result.statusCode === 200) {
            console.log("✅ LIST MODELS SUCCESS!");
            const data = JSON.parse(result.body);

            let targetModel = null;

            if (data.models) {
                console.log("Available Models:");
                data.models.forEach(m => {
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                        console.log(`- ${m.name}`);
                        if (!targetModel && m.name.includes("flash")) targetModel = m.name;
                    }
                });
                if (!targetModel && data.models.length > 0) targetModel = data.models[0].name;
            } else {
                console.log("No models found in response.");
            }

            if (targetModel) {
                const modelName = targetModel.replace("models/", "");
                console.log(`\n--- Testing Generation with ${modelName} ---`);
                const genResult = await makeRequest(version, modelName);

                if (genResult.statusCode === 200) {
                    console.log("✅ GENERATE CONTENT SUCCESS!");
                    console.log("Response:", genResult.body.substring(0, 200));
                } else {
                    console.log(`❌ GENERATE CONTENT FAILED: Status ${genResult.statusCode}`);
                    console.log("Response Body:", genResult.body);
                }
            }

        } else {
            console.log(`❌ LIST MODELS FAILED: Status ${result.statusCode}`);
            console.log("Response Body:", result.body);
        }
    } catch (err) {
        console.log(`❌ NETWORK ERROR: ${err.message}`);
    }

    console.log("\n=== DIAGNOSTICS COMPLETE ===");
}

runDiagnostics();
