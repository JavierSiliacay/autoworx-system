const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";

/**
 * Helper to strip markdown symbols for a more "human" feel as requested
 */
function cleanResponse(text: string): string {
    return text
        .replace(/\*\*/g, "")      // Remove bold **
        .replace(/\*/g, "")       // Remove bullet/italic *
        .replace(/#/g, "")        // Remove headers #
        .replace(/^- /gm, "• ")   // Convert dashes to soft bullets
        .replace(/^> /gm, "")     // Remove blockquotes
        .replace(/`/g, "")        // Remove backticks
        .trim();
}

/**
 * Generic function to chat with AI using OpenRouter (primary) or Ollama (fallback)
 */
export async function chatWithAI(messages: { role: string; content: string }[]) {
    // 1. Try OpenRouter (User preferred method using fetch)
    if (OPENROUTER_API_KEY) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Autoworx System",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "arcee-ai/trinity-large-preview:free",
                    "messages": messages
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return cleanResponse(data.choices[0].message.content);
                }
            } else {
                const errorData = await response.json();
                console.error("OpenRouter API error:", errorData);
            }
        } catch (error) {
            console.error("OpenRouter Fetch Error:", error);
        }
    }

    // 2. Fallback to local Ollama
    try {
        const prompt = messages[messages.length - 1].content;
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            return cleanResponse(data.response);
        }
    } catch (error) {
        console.error("Ollama Error:", error);
    }

    throw new Error("No AI providers available. Please check your configuration.");
}

/**
 * Specific function for generating business reports (keeps markdown for the dashboard)
 */
export async function generateAIReport(dataString: string) {
    const prompt = `
    You are the Senior Business Intelligence Analyst for Autoworx Repairs.
    This system was developed by Javier Siliacay, an Autotronics student from the University of Science and Technology of Southern Philippines (USTP).
    Provide a professional, executive-level business analysis report.
    
    Data:
    ${dataString}
    
    Use the following exact structure:
    ### FINANCIAL PERFORMANCE
    Provide a professional breakdown of revenue.
    - **Gross Revenue**: [Amount]
    - **Labor Total**: [Amount]
    - **Parts Total**: [Amount]
    - **Average Transaction**: [Amount]
    
    ### SERVICE ANALYSIS
    List the top performing services. Show job counts.
    
    ### STRATEGIC INSIGHTS
    Provide 3 high-level business recommendations.
    
    ### DATA_BLOCK
    At the very end, provide a JSON block with this exact structure for my charting engine (no other text in this section):
    [
      {"name": "Labor", "value": [number]},
      {"name": "Parts", "value": [number]},
      {"name": "Custom", "value": [number]}
    ]
    
    CRITICAL RULES:
    1. USE MARKDOWN (### for headers, ** for bold).
    2. USE 'PHP' for all currency. No Peso symbols.
    3. NO EMOJIS in the text.
    4. Provide the DATA_BLOCK JSON accurately.
    5. Professional, objective tone.
    `;

    if (OPENROUTER_API_KEY) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Autoworx System",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "arcee-ai/trinity-large-preview:free",
                    "messages": [{ role: "user", content: prompt }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.error("OpenRouter Report Error:", error);
        }
    }

    return chatWithAI([{ role: "user", content: prompt }]);
}
