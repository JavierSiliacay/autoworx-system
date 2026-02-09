const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function testOllama() {
    const model = process.env.OLLAMA_MODEL || "llama3.2:1b";
    console.log(`Testing Ollama connection with model: ${model}...`);

    try {
        const startTime = Date.now();
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                prompt: "Show me you are alive by saying 'Ollama is online!'",
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const duration = (Date.now() - startTime) / 1000;

        console.log("\n--- Ollama Response ---");
        console.log(data.response);
        console.log(`\nTime taken: ${duration}s`);
        console.log("------------------------");
        console.log("Local AI Test Successful! 🚀");
    } catch (error) {
        console.error("Local AI Test Failed! ❌");
        if (error.message.includes("ECONNREFUSED")) {
            console.error("Error: Ollama is not running. Please start the Ollama application.");
        } else {
            console.error("Error:", error.message);
            console.log("\nTIP: Ollama is running, but you might not have the model yet.");
            console.log("Run this command to download it:");
            console.log(`powershell -Command "ollama pull ${model}"`);
        }
    }
}

testOllama();
