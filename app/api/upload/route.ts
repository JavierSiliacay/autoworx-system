import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const formData = await request.formData()
  const files = formData.getAll("files") as File[]
  const trackingCode = formData.get("trackingCode") as string

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  const uploadedUrls: string[] = []

  for (const file of files) {
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
