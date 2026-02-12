import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get("service")
    const appointmentId = searchParams.get("appointmentId")

    const supabase = await createClient()

    let query = supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })

    if (service) {
        query = query.eq("service", service)
    }

    if (appointmentId) {
        query = query.eq("appointment_id", appointmentId)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const body = await request.json()

    const { appointmentId, rating, comment, customerName, service } = body

    if (!appointmentId || !rating || !service) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if feedback already exists for this appointment
    const { data: existing } = await supabase
        .from("feedback")
        .select("id")
        .eq("appointment_id", appointmentId)
        .single()

    if (existing) {
        return NextResponse.json({ error: "Feedback already submitted for this appointment" }, { status: 400 })
    }

    const { data, error } = await supabase
        .from("feedback")
        .insert({
            appointment_id: appointmentId,
            rating,
            comment,
            customer_name: customerName,
            service
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
