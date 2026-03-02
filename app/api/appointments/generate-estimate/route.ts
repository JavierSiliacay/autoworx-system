import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function POST(request: Request) {
    try {
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
        // Format: YYYYMM-#### (Monthly Sequence)
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
        const prefix = `${yearMonth}-`

        // Find the absolute highest sequence generated so far across all records
        // This ensures the sequence number is globally continuous and doesn't reset per month
        const { data: allEstimates, error: searchError } = await supabase
            .from("appointments")
            .select("estimate_number")
            .not("estimate_number", "is", null)

        if (searchError) {
            return NextResponse.json({ error: searchError.message }, { status: 500 })
        }

        const { data: allHistoryEstimates, error: historyError } = await supabase
            .from("appointment_history")
            .select("estimate_number")
            .not("estimate_number", "is", null)

        if (historyError) {
            // Log error but continue, assuming history might be empty or not critical if query fails
            console.error("Error fetching history estimates:", historyError)
        }

        let maxSequence = 0
        const parseSequence = (est: string | null) => {
            if (!est) return 0;
            const parts = est.split('-');
            if (parts.length === 2) {
                const seq = parseInt(parts[1], 10);
                return isNaN(seq) ? 0 : seq;
            }
            return 0;
        }

        if (allEstimates) {
            for (const row of allEstimates) {
                maxSequence = Math.max(maxSequence, parseSequence(row.estimate_number));
            }
        }

        if (allHistoryEstimates) {
            for (const row of allHistoryEstimates) {
                maxSequence = Math.max(maxSequence, parseSequence(row.estimate_number));
            }
        }

        const nextSequence = maxSequence + 1
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
    } catch (error) {
        console.error("Error in POST generate-estimate:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
