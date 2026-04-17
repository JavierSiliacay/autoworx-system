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
        const { prompt, model } = body

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        const requestedModel = model || "black-forest-labs/FLUX.1-schnell";
        const HF_TOKEN = process.env.HF_TOKEN;

        if (!HF_TOKEN) {
            return NextResponse.json({ error: "HF_TOKEN not configured in environment variables" }, { status: 500 })
        }

        const response = await fetch(`https://api-inference.huggingface.co/models/${requestedModel}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt })
        });

        if (!response.ok) {
            let errorText = "Unknown error";
            try {
                const errorData = await response.json();
                errorText = JSON.stringify(errorData);
            } catch (e) {
                errorText = response.statusText;
            }
            console.error("HuggingFace Image API error:", errorText);
            return NextResponse.json({ error: "Image Generator Error: " + errorText }, { status: response.status })
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Convert to WebP using sharp for better compression
        const webpBuffer = await import('sharp').then(sharp => 
            sharp.default(buffer)
                .resize({ width: 1024, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer()
        );

        const base64 = webpBuffer.toString('base64');
        const contentType = "image/webp"; // Force webp content type

        return NextResponse.json({ image: `data:${contentType};base64,${base64}` })

    } catch (err) {
        console.error("Image Test Route Error:", err)
        const errorMessage = err instanceof Error ? err.message : "Internal Server Error"
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
