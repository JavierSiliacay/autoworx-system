import { createAdminClient } from "@/lib/supabase/admin"
import { isDeveloperEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })

    console.log("Recommendations GET request from:", token?.email)

    if (!isDeveloperEmail(token?.email)) {
        console.warn("Unauthorized recommendations access attempt:", token?.email)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from("developer_recommendations")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Supabase load error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Successfully loaded ${data?.length || 0} recommendations`)
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, type, message } = body

        if (!type || !message) {
            return NextResponse.json({ error: "Type and message are required" }, { status: 400 })
        }

        const supabase = createAdminClient()

        const { error } = await supabase
            .from("developer_recommendations")
            .insert({
                name: name || "Anonymous",
                email: email || "N/A",
                type,
                message
            })

        if (error) {
            console.error("Supabase error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })

    if (!isDeveloperEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from("developer_recommendations")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })

    if (!isDeveloperEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
        .from("developer_recommendations")
        .delete()
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
