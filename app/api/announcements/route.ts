import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from("admin_announcements")
        .select("*")
        .eq("is_active", true)
        .neq("status", "Archived")
        .order("created_at", { ascending: false })
        .limit(5)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { content, authorName } = body

    if (!content) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const { data, error } = await supabase
        .from("admin_announcements")
        .insert({
            content,
            author_name: authorName || "Admin",
            author_email: token?.email || "unknown",
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase
        .from("admin_announcements")
        .update({ is_active: false })
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
        const userEmail = token?.email as string
        
        if (!isAuthorizedAdminEmail(userEmail)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = await createClient()
        const body = await request.json()
        const { id, status } = body

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        const updates: any = {}
        if (status !== undefined) {
            updates.status = status
            if (status === 'Archived') {
                updates.archived_at = new Date().toISOString()
            }
        }

        // Apply update to announcement
        const { data, error } = await supabase
            .from("admin_announcements")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If archiving, transfer to Developer Tasks
        if (status === 'Archived' && data) {
            // Avoid duplicate transfers by checking if a task with this exact description already exists as Archived
            const { data: existingTask } = await supabase
                .from("developer_tasks")
                .select("id")
                .eq("description", data.content)
                .eq("status", "Archived")
                .maybeSingle()
            
            if (!existingTask) {
                await supabase.from("developer_tasks").insert({
                    title: `Announcement: From ${data.author_name}`,
                    description: data.content,
                    type: "Other",
                    category: data.category || "System Enhancements",
                    priority: "Low",
                    status: "Archived",
                    requested_by: data.author_email,
                    archived_at: new Date().toISOString()
                })
            }
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error in PUT /api/announcements:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
