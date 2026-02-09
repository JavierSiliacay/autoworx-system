const fetch = require("node-fetch");
// standard node 18+ has fetch. 

async function listOllamaModels() {
    try {
        console.log("Checking for local Ollama instance...");
        const response = await fetch("http://localhost:11434/api/tags");

        if (!response.ok) {
            throw new Error(`Failed to connect to Ollama: ${response.statusText}`);
        }

        const data = await response.json();
        const models = data.models || [];

        console.log(`\n✅ Connected to Ollama! Found ${models.length} models:\n`);

        if (models.length === 0) {
            console.log("No models found. Run 'ollama pull llama3.2' to get started.");
        } else {
            models.forEach(m => {
                console.log(`- ${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
            });
        }

        // Check if our default model is there
        const defaultModel = "llama3.2:1b";
        const hasDefault = models.some(m => m.name.includes("llama3.2:1b"));

        if (!hasDefault) {
            console.log(`\n⚠️ Warning: The default model '${defaultModel}' is not installed.`);
            console.log(`> Please run: ollama pull ${defaultModel}`);
        } else {
            console.log(`\n✅ Default model '${defaultModel}' is available.`);
        }

    } catch (error) {
        console.error("Discovery Error:", error.message);
        console.error("Make sure Ollama is running!");
    }
}

listOllamaModels();
