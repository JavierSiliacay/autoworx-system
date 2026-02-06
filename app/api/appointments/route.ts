import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const trackingCode = searchParams.get("trackingCode")

  if (trackingCode) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("tracking_code", trackingCode)
      .single()

    if (error) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  }

  // Get all appointments (admin only)
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.trackingCode || !body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { error: "Missing required fields: trackingCode, name, email, phone" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tracking_code: body.trackingCode,
        name: body.name,
        email: body.email,
        phone: body.phone,
        vehicle_make: body.vehicleMake,
        vehicle_model: body.vehicleModel,
        vehicle_year: body.vehicleYear,
        vehicle_plate: body.vehiclePlate,
        service: body.service,
        preferred_date: body.preferredDate,
        message: body.message,
        damage_images: body.damageImages || [],
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating appointment:", error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/appointments:", error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const body = await request.json()
  const { id, ...updates } = body

  // Convert camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {}
  
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.repairStatus !== undefined) dbUpdates.repair_status = updates.repairStatus
  if (updates.currentRepairPart !== undefined) dbUpdates.current_repair_part = updates.currentRepairPart
  if (updates.statusUpdatedAt !== undefined) dbUpdates.status_updated_at = updates.statusUpdatedAt
  if (updates.costing !== undefined) dbUpdates.costing = updates.costing
  if (updates.damageImages !== undefined) dbUpdates.damage_images = updates.damageImages
  
  dbUpdates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("appointments")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  // Get the appointment to find image URLs for cleanup
  const { data: appointment } = await supabase
    .from("appointments")
    .select("damage_images")
    .eq("id", id)
    .single()

  // Delete images from storage if any
  if (appointment?.damage_images && appointment.damage_images.length > 0) {
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

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
