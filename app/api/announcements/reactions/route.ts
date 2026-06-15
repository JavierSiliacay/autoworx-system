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
      .from("announcement_reactions")
      .select("*")
      .eq("announcement_id", announcementId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/announcements/reactions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    const userEmail = token?.email

    if (!isAuthorizedAdminEmail(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { announcementId, reactionType } = body

    if (!announcementId || !reactionType) {
      return NextResponse.json({ error: "Announcement ID and reaction type are required" }, { status: 400 })
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from("announcement_reactions")
      .select("*")
      .eq("announcement_id", announcementId)
      .eq("user_email", userEmail)
      .eq("reaction_type", reactionType)
      .single()

    if (existingReaction) {
      // Remove reaction if it already exists (toggle off)
      const { error } = await supabase
        .from("announcement_reactions")
        .delete()
        .eq("id", existingReaction.id)

      if (error) throw error
      return NextResponse.json({ action: "removed" })
    } else {
      // Add reaction
      const { error } = await supabase
        .from("announcement_reactions")
        .insert({
          announcement_id: announcementId,
          user_email: userEmail,
          reaction_type: reactionType
        })

      if (error) throw error
      return NextResponse.json({ action: "added" })
    }
  } catch (error) {
    console.error("Error in POST /api/announcements/reactions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
