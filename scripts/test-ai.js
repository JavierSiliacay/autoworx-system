const dotenv = require("dotenv");
const path = require("path");
const fetch = require("node-fetch"); // You might need to install node-fetch if not available, or use native fetch if node version supports it. 
// standard node 18+ has fetch. 

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function runTest() {
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:1b";
    console.log(`Testing Ollama with model: ${ollamaModel}`);

    const prompt = "Hello! Tell me a very short fun fact about cars for Autoworx Repairs.";

    try {
        console.log("Sending prompt to Ollama...");
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: ollamaModel,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama connection failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("\n--- Ollama Response ---");
        console.log(data.response);
        console.log("------------------------\n");
        console.log("AI Test Successful! 🚀");
    } catch (error) {
        console.error("AI Test Failed! ❌");
        console.error("Make sure Ollama is running (ollama serve) and the model is pulled.");
        console.error(error.message);
    }
}

runTest();
