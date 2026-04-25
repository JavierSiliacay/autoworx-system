import { createClient } from "@/lib/supabase/server"
import { isDeveloperEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function POST(request: Request) {
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isDeveloperEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized. Developer access required." }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { version, title, summary } = body

    if (!version || !title) {
      return NextResponse.json({ error: "Version and Title are required" }, { status: 400 })
    }

    // 1. Fetch all completed but unpublished tasks
    const { data: doneTasks, error: fetchError } = await supabase
      .from("developer_tasks")
      .select("*")
      .eq("status", "Done")
      .is("update_id", null)

    if (fetchError) throw fetchError

    if (!doneTasks || doneTasks.length === 0) {
      return NextResponse.json({ error: "No completed tasks to publish." }, { status: 400 })
    }

    // 2. Create the system update record
    const { data: updateRecord, error: updateError } = await supabase
      .from("system_updates")
      .insert({
        version,
        title,
        summary,
        change_details: doneTasks,
        published_by: token?.email
      })
      .select()
      .single()

    if (updateError) throw updateError

    // 3. Link tasks to this update
    const { error: linkError } = await supabase
      .from("developer_tasks")
      .update({ 
        update_id: updateRecord.id,
        published_at: new Date().toISOString()
      })
      .in("id", doneTasks.map(t => t.id))

    if (linkError) throw linkError

    return NextResponse.json({ 
      success: true, 
      update: updateRecord,
      tasksPublished: doneTasks.length 
    })

  } catch (error: any) {
    console.error("Error in POST /api/developer/publish:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
