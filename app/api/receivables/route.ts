import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail, isDeveloperEmail, isAccountingEmail } from "@/lib/auth"
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
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const status = searchParams.get("status")

  let query = supabase
    .from("receivables")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  if (from) {
    query = query.gte("date", from)
  }
  if (to) {
    query = query.lte("date", to)
  }
  if (status && status !== "all") {
    query = query.eq("status", status.toUpperCase())
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching receivables:", error)
    return NextResponse.json({ error: "Failed to fetch receivables" }, { status: 500 })
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

    if (!body.client_name?.trim()) {
      return NextResponse.json({ error: "Client Name is required" }, { status: 400 })
    }

    const rawAmount = typeof body.amount === "string" ? parseFloat(body.amount.replace(/,/g, "")) : Number(body.amount)
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ error: "A valid positive Amount is required" }, { status: 400 })
    }

    const status = (body.status || "PENDING").toUpperCase()
    const isPaid = status === "PAID"

    const record = {
      date: body.date || new Date().toISOString().split("T")[0],
      client_name: body.client_name.trim(),
      amount: rawAmount,
      status: isPaid ? "PAID" : "PENDING",
      paid_at: isPaid ? (body.paid_at || new Date().toISOString()) : null,
      remarks: body.remarks?.trim() || null,
      created_by: token.email
    }

    const { data, error } = await supabase
      .from("receivables")
      .insert([record])
      .select()
      .single()

    if (error) {
      console.error("Supabase insert error for receivables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating receivable:", error)
    return NextResponse.json({ error: error?.message || "Failed to create receivable" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing receivable ID" }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {}

    if (body.client_name !== undefined) {
      if (!body.client_name.trim()) {
        return NextResponse.json({ error: "Client Name cannot be empty" }, { status: 400 })
      }
      updatePayload.client_name = body.client_name.trim()
    }

    if (body.amount !== undefined) {
      const rawAmount = typeof body.amount === "string" ? parseFloat(body.amount.replace(/,/g, "")) : Number(body.amount)
      if (isNaN(rawAmount) || rawAmount <= 0) {
        return NextResponse.json({ error: "A valid positive Amount is required" }, { status: 400 })
      }
      updatePayload.amount = rawAmount
    }

    if (body.date !== undefined) {
      updatePayload.date = body.date
    }

    if (body.remarks !== undefined) {
      updatePayload.remarks = body.remarks ? body.remarks.trim() : null
    }

    if (body.status !== undefined) {
      const statusUpper = body.status.toUpperCase()
      updatePayload.status = statusUpper
      if (statusUpper === "PAID") {
        updatePayload.paid_at = body.paid_at || new Date().toISOString()
      } else {
        updatePayload.paid_at = null
      }
    }

    const { data, error } = await supabase
      .from("receivables")
      .update(updatePayload)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase update error for receivables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating receivable:", error)
    return NextResponse.json({ error: error?.message || "Failed to update receivable" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing receivable ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("receivables")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase delete error for receivables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting receivable:", error)
    return NextResponse.json({ error: error?.message || "Failed to delete receivable" }, { status: 500 })
  }
}
