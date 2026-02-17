import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { filename, htmlContent, isPdfData } = await request.json()

        if (!filename) {
            return NextResponse.json({ error: "Filename is required" }, { status: 400 })
        }

        // The specified network/local directory
        const baseDirectory = "\\\\ADMIN\\autoworx repair estimate\\REPAIR ESTIMATE 2026"

        // Ensure filename is safe and has an extension if not provided
        let safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_')
        if (!safeFilename.toLowerCase().endsWith('.pdf') && !safeFilename.toLowerCase().endsWith('.html')) {
            safeFilename += isPdfData ? '.pdf' : '.html'
        }

        // Check if directory exists
        if (!fs.existsSync(baseDirectory)) {
            // If it doesn't exist, we can't save to the network path.
            // For local development where the path might not exist, we'll return an error
            // so the user knows they need to ensure the ADMIN share is mapped or the folder exists.
            return NextResponse.json({
                error: `Directory not found or inaccessible: ${baseDirectory}. Please ensure the network path is accessible.`,
                path: baseDirectory
            }, { status: 400 })
        }

        const filePath = path.join(baseDirectory, safeFilename)

        if (isPdfData) {
            // If it's base64 PDF data from the client
            const buffer = Buffer.from(htmlContent.split(',')[1], 'base64')
            fs.writeFileSync(filePath, buffer)
        } else {
            // Save as HTML if we don't have a PDF generator on the server
            fs.writeFileSync(filePath, htmlContent, "utf-8")
        }

        return NextResponse.json({
            success: true,
            message: `File saved successfully to ${filePath}`,
            savedPath: filePath
        })

    } catch (error: any) {
        console.error("Error in save-file API:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
