import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { generateAIReport } from "@/lib/ai"

export async function POST(request: Request) {
    try {
        const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
        if (!isAuthorizedAdminEmail(token?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { month, year } = body

        if (!month || !year) {
            return NextResponse.json({ error: "Month and Year are required" }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch all history - we will filter in JS for maximum parity with the Release Monitoring UI logic
        // which uses (completed_at || original_created_at)
        const { data: history, error } = await supabase
            .from("appointment_history")
            .select("*")
            .eq("is_backjob", false) // Exclude back-jobs as per admin requirement

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!history || history.length === 0) {
            return NextResponse.json({ error: "No data found" }, { status: 404 })
        }

        // Filter by the selected month/year using the same logic as the frontend
        const filteredHistory = history.filter(item => {
            // Exclude deleted items (Trash) to match the Monitoring Report
            if (item.deleted_at !== null && item.deleted_at !== undefined) return false

            const dateStr = item.completed_at || item.original_created_at
            if (!dateStr) return false
            const d = new Date(dateStr)
            return d.getFullYear() === year && (d.getMonth() + 1) === month
        })

        if (filteredHistory.length === 0) {
            return NextResponse.json({ error: "No records found for the selected period." }, { status: 404 })
        }

        // Process data for AI (minimize tokens)
        const reportData = filteredHistory.map(item => {
            const costing = item.costing || { total: 0, items: [] }
            let brpad = 0, aircon = 0, electrical = 0, mechanical = 0

            // Exact parity with getCategorizedCosts in release-monitoring.tsx
            if (costing.gatepass_breakdown) {
                const gb = costing.gatepass_breakdown
                brpad = Number(gb.brpad) || 0
                aircon = Number(gb.aircon) || 0
                electrical = Number(gb.electrical) || 0
                mechanical = Number(gb.mechanical) || 0
            } else if (costing.items) {
                costing.items.forEach((i: any) => {
                    const cat = i.category || ""
                    if (cat === "Aircon") aircon += i.total || 0
                    else if (cat === "Electrical") electrical += i.total || 0
                    else if (cat === "Mechanical Works") mechanical += i.total || 0
                    else brpad += i.total || 0
                })
            }

            return {
                insurance: item.insurance || "Personal Claim",
                total: costing.total || 0,
                brpad,
                aircon,
                electrical,
                mechanical,
                vehicle: `${item.vehicle_make} ${item.vehicle_model}`,
                date: item.completed_at || item.original_created_at
            }
        })

        const dataString = JSON.stringify({
            month: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
            year: year,
            records: reportData
        }, null, 2)

        // Generate AI Summary
        const aiResponse = await generateAIReport(dataString)

        return NextResponse.json({
            report: aiResponse,
            count: history.length,
            period: `${month}/${year}`,
            data: reportData // Include data for Excel export
        })

    } catch (err) {
        console.error("AI Route Error:", err)
        const errorMessage = err instanceof Error ? err.message : "Internal Server Error"
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
