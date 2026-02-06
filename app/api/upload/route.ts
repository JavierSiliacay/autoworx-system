import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const formData = await request.formData()
  const files = formData.getAll("files") as File[]
  const trackingCode = formData.get("trackingCode") as string

  if (!trackingCode) {
    return NextResponse.json({ error: "Missing trackingCode" }, { status: 400 })
  }

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  // Basic safety checks
  if (files.length > 10) {
    return NextResponse.json({ error: "Too many files (max 10)" }, { status: 400 })
  }

  // Ensure tracking code exists before allowing uploads
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id")
    .eq("tracking_code", trackingCode)
    .single()

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: "Invalid trackingCode" }, { status: 400 })
  }

  const uploadedUrls: string[] = []

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue

    const fileExt = file.name.split(".").pop()
    const fileName = `${trackingCode}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from("damage-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("Error uploading file:", error)
      continue
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from("damage-images")
      .getPublicUrl(data.path)

    uploadedUrls.push(publicUrl.publicUrl)
  }

  return NextResponse.json({ urls: uploadedUrls })
}
