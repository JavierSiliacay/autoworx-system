import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getToken } from "next-auth/jwt"
import { isAuthorizedAdminEmail, isDeveloperEmail, isAccountingEmail } from "@/lib/auth"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (id) {
        const { data, error } = await supabase
            .from("purchasing")
            .select("*")
            .eq("id", id)
            .single()

        if (error) throw error
        return NextResponse.json(data)
    }

    const { data, error } = await supabase
      .from("purchasing")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { 
      type, item_description, supplier_name, status, date_purchased, remarks,
      unit_model, plate_number, vehicle_owner, customer_type, insurance_company_name, pr_number, amount, items
    } = body

    if (!type || !item_description || !date_purchased) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("purchasing")
      .insert([
        {
          type,
          item_description,
          supplier_name,
          status: status || 'Pending',
          date_purchased,
          remarks,
          unit_model,
          plate_number,
          vehicle_owner,
          customer_type,
          insurance_company_name,
          pr_number,
          amount,
          items: items || [],
          is_po_synced: false,
          created_by: token.email
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const body = await req.json()
    
    const { data, error } = await supabase
      .from("purchasing")
      .update(body)
      .eq("id", id)
      .select()

    if (error) throw error

    // ONE-WAY SYNC: Automatically push updates to linked expense (if any exists)
    if (data && data.length > 0) {
      const updatedPurchase = data[0]
      const updatePayload: any = {}
      
      if (updatedPurchase.item_description !== undefined) updatePayload.description = updatedPurchase.item_description
      if (updatedPurchase.amount !== undefined) updatePayload.total_amount = updatedPurchase.amount
      if (updatedPurchase.supplier_name !== undefined) updatePayload.supplier_name = updatedPurchase.supplier_name
      if (updatedPurchase.remarks !== undefined) updatePayload.remarks = updatedPurchase.remarks
      if (updatedPurchase.vehicle_owner !== undefined) updatePayload.charge_to = updatedPurchase.vehicle_owner
      if (updatedPurchase.unit_model !== undefined) updatePayload.unit_vehicle = updatedPurchase.unit_model
      if (updatedPurchase.plate_number !== undefined) updatePayload.plate_number = updatedPurchase.plate_number

      if (Object.keys(updatePayload).length > 0) {
        const { error: expenseError } = await supabase
          .from("expenses")
          .update(updatePayload)
          .eq("purchasing_id", updatedPurchase.id)
          
        if (expenseError) {
          console.error("Failed to sync purchasing update to expense:", expenseError)
        }
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.email || !(isAuthorizedAdminEmail(token.email) || isDeveloperEmail(token.email) || isAccountingEmail(token.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("purchasing")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Purchasing item deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
