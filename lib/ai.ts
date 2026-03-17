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
    Your task is to EXCLUSIVELY interpret and summarize the "Release Monitoring Report" based STRICTLY on the provided data.
    
    Data Source (JSON):
    ${dataString}
    
    REQUIRED RULES:
    1. START exactly with: "### RELEASE MONITORING SUMMARY" (This is for UI formatting).
    2. Then follow with: "For this {month} Release Monitoring Report..." (Replacing {month} with the name from the data).
    3. CLAIM TYPE TOTAL: Calculate the sum of all records where insurance is exactly "Personal Claim". Report this as: "the CLAIM TYPE total under INSURANCE / PERSONAL is [Sum]".
    4. COMPANY TOTALS: Identify named companies (e.g., ORIX, MAPFRE, GSIS, etc.). State each company's individual total separately (e.g., "ORIX total is 112,100").
    5. SERVICE TOTALS: Sum and report monthly totals for: BRPAD, AIRCON, ELECTRICAL, and MECHANICAL.
    6. GRAND TOTAL: End with the grand total of all release amounts for that month.
    
    CRITICAL CONSTRAINTS:
    - NO extra explanation, NO assumptions, NO unrelated analysis.
    - NO bullet points in the text.
    - Output must be CONCISE, STRUCTURED, and follow the EXAMPLE FORMAT exactly.
    - Use "PHP" for all currency. No Peso symbols.
    - NO emojis.
    
    EXAMPLE FORMAT:
    "For this {month} Release Monitoring Report, the CLAIM TYPE total under INSURANCE / PERSONAL is PHP 50,000. ORIX total is PHP 112,100. Service totals are BRPAD PHP 150,000, AIRCON PHP 12,100, ELECTRICAL PHP 0, and MECHANICAL PHP 0. The grand total for all releases this month is PHP 162,100."
    
    ### DATA_BLOCK
    Provide a JSON block for charting with this exact structure:
    [
      {"name": "BRPAD", "value": [total]},
      {"name": "Aircon", "value": [total]},
      {"name": "Electrical", "value": [total]},
      {"name": "Mechanical", "value": [total]}
    ]
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
