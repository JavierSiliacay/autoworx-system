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
export async function chatWithAI(messages: { role: string; content: string }[], options?: { raw?: boolean }) {
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
                    const content = data.choices[0].message.content;
                    return options?.raw ? content : cleanResponse(content);
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
            const content = data.response;
            return options?.raw ? content : cleanResponse(content);
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
    
    CALCULATION RULES:
    3. CLAIM TYPE TOTAL: Calculate the sum of the 'total' field for all records where 'insurance' is "Personal Claim". 
       Report as: "the CLAIM TYPE total under INSURANCE / PERSONAL is PHP [Sum]".
    4. COMPANY TOTALS: Identify unique companies from the 'insurance' field (e.g., ORIX, MAPFRE, GSIS, etc.) excluding "Personal Claim". 
       For each company, calculate the sum of their 'total' fields. 
       State each company's individual total separately (e.g., "ORIX total is PHP 112,100").
    5. SERVICE TOTALS: Sum the individual 'brpad', 'aircon', 'electrical', and 'mechanical' fields from ALL records. 
       Report as: "Service totals are BRPAD PHP [Sum], AIRCON PHP [Sum], ELECTRICAL PHP [Sum], and MECHANICAL PHP [Sum]."
    6. GRAND TOTAL: Calculate the sum of the 'total' field from ALL records for the month. 
       End with: "The grand total for all releases this month is PHP [Sum]."
    
    CRITICAL CONSTRAINTS:
    - NO extra explanation, NO assumptions, NO unrelated analysis.
    - NO bullet points in the text.
    - Output must be CONCISE, STRUCTURED, and follow the EXAMPLE FORMAT exactly.
    - Use "PHP" for all currency. No Peso symbols.
    - NO emojis.
    
    EXAMPLE FORMAT:
    "For this {month} Release Monitoring Report, the CLAIM TYPE total under INSURANCE / PERSONAL is PHP 50,000. ORIX total is PHP 112,100. PGI total is PHP 45,000. Service totals are BRPAD PHP 150,000, AIRCON PHP 12,100, ELECTRICAL PHP 0, and MECHANICAL PHP 0. The grand total for all releases this month is PHP 207,100."
    
    ### DATA_BLOCK
    Provide a JSON block for charting with the exact SUMMED service totals calculated in step 5:
    [
      {"name": "BRPAD", "value": [total_sum_brpad]},
      {"name": "Aircon", "value": [total_sum_aircon]},
      {"name": "Electrical", "value": [total_sum_electrical]},
      {"name": "Mechanical", "value": [total_sum_mechanical]}
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

    return chatWithAI([{ role: "user", content: prompt }], { raw: true });
}
