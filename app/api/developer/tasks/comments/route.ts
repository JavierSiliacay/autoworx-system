import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/developer/tasks/comments:", error)
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
    
    const { taskId, content } = body

    if (!taskId || !content) {
      return NextResponse.json({ error: "Task ID and content are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        content,
        author_email: token?.email
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/developer/tasks/comments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
    try {
      const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
      if (!isAuthorizedAdminEmail(token?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
  
      const supabase = await createClient()
      const body = await request.json()
      const { id } = body
  
      if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 })
      }

      // Ensure the user owns the comment or is a developer
      const { data: comment } = await supabase.from("task_comments").select("author_email").eq("id", id).single()

      if (!comment) {
          return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (comment.author_email !== token?.email) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
  
      const { error } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", id)
  
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error in DELETE /api/developer/tasks/comments:", error)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
