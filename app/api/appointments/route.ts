import { createClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { sendAppointmentEmail } from "@/lib/email"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const trackingCode = searchParams.get("trackingCode")

    if (trackingCode) {
      let { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("tracking_code", trackingCode)
        .single()

      if (error || !data) {
        // Try searching in history
        const { data: historyData, error: historyError } = await supabase
          .from("appointment_history")
          .select("*")
          .eq("tracking_code", trackingCode)
          .single()

        if (historyError) {
          return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Format history data to match appointment format
        // Note: final_status in history maps to status in active
        data = {
          ...historyData,
          status: historyData.final_status,
          created_at: historyData.original_created_at
        }
      }

      // Check authorization for costing data
      const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
      const isAdmin = isAuthorizedAdminEmail(token?.email)

      if (!isAdmin) {
        delete data.costing
      }

      return NextResponse.json(data)
    }

    const isCountRequest = searchParams.get("count") === "true"

    if (isCountRequest) {
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .or("repair_status.eq.pending_inspection,repair_status.is.null")

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ count: count || 0 })
    }

    // Get all appointments (admin only)
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })

    const showDeleted = searchParams.get("deleted") === "true"

    if (showDeleted) {
      query = query.not("deleted_at", "is", null).order("deleted_at", { ascending: false })
    } else {
      query = query.is("deleted_at", null)
    }

    const { data, error } = await query

    if (error) {
      // Check for missing column error (Postgres code 42703) to ensure existing data is still accessible
      if (error.code === '42703' || error.message?.includes('does not exist')) {
        console.warn("deleted_at column missing, falling back to standard query")
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("appointments")
          .select("*")
          .order("created_at", { ascending: false })

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }
        return NextResponse.json(fallbackData)
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in GET appointments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.trackingCode || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: trackingCode, name" },
        { status: 400 }
      )
    }

    const email = body.email?.trim() || "N/A"
    const phone = body.phone?.trim() || "N/A"

    // Generate estimate number (Monthly Sequence: YYYYMM-####)
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const prefix = `${yearMonth}-`

    const { data: latestEstimates } = await supabase
      .from("appointments")
      .select("estimate_number")
      .like("estimate_number", `${prefix}%`)
      .order("estimate_number", { ascending: false })
      .limit(1)

    const { data: latestHistoryEstimates } = await supabase
      .from("appointment_history")
      .select("estimate_number")
      .like("estimate_number", `${prefix}%`)
      .order("estimate_number", { ascending: false })
      .limit(1)

    let maxSequence = 0

    if (latestEstimates && latestEstimates.length > 0 && latestEstimates[0].estimate_number) {
      const lastNum = latestEstimates[0].estimate_number
      const parts = lastNum.split('-')
      if (parts.length === 2) {
        maxSequence = Math.max(maxSequence, parseInt(parts[1]))
      }
    }

    if (latestHistoryEstimates && latestHistoryEstimates.length > 0 && latestHistoryEstimates[0].estimate_number) {
      const lastNum = latestHistoryEstimates[0].estimate_number
      const parts = lastNum.split('-')
      if (parts.length === 2) {
        maxSequence = Math.max(maxSequence, parseInt(parts[1]))
      }
    }

    const nextSequence = maxSequence + 1

    const estimateNumber = `${prefix}${nextSequence.toString().padStart(4, '0')}`

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tracking_code: body.trackingCode,
        name: body.name,
        email: email,
        phone: phone,
        vehicle_make: body.vehicleMake,
        vehicle_model: body.vehicleModel,
        vehicle_year: body.vehicleYear,
        vehicle_plate: body.vehiclePlate,
        vehicle_color: body.vehicleColor || null,
        chassis_number: body.chassisNumber || null,
        engine_number: body.engineNumber || null,
        assignee_driver: body.assigneeDriver || null,
        service: body.service,
        message: body.message,
        damage_images: body.damageImages || [],
        orcr_image: body.orcrImage || null,
        orcr_image_2: body.orcrImage2 || null,
        insurance: body.insurance || null,
        service_advisor: body.serviceAdvisor || null,
        estimate_number: estimateNumber,
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

    // Send confirmation email directly from the server for better reliability
    // Only send if the email is not "N/A" and looks somewhat valid
    const isValidEmail = data.email && data.email.toUpperCase() !== "N/A" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)

    if (isValidEmail) {
      try {
        await sendAppointmentEmail({
          type: 'submission',
          name: data.name,
          email: data.email,
          trackingCode: data.tracking_code,
          vehicleDetails: `${data.vehicle_year} ${data.vehicle_make} ${data.vehicle_model}`,
          plateNumber: data.vehicle_plate,
          color: data.vehicle_color,
          insurance: data.insurance,
          services: data.service,
          message: data.message,
          status: 'Pending',
          chassisNumber: data.chassis_number,
          engineNumber: data.engine_number,
          assigneeDriver: data.assignee_driver,
          estimateNumber: data.estimate_number,
          serviceAdvisor: data.service_advisor
        });
        console.log(`Confirmation email sent to ${data.email}`);
      } catch (emailError) {
        // Log email error but don't fail the appointment creation
        console.error("Failed to send initial confirmation email:", emailError);
      }
    } else {
      console.log(`Skipping confirmation email: No valid email provided (${data.email})`);
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
  if (updates.estimateNumber !== undefined) dbUpdates.estimate_number = updates.estimateNumber
  if (updates.currentRepairPart !== undefined) dbUpdates.current_repair_part = updates.currentRepairPart
  if (updates.statusUpdatedAt !== undefined) dbUpdates.status_updated_at = updates.statusUpdatedAt
  if (updates.costing !== undefined) dbUpdates.costing = updates.costing
  if (updates.damageImages !== undefined) dbUpdates.damage_images = updates.damageImages
  if (updates.insurance !== undefined) dbUpdates.insurance = updates.insurance
  if (updates.paulNotes !== undefined) dbUpdates.paul_notes = updates.paulNotes
  if (updates.orcrImage !== undefined) dbUpdates.orcr_image = updates.orcrImage
  if (updates.orcrImage2 !== undefined) dbUpdates.orcr_image_2 = updates.orcrImage2
  if (updates.serviceAdvisor !== undefined) dbUpdates.service_advisor = updates.serviceAdvisor
  if (updates.loaAttachment !== undefined) dbUpdates.loa_attachment = updates.loaAttachment
  if (updates.loaAttachment2 !== undefined) dbUpdates.loa_attachment_2 = updates.loaAttachment2
  if (updates.loaAttachments !== undefined) dbUpdates.loa_attachments = updates.loaAttachments

  // New editable fields
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.vehicleMake !== undefined) dbUpdates.vehicle_make = updates.vehicleMake
  if (updates.vehicleModel !== undefined) dbUpdates.vehicle_model = updates.vehicleModel
  if (updates.vehicleYear !== undefined) dbUpdates.vehicle_year = updates.vehicleYear
  if (updates.vehiclePlate !== undefined) dbUpdates.vehicle_plate = updates.vehiclePlate
  if (updates.vehicleColor !== undefined) dbUpdates.vehicle_color = updates.vehicleColor
  if (updates.chassisNumber !== undefined) dbUpdates.chassis_number = updates.chassisNumber
  if (updates.engineNumber !== undefined) dbUpdates.engine_number = updates.engineNumber
  if (updates.assigneeDriver !== undefined) dbUpdates.assignee_driver = updates.assigneeDriver
  if (updates.service !== undefined) dbUpdates.service = updates.service
  if (updates.message !== undefined) dbUpdates.message = updates.message

  // Soft delete support
  if (updates.deletedAt !== undefined) dbUpdates.deleted_at = updates.deletedAt

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

  // Trigger Completion Email if status is updated to completed
  if (updates.status?.toLowerCase() === "completed") {
    const isValidEmail = data.email && data.email.toUpperCase() !== "N/A" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)

    if (isValidEmail) {
      console.log(`Triggering completion email for ${data.email}`);
      try {
        const emailResponse = await sendAppointmentEmail({
          type: 'completed',
          name: data.name,
          email: data.email,
          trackingCode: data.tracking_code,
          vehicleDetails: `${data.vehicle_year} ${data.vehicle_make} ${data.vehicle_model}`,
          plateNumber: data.vehicle_plate,
          services: data.service,
          status: 'Completed'
        });
        console.log('Completion email response:', emailResponse);
      } catch (emailError) {
        // Log email error but don't fail the update request
        console.error("Failed to send completion email:", emailError);
      }
    } else {
      console.log(`Skipping completion email: No valid email provided (${data.email})`);
    }
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

  const { searchParams } = new URL(request.url)
  const isPermanent = searchParams.get("permanent") === "true"

  if (isPermanent) {
    // Get the appointment to find image URLs for cleanup
    const { data: appointment } = await supabase
      .from("appointments")
      .select("damage_images, orcr_image, orcr_image_2, loa_attachment, loa_attachment_2, loa_attachments")
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

    // Delete ORCR image from storage if exists
    if (appointment?.orcr_image) {
      const orcrMatch = appointment.orcr_image.match(/damage-images\/(.+)$/)
      if (orcrMatch) {
        await supabase.storage.from("damage-images").remove([orcrMatch[1]])
      }
    }

    if (appointment?.orcr_image_2) {
      const orcrMatch2 = appointment.orcr_image_2.match(/damage-images\/(.+)$/)
      if (orcrMatch2) {
        await supabase.storage.from("damage-images").remove([orcrMatch2[1]])
      }
    }

    if (appointment?.loa_attachment) {
      const loaMatch = appointment.loa_attachment.match(/damage-images\/(.+)$/)
      if (loaMatch) {
        await supabase.storage.from("damage-images").remove([loaMatch[1]])
      }
    }

    if (appointment?.loa_attachment_2) {
      const loaMatch2 = appointment.loa_attachment_2.match(/damage-images\/(.+)$/)
      if (loaMatch2) {
        await supabase.storage.from("damage-images").remove([loaMatch2[1]])
      }
    }

    if (appointment?.loa_attachments && Array.isArray(appointment.loa_attachments)) {
      for (const url of appointment.loa_attachments) {
        const match = url.match(/damage-images\/(.+)$/)
        if (match) {
          await supabase.storage.from("damage-images").remove([match[1]])
        }
      }
    }

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Soft Delete
    const { error } = await supabase
      .from("appointments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
