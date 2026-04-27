import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    // Basic authorization to prevent public access
    // This expects a header like: Authorization: Bearer <CRON_SECRET>
    // Vercel automatically sends this header if you configure CRON_SECRET in environment variables.
    const authHeader = request.headers.get("authorization")
    
    // In a real production setup, you'd verify this against process.env.CRON_SECRET
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const supabase = await createClient()

    // 1. Calculate the date 14 days ago
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const cutoffDateString = fourteenDaysAgo.toISOString()

    try {
        const eligibleServices = [
            "General Overhauling",
            "Engine & Transmission",
            "Under Chassis",
            "Mechanical Services",
            "Preventive Maintenance"
        ]

        // 2. Fetch all appointments from history that were archived more than 14 days ago
        // AND match the specific mechanical services requested
        const { data: pastAppointments, error: historyError } = await supabase
            .from("appointment_history")
            .select("id, name, service, tracking_code")
            .lt("archived_at", cutoffDateString) // "archived_at" denotes when it was released
            .in("service", eligibleServices)

        if (historyError) throw historyError

        if (!pastAppointments || pastAppointments.length === 0) {
            return NextResponse.json({ message: "No eligible appointments found for auto-rating." })
        }

        // 3. For each eligible appointment, check if feedback already exists
        const autoRatedIds = []

        for (const appointment of pastAppointments) {
            const { data: existingFeedback } = await supabase
                .from("feedback")
                .select("id")
                .eq("appointment_id", appointment.id)
                .single()

            if (!existingFeedback) {
                // 4. If no feedback exists, generate an automatic 5-star rating
                const { error: insertError } = await supabase
                    .from("feedback")
                    .insert({
                        appointment_id: appointment.id,
                        rating: 5,
                        comment: "Auto-rated by system: No customer feedback provided after 14 days of release.",
                        customer_name: appointment.name || "Customer",
                        service: appointment.service || "General Service",
                        // Optional: you could add an 'is_auto_generated: true' column in the future
                    })

                if (!insertError) {
                    autoRatedIds.push(appointment.tracking_code)
                } else {
                    console.error("Error auto-rating appointment:", appointment.id, insertError)
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully auto-rated ${autoRatedIds.length} appointments.`,
            processed_tracking_codes: autoRatedIds 
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
