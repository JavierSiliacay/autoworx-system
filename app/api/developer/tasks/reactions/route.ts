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
      .from("task_reactions")
      .select("*")
      .eq("task_id", taskId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/developer/tasks/reactions:", error)
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
    
    const { taskId, reactionType } = body

    if (!taskId || !reactionType) {
      return NextResponse.json({ error: "Task ID and reaction type are required" }, { status: 400 })
    }

    // Check if it already exists to toggle
    const { data: existing } = await supabase
      .from("task_reactions")
      .select("id")
      .eq("task_id", taskId)
      .eq("user_email", token?.email)
      .eq("reaction_type", reactionType)
      .single()

    if (existing) {
        // Toggle off
        const { error: deleteError } = await supabase
            .from("task_reactions")
            .delete()
            .eq("id", existing.id)

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }
        return NextResponse.json({ action: "removed", reactionType })
    }

    // Toggle on
    const { data, error } = await supabase
      .from("task_reactions")
      .insert({
        task_id: taskId,
        reaction_type: reactionType,
        user_email: token?.email
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ action: "added", reaction: data })
  } catch (error) {
    console.error("Error in POST /api/developer/tasks/reactions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
