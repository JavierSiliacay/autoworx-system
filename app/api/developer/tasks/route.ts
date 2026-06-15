import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail, isDeveloperEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("developer_tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/developer/tasks:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    
    const { title, description, type, category, priority } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("developer_tasks")
      .insert({
        title,
        description,
        type: type || 'Other',
        category: category || 'System Enhancements',
        priority: priority || 'Medium',
        status: 'Pending',
        created_by: token?.email
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/developer/tasks:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const userEmail = token?.email as string
    
    if (!isAuthorizedAdminEmail(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { id, status, title, description, type, category, priority } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const updates: any = {}
    if (status !== undefined) {
      updates.status = status
      // Mapping the old 'Ongoing' / 'Done' just in case, but using new statuses natively
      if (status === 'Ongoing' || status === 'Ongoing Fix') updates.started_at = new Date().toISOString()
      if (status === 'For Testing') updates.testing_at = new Date().toISOString()
      if (status === 'Done' || status === 'Completed') updates.completed_at = new Date().toISOString()
      if (status === 'Archived') updates.archived_at = new Date().toISOString()
      if (status === 'Pending') {
          updates.started_at = null
          updates.testing_at = null
          updates.completed_at = null
          updates.archived_at = null
      }
    }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (type !== undefined) updates.type = type
    if (category !== undefined) updates.category = category
    if (priority !== undefined) updates.priority = priority

    const { data, error } = await supabase
      .from("developer_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/developer/tasks:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
    try {
      const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
      if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
  
      const supabase = await createAdminClient()
      const body = await request.json()
      const { id } = body
  
      if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
      }
  
      const { error } = await supabase
        .from("developer_tasks")
        .delete()
        .eq("id", id)
  
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error in DELETE /api/developer/tasks:", error)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
