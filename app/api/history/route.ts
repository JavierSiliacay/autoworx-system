import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("appointment_history")
    .select("*")
    .order("archived_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const body = await request.json()

  // Archive an appointment - move to history and delete from active
  const { appointmentId, reason } = body

  // First, get the appointment data
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .single()

  if (fetchError || !appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
  }

  // Insert into history (without images to save storage)
  const { error: insertError } = await supabase
    .from("appointment_history")
    .insert({
      original_id: appointment.id,
      tracking_code: appointment.tracking_code,
      name: appointment.name,
      email: appointment.email,
      phone: appointment.phone,
      vehicle_make: appointment.vehicle_make,
      vehicle_model: appointment.vehicle_model,
      vehicle_year: appointment.vehicle_year,
      vehicle_plate: appointment.vehicle_plate,
      service: appointment.service,
      preferred_date: appointment.preferred_date,
      message: appointment.message,
      final_status: appointment.status,
      repair_status: appointment.repair_status,
      current_repair_part: appointment.current_repair_part,
      costing: appointment.costing,
      original_created_at: appointment.created_at,
      completed_at: appointment.status === "completed" ? new Date().toISOString() : null,
      archived_reason: reason || "Archived by admin",
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Delete images from storage if any
  if (appointment.damage_images && appointment.damage_images.length > 0) {
    const imagePaths = appointment.damage_images
      .map((url: string) => {
        const match = url.match(/damage-images\/(.+)$/)
        return match ? match[1] : null
      })
      .filter(Boolean)

    if (imagePaths.length > 0) {
      await supabase.storage.from("damage-images").remove(imagePaths)
    }
  }

  // Delete from active appointments
  const { error: deleteError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const body = await request.json()
  const { id } = body

  const { error } = await supabase
    .from("appointment_history")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
