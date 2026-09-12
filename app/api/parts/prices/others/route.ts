import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * API Route for Price List Others Management
 * GET: Fetch all items
 * POST: Create a new item entry
 * PUT: Update an existing item entry
 * DELETE: Remove an item entry
 */

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("price_list_others")
      .select("*")
      .order("category", { ascending: true })
      .order("item_name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const body = await req.json()
    
    const { data, error } = await supabase
      .from("price_list_others")
      .insert([{
        ...body,
        updated_by: session.user?.email || "System",
        updated_at: new Date().toISOString()
      }])
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create item" }, { status: 500 })
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
      .from("price_list_others")
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
    return NextResponse.json({ error: err.message || "Failed to update item" }, { status: 500 })
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
      .from("price_list_others")
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete item" }, { status: 500 })
  }
}
