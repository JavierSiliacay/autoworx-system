import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function POST(request: Request) {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { appointmentId } = await request.json()

    if (!appointmentId) {
        return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    // 1. Check if it already has an estimate number
    const { data: appointment, error: fetchError } = await supabase
        .from("appointments")
        .select("estimate_number")
        .eq("id", appointmentId)
        .single()

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (appointment.estimate_number) {
        return NextResponse.json({ estimateNumber: appointment.estimate_number })
    }

    // 2. Generate new estimate number
    // Format: YYYYMM-####
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const prefix = `${yearMonth}-`

    // Find the highest sequence for this month
    const { data: latestEstimates, error: searchError } = await supabase
        .from("appointments")
        .select("estimate_number")
        .like("estimate_number", `${prefix}%`)
        .order("estimate_number", { ascending: false })
        .limit(1)

    if (searchError) {
        return NextResponse.json({ error: searchError.message }, { status: 500 })
    }

    let nextSequence = 1
    if (latestEstimates && latestEstimates.length > 0) {
        const lastNum = latestEstimates[0].estimate_number
        const sequencePart = lastNum.split('-')[1]
        nextSequence = parseInt(sequencePart) + 1
    }

    const estimateNumber = `${prefix}${nextSequence.toString().padStart(4, '0')}`

    // 3. Update the appointment
    const { error: updateError } = await supabase
        .from("appointments")
        .update({ estimate_number: estimateNumber })
        .eq("id", appointmentId)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ estimateNumber })
}
