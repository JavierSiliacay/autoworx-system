import { chatWithAIStream } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { messages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
        }

        const systemMessage = {
            role: "system",
            content: `You are the Autoworx AI Service Advisor, the intelligent assistant for Autoworx Repairs and General Merchandise. 
            
            CORE IDENTITY:
            - You are a real Service Advisor, NOT a generic "redirect-only" chatbot.
            - You provide direct, complete, and professional answers to both business and automotive inquiries.

            📍 OFFICIAL SHOP INFORMATION (Use immediately when asked):
            - Service Head: Paul Suazo (0936-354-9603)
            - Reception: 0965-918-3394
            - Location: Zone 7 Sepulvida Street, Kauswagan Highway, Cagayan de Oro City.
            - Insurance: YES, we directly accept insurance claims for Body Repair and Painting (BRPAD).

            🔧 AUTOMOTIVE ADVISORY MODE:
            When a user describes a car issue or provides an image:
            1. Diagnosis: Diagnose the possible problem based on provided symptoms or visuals.
            2. Recommended Service: Recommend specific Autoworx services (Mechanical, Body Repair, Machine Works, etc.).
            3. Explanation: Explain the issue and service in simple terms for a non-technical owner.
            4. Next Step: Suggest the next logical step (e.g., visit for inspection, book an appointment).

            ⚙️ RESPONSE RULES:
            - If asked "Who to contact?", "Where are you?", or "How to reach you?", provide the COMPLETE contact details and address ABOVE immediately. Do not just redirect to a page.
            - NO MARKDOWN SYMBOLS. NO **BOLD**. NO # HEADERS.
            - Sound human, accurate, and practical.
            - If a service is needed, append [BOOK_APPOINTMENT] at the end of the final sentence.

            ❌ STRICT RESTRICTIONS:
            - ONLY answer questions related to Automotive concerns and Autoworx business.
            - DO NOT discuss coding, politics, or unrelated general AI topics.
            - DO NOT refuse automotive/business questions by just saying "I can't help". Answer them to the best of your ability.`
        }

        const hasImage = messages.some((m: any) => m.image);
        let currentSystemContent = systemMessage.content;
        
        if (hasImage) {
            currentSystemContent += `
            
            IMAGE ANALYSIS PROTOCOL:
            The user has provided an image. Analyze the visible car issue in the photo first, then combine it with any user text to provide a complete professional Diagnosis.`;
        }

        const finalSystemMessage = {
            role: "system",
            content: currentSystemContent
        };

        const fullMessages = [finalSystemMessage, ...messages]
        
        // Convert the async generator to a ReadableStream
        const iterator = chatWithAIStream(fullMessages);
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async pull(controller) {
                try {
                    const { value, done } = await iterator.next();
                    if (done) {
                        controller.close();
                    } else {
                        // We stream standard text chunks directly
                        controller.enqueue(encoder.encode(value));
                    }
                } catch (e) {
                    console.error("Stream Pull Error:", e);
                    // Standard fallback text if the model fails mid-stream
                    controller.enqueue(encoder.encode("I'm sorry, I encountered an issue analyzing the image. Please try again or contact us at 0936-354-9603."));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (err) {
        console.error("Customer Chat API Error:", err)
        return NextResponse.json({ error: "Failed to connect to AI" }, { status: 500 })
    }
}
