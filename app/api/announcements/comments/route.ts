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
    const announcementId = searchParams.get("announcementId")

    if (!announcementId) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("announcement_comments")
      .select("*")
      .eq("announcement_id", announcementId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/announcements/comments:", error)
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
    
    const { announcementId, content } = body

    if (!announcementId || !content) {
      return NextResponse.json({ error: "Announcement ID and content are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("announcement_comments")
      .insert({
        announcement_id: announcementId,
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
    console.error("Error in POST /api/announcements/comments:", error)
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

      const { data: comment } = await supabase.from("announcement_comments").select("author_email").eq("id", id).single()

      if (!comment) {
          return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (comment.author_email !== token?.email) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
  
      const { error } = await supabase
        .from("announcement_comments")
        .delete()
        .eq("id", id)
  
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
  
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Error in DELETE /api/announcements/comments:", error)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
