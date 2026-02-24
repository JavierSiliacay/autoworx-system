import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse, NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("inventory_categories")
            .select("*")
            .order("name", { ascending: true })

        if (error) {
            console.error("Database error fetching categories:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data || [])
    } catch (e: any) {
        console.error("Internal Server Error in categories GET:", e)
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name } = await request.json()
        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("inventory_categories")
            .insert({ name })
            .select()
            .single()

        if (error) {
            console.error("Database error saving category:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e: any) {
        console.error("Internal Server Error in categories POST:", e)
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
