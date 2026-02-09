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
                    "model": "openrouter/pony-alpha",
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
 * Specific function for generating business reports
 */
export async function generateAIReport(dataString: string) {
    const prompt = `
    You are the Senior Sales Analyst for Autoworx Repairs.
    Provide a DIRECT, DATA-DRIVEN, and CONCISE monthly sales report. 
    Focus strictly on performance metrics and numbers.
    
    Data:
    ${dataString}
    
    REQUIRED STRUCTURE (Strictly follow this):
    
    FINANCIAL SUMMARY
    - Total Gross Revenue: [₱ amount]
    - Total Labor Income: [₱ amount]
    - Total Parts/Materials Sales: [₱ amount]
    - Average Revenue Per Job: [₱ amount]
    
    SERVICE PERFORMANCE
    - Most Profitable Service: [Service Name]
    - Top 3 Highly Requested Services (with booking counts)
    
    OPERATIONAL TRENDS
    - Peak Business Day: [Day of week]
    - Total Jobs Completed: [Count]
    
    STRATEGIC INSIGHTS
    - Provide 3 bullet-point business recommendations based strictly on the numbers.
    
    CRITICAL RULES:
    1. No markdown symbols (No #, no **, no *).
    2. All currency must be in Philippine Peso (₱).
    3. Be brief. Do not use conversational filler like "I hope this helps" or "Here is your report".
    4. Direct to the point.
    `;

    return chatWithAI([{ role: "user", content: prompt }]);
}
