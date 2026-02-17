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
