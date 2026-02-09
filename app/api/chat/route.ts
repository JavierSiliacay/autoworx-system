import { chatWithAI } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const { messages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
        }

        // Add system message if it's the start
        const systemMessage = {
            role: "system",
            content: `You are the AutoWorx Virtual AI Assistant. You are friendly, helpful, and speak like a real human. 
            Your goal is to help users with repair status and car questions.
            CRITICAL: Do NOT use markdown symbols. No asterisks (**), no hashes (#), no bullet points with symbols.
            Just use plain text, natural paragraphs, and clear sentences. Communicate like a helpful person, not a bot writing code.`
        }

        const fullMessages = [systemMessage, ...messages]

        const aiResponse = await chatWithAI(fullMessages)

        return NextResponse.json({ message: aiResponse })

    } catch (err) {
        console.error("Chat API Error:", err)
        return NextResponse.json({ error: "Failed to connect to AI" }, { status: 500 })
    }
}
