import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * API Route for Price List Items Management
 * GET: Fetch all items
 * POST: Create a new item entry
 * PUT: Update an existing item entry
 * DELETE: Remove an item entry
 */

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("price_list_items")
    .select("*")
    .order("category", { ascending: true })
    .order("item_name", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()
  
  const { data, error } = await supabase
    .from("price_list_items")
    .insert([{
      ...body,
      updated_by: session.user?.email,
      updated_at: new Date().toISOString()
    }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const { id, ...updates } = await req.json()
  
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { data, error } = await supabase
    .from("price_list_items")
    .update({
      ...updates,
      updated_by: session.user?.email,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from("price_list_items")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
