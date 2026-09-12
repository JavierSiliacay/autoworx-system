import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * API Route for Parts Prices Management
 * GET: Fetch all prices
 * POST: Create a new price entry
 * PUT: Update an existing price entry
 * DELETE: Remove a price entry
 */

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("parts_prices")
      .select("*")
      .order("brand", { ascending: true })
      .order("category", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch prices" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const body = await req.json()
    
    const { data, error } = await supabase
      .from("parts_prices")
      .insert([{
        ...body,
        updated_by: session.user?.email || "System",
        updated_at: new Date().toISOString()
      }])
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create price" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { id, ...updates } = await req.json()
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const { data, error } = await supabase
      .from("parts_prices")
      .update({
        ...updates,
        updated_by: session.user?.email || "System",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update price" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase
      .from("parts_prices")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete price" }, { status: 500 })
  }
}
