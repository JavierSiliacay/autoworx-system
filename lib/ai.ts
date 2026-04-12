const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
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
 * Creates an async generator to stream tokens from OpenRouter or Ollama
 */
export async function* chatWithAIStream(messages: { role: string; content: string; image?: string }[]) {
    const formattedMessages = messages.map(m => {
        if (m.image) {
            const contentArray: any[] = [
                { type: "image_url", image_url: { url: m.image } }
            ];

            // Text after image
            if (m.content && m.content.trim() !== "") {
                contentArray.push({ type: "text", text: m.content });
            } else {
                contentArray.push({ type: "text", text: "Please analyze the damage or contents of this uploaded image." });
            }

            return { role: m.role, content: contentArray };
        }
        return { role: m.role, content: m.content };
    });

    if (HF_TOKEN) {
        try {
            const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemma-4-31B-it:novita",
                    "messages": formattedMessages,
                    "stream": true
                })
            });

            if (response.ok && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const dataStr = line.slice(6).trim();
                            if (dataStr === "[DONE]") return;
                            try {
                                const data = JSON.parse(dataStr);
                                const content = data.choices?.[0]?.delta?.content;
                                if (content) {
                                    // Strip markdown symbols for a clean "car-owner-friendly" response
                                    const cleanContent = content.replace(/\*/g, "").replace(/#/g, "");
                                    yield cleanContent;
                                }
                            } catch (e) { }
                        }
                    }
                }
                return;
            } else {
                const errorText = await response.text();
                console.error("HuggingFace Router Stream Error Status:", response.status);
                console.error("HuggingFace Router Stream Error Body:", errorText);
            }
        } catch (error) {
            console.error("HuggingFace Streaming Error:", error);
        }
    }

    // Fallback streaming for local Ollama
    try {
        const prompt = messages[messages.length - 1].content;
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: true
            })
        });

        if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) yield data.response;
                        } catch (e) { }
                    }
                }
            }
            return;
        }
    } catch (error) {
        console.error("Ollama Streaming Error:", error);
    }
    throw new Error("No AI providers available for streaming.");
}

/**
 * Generic function to chat with AI using OpenRouter (primary) or Ollama (fallback)
 */
export async function chatWithAI(messages: { role: string; content: string; image?: string }[], options?: { raw?: boolean }) {

    const formattedMessages = messages.map(m => {
        if (m.image) {
            const contentArray: any[] = [];

            // Text first, then image
            if (m.content && m.content.trim() !== "") {
                contentArray.push({ type: "text", text: m.content });
            } else {
                contentArray.push({ type: "text", text: "Please analyze the damage or contents of this uploaded image." });
            }

            contentArray.push({
                type: "image_url",
                image_url: { url: m.image }
            });

            return {
                role: m.role,
                content: contentArray
            };
        }
        return {
            role: m.role,
            content: m.content
        };
    });
    // 1. Try Hugging Face
    if (HF_TOKEN) {
        try {
            const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemma-4-31B-it:novita",
                    "messages": formattedMessages
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
                console.error("HuggingFace API error:", errorData);
            }
        } catch (error) {
            console.error("HuggingFace Fetch Error:", error);
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
    3. REVENUE BY CLAIM SOURCE: Using the exactly provided 'claimTypeSummary' object, output a line item for EVERY explicit category strictly as provided (e.g., ORIX, STANDARD, UNKNOWN INSURANCE, PERSONAL CLAIM, etc). Include the exact record count within the output string for each.
    4. SERVICE TOTALS: Read the exactly provided 'serviceSummary' object and output lines for each service (BRPAD, Aircon, Electrical, Mechanical). DO NOT execute math yourself.
    5. GRAND TOTAL: Directly output the provided 'exactGrandTotal'. DO NOT sum up the individual records yourself. 
    
    CRITICAL CONSTRAINTS:
    - NO extra explanation, NO assumptions, NO unrelated analysis.
    - YOU MUST FORMAT EVERYTHING AS A STRICT MARKDOWN LIST using exactly "- **Key**: Value" format.
    - The UI parser explicitly looks for "- **" strings to build a beautiful data table.
    - Use "PHP" for all currency. No Peso symbols.
    
    EXAMPLE FORMAT:
    - **Report Period**: {month} Release Monitoring
    - **Personal Claims**: PHP 50,000 (5 records)
    - **Insurance Claims**: PHP 157,100 (2 records)
    - **ORIX**: PHP 112,100
    - **PGI**: PHP 45,000
    - **Mechanical Services**: PHP 0
    - **BRPAD Services**: PHP 150,000
    - **Aircon Services**: PHP 12,100
    - **Electrical Services**: PHP 0
    - **Grand Total**: PHP 207,100
    
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
