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
            .from("inventory")
            .select("*")
            .order("name", { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data || [])
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const supabase = createAdminClient()

        const { data: item, error: itemError } = await supabase
            .from("inventory")
            .insert(body)
            .select()
            .single()

        if (itemError) {
            return NextResponse.json({ error: itemError.message }, { status: 500 })
        }

        // Log the movement
        await supabase.from("inventory_logs").insert({
            inventory_id: item.id,
            type: "IN",
            quantity: item.quantity,
            reason: "Initial stock entry",
            performed_by: token?.email
        })

        return NextResponse.json(item)
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...updates } = body
        const supabase = createAdminClient()

        // Get old quantity for logging
        const { data: oldData } = await supabase.from("inventory").select("quantity").eq("id", id).single()

        const { data: item, error: itemError } = await supabase
            .from("inventory")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (itemError) {
            return NextResponse.json({ error: itemError.message }, { status: 500 })
        }

        // Log update if quantity changed
        if (updates.quantity !== undefined && oldData && updates.quantity !== oldData.quantity) {
            const diff = updates.quantity - oldData.quantity
            await supabase.from("inventory_logs").insert({
                inventory_id: id,
                type: diff > 0 ? "IN" : "OUT",
                quantity: Math.abs(diff),
                reason: "Manual stock adjustment",
                performed_by: token?.email
            })
        }

        return NextResponse.json(item)
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { error } = await supabase.from("inventory").delete().eq("id", id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
