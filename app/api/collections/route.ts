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

  let query = supabase
    .from("collections")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true })

  if (from) {
    query = query.gte("date", from)
  }
  if (to) {
    query = query.lte("date", to)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 })
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

    let receiptNumber = body.receipt_number ? String(body.receipt_number).trim() : ""
    if (!receiptNumber) {
      const { data: allCollections } = await supabase.from("collections").select("receipt_number")
      let maxNum = 0
      if (allCollections && allCollections.length > 0) {
        allCollections.forEach(c => {
          if (c.receipt_number) {
            const match = String(c.receipt_number).match(/\d+/)
            if (match) {
              const num = parseInt(match[0], 10)
              if (!isNaN(num) && num > maxNum) maxNum = num
            }
          }
        })
      }
      receiptNumber = maxNum > 0 ? String(maxNum + 1) : "785"
    }

    const { data, error } = await supabase
      .from("collections")
      .insert([{
        date: body.date,
        customer_name: body.customer_name,
        address: body.address,
        unit: body.unit,
        plate: body.plate,
        receipt_type: body.receipt_type,
        receipt_number: receiptNumber,
        description: body.description,
        payment_type: body.payment_type,
        total_amount: parseFloat(body.total_amount),
        cashier_name: body.cashier_name,
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
    console.error("Error creating collection:", error)
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
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
      return NextResponse.json({ error: "Missing collection ID" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("collections")
      .update({
        date: body.date,
        customer_name: body.customer_name,
        address: body.address,
        unit: body.unit,
        plate: body.plate,
        receipt_type: body.receipt_type,
        receipt_number: body.receipt_number,
        description: body.description,
        payment_type: body.payment_type,
        total_amount: parseFloat(body.total_amount),
        cashier_name: body.cashier_name,
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
    console.error("Error updating collection:", error)
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 })
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
      return NextResponse.json({ error: "Missing collection ID" }, { status: 400 })
    }

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting collection:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
