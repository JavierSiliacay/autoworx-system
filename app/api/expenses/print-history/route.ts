import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail, isDeveloperEmail, isAccountingEmail, getUserIdentity } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const reportPeriod = searchParams.get("report_period")
  const periodValue = searchParams.get("period_value")
  const viewMode = searchParams.get("view_mode")

  let query = supabase
    .from("expense_print_history")
    .select("*")
    .order("created_at", { ascending: false })

  if (reportPeriod) {
    query = query.eq("report_period", reportPeriod)
  }
  if (periodValue) {
    query = query.eq("period_value", periodValue)
  }
  if (viewMode) {
    query = query.eq("view_mode", viewMode)
  }

  // Limit to recent 50 logs
  query = query.limit(50)

  const { data, error } = await query

  if (error) {
    console.error("Error fetching expense print history:", error)
    return NextResponse.json({ error: "Failed to fetch print history" }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.report_period || !body.period_value) {
      return NextResponse.json({ error: "Missing report period or period value" }, { status: 400 })
    }

    const identity = getUserIdentity(token.email)
    const displayName = (token.name as string) || identity.name || token.email

    const newRecord = {
      printed_by: displayName,
      report_period: body.report_period,
      period_value: body.period_value,
      period_label: body.period_label || body.period_value,
      view_mode: body.view_mode || "detailed",
      category_filter: body.category_filter || "all",
      payment_filter: body.payment_filter || "all",
      total_amount: Number(body.total_amount) || 0,
      records_count: Number(body.records_count) || 0,
      snapshot_data: body.snapshot_data || null,
      reprint_count: 0
    }

    const { data, error } = await supabase
      .from("expense_print_history")
      .insert([newRecord])
      .select()
      .single()

    if (error) {
      console.error("Error creating expense print history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in print history POST:", error)
    return NextResponse.json({ error: error?.message || "Failed to log print" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing print log ID" }, { status: 400 })
    }

    // Get current record to increment reprint_count
    const { data: current, error: fetchErr } = await supabase
      .from("expense_print_history")
      .select("reprint_count")
      .eq("id", body.id)
      .single()

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 404 })
    }

    const nextCount = (current?.reprint_count || 0) + 1

    const { data, error } = await supabase
      .from("expense_print_history")
      .update({
        reprint_count: nextCount,
        last_reprinted_at: new Date().toISOString()
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update reprint" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !isDeveloperEmail(token.email)) {
    return NextResponse.json({ error: "Only developers can delete print history records." }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing print log ID" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("expense_print_history")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete print log" }, { status: 500 })
  }
}

