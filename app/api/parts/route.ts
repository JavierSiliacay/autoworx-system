import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointment_id")

    if (!appointmentId) {
        return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from("appointment_parts")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })

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

    const body = await request.json()
    const { appointment_id, name, brand, part_type, price, quantity, status, inventory_id } = body

    if (!appointment_id || !name) {
        return NextResponse.json({ error: "Appointment ID and Name are required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: part, error: partError } = await supabase
        .from("appointment_parts")
        .insert({
            appointment_id,
            name,
            brand,
            part_type,
            price: price || 0,
            quantity: quantity || 1,
            status: status || 'pending',
            inventory_id: inventory_id || null
        })
        .select()
        .single()

    if (partError) {
        return NextResponse.json({ error: partError.message }, { status: 500 })
    }

    // If this part came from the warehouse, deduct stock
    if (inventory_id) {
        // Get current quantity
        const { data: invItem } = await supabase
            .from("inventory")
            .select("quantity, name")
            .eq("id", inventory_id)
            .single()

        if (invItem) {
            const newQty = Math.max(0, invItem.quantity - (quantity || 1))

            // Update inventory
            await supabase
                .from("inventory")
                .update({ quantity: newQty })
                .eq("id", inventory_id)

            // Log the movement
            await supabase.from("inventory_logs").insert({
                inventory_id: inventory_id,
                type: "OUT",
                quantity: quantity || 1,
                reason: `Assigned to unit via Parts Room`,
                performed_by: token?.email
            })
        }
    }

    return NextResponse.json(part)
}

export async function PUT(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })

    if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from("appointment_parts")
        .update(updates)
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

    if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
        .from("appointment_parts")
        .delete()
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
