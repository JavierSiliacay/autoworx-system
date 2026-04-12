import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"



export async function POST(request: Request) {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { prompt, model, mediaData } = body

        if (!prompt && !mediaData) {
            return NextResponse.json({ error: "Prompt or media is required" }, { status: 400 })
        }

        const requestedModel = model || "google/gemma-4-31B-it:novita";

        const HF_TOKEN = process.env.HF_TOKEN;

        if (!HF_TOKEN) {
            return NextResponse.json({ error: "HF_TOKEN not configured in environment variables" }, { status: 500 })
        }

        const contentPayload: any[] = []
        if (prompt) {
            contentPayload.push({ type: "text", text: prompt })
        }
        
        if (mediaData) {
            contentPayload.push({
                type: "image_url",
                image_url: {
                    url: mediaData
                }
            })
        }

        const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": requestedModel,
                "messages": [{ role: "user", content: contentPayload }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("HuggingFace Router API error:", errorData);
            return NextResponse.json({ error: "HuggingFace Error: " + JSON.stringify(errorData) }, { status: response.status })
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "No response";

        return NextResponse.json({ result: content })

    } catch (err) {
        console.error("AI Test Route Error:", err)
        const errorMessage = err instanceof Error ? err.message : "Internal Server Error"
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
