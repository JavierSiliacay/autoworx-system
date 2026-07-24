import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail, isDeveloperEmail, isAccountingEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  let query = supabase
    .from("expenses")
    .select("*")
    .order("date_issued", { ascending: false })
    .order("created_at", { ascending: false })

  if (from) {
    query = query.gte("date_issued", from)
  }
  if (to) {
    query = query.lte("date_issued", to)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("expenses")
      .insert([{
        category: body.category,
        description: body.description,
        date_issued: body.date_issued,
        charge_to: body.charge_to || null,
        invoice_number: body.invoice_number || null,
        supplier_name: body.supplier_name || null,
        unit_vehicle: body.unit_vehicle || null,
        plate_number: body.plate_number || null,
        type_of_payment: body.type_of_payment || null,
        total_amount: parseFloat(body.total_amount),
        remarks: body.remarks || null,
        created_by: token.email
      }])
      .select()
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
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
      return NextResponse.json({ error: "Missing expense ID" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("expenses")
      .update({
        category: body.category,
        description: body.description,
        date_issued: body.date_issued,
        charge_to: body.charge_to || null,
        invoice_number: body.invoice_number || null,
        supplier_name: body.supplier_name || null,
        unit_vehicle: body.unit_vehicle || null,
        plate_number: body.plate_number || null,
        type_of_payment: body.type_of_payment || null,
        total_amount: parseFloat(body.total_amount),
        remarks: body.remarks || null
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
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
      return NextResponse.json({ error: "Missing expense ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
