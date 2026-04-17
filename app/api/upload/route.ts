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

  // Ensure tracking code exists - REMOVED because we upload before creating the appointment record
  /*
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id")
    .eq("tracking_code", trackingCode)
    .single()

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: "Invalid trackingCode" }, { status: 400 })
  }
  */

  const uploadedUrls: string[] = []
  const sharp = (await import('sharp')).default

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const webpBuffer = await sharp(buffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      const fileName = `${trackingCode}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`

      const { data, error } = await supabase.storage
        .from("damage-images")
        .upload(fileName, webpBuffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: 'image/webp'
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
    } catch (err) {
      console.error("Error processing image with sharp:", err)
      continue
    }
  }

  return NextResponse.json({ urls: uploadedUrls })
}
