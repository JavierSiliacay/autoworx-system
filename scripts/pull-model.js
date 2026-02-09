async function pullModel() {
    console.log("Starting pull for llama3.2:1b via API...");
    try {
        const response = await fetch("http://localhost:11434/api/pull", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "llama3.2:1b",
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        const result = await response.json();
        console.log("Success!", result);
    } catch (e) {
        console.error("Failed to pull model:", e.message);
    }
}

pullModel();
