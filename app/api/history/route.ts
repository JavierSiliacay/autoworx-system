import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const showDeleted = searchParams.get("deleted") === "true"

  let query = supabase
    .from("appointment_history")
    .select("*")
    .order("archived_at", { ascending: false })

  if (showDeleted) {
    query = query.not("deleted_at", "is", null).order("deleted_at", { ascending: false })
  } else {
    query = query.is("deleted_at", null)
  }

  const { data, error } = await query

  if (error) {
    // Fallback for missing column
    if (error.code === '42703' || error.message?.includes('does not exist')) {
      console.warn("deleted_at column missing in history, falling back")
      const { data: fallback, error: fbError } = await supabase
        .from("appointment_history")
        .select("*")
        .order("archived_at", { ascending: false })
      if (fbError) return NextResponse.json({ error: fbError.message }, { status: 500 })
      return NextResponse.json(fallback)
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const adminSupabase = await createAdminClient().catch(() => supabase)
  const body = await request.json()
  const { id, deletedAt, updates } = body

  console.log(`[API History PUT] Received Request for ID: ${id}`, { hasUpdates: !!updates, hasDeletedAt: !!deletedAt });

  if (updates) {
    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {}
    if (updates.costing !== undefined) dbUpdates.costing = updates.costing
    if (updates.loaAttachments !== undefined) dbUpdates.loa_attachments = updates.loaAttachments
    if (updates.paulNotes !== undefined) dbUpdates.paul_notes = updates.paulNotes
    if (updates.paul_notes !== undefined) dbUpdates.paul_notes = updates.paul_notes
    if (updates.currentRepairPart !== undefined) dbUpdates.current_repair_part = updates.currentRepairPart
    if (updates.current_repair_part !== undefined) dbUpdates.current_repair_part = updates.current_repair_part
    if (updates.repairStatus !== undefined) dbUpdates.repair_status = updates.repairStatus
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.estimate_number !== undefined) dbUpdates.estimate_number = updates.estimate_number
    if (updates.vehicle_plate !== undefined) dbUpdates.vehicle_plate = updates.vehicle_plate
    if (updates.vehicle_color !== undefined) dbUpdates.vehicle_color = updates.vehicle_color
    if (updates.insurance !== undefined) dbUpdates.insurance = updates.insurance
    if (updates.is_backjob !== undefined) dbUpdates.is_backjob = updates.is_backjob
    if (updates.isBackJob !== undefined) dbUpdates.is_backjob = updates.isBackJob
    if (updates.is_synced !== undefined) dbUpdates.is_synced = updates.is_synced
    if (updates.isSynced !== undefined) dbUpdates.is_synced = updates.isSynced
    if (updates.completed_at !== undefined) dbUpdates.completed_at = updates.completed_at
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt

    console.log(`[API History PUT] Attempting direct ID update for: ${id}`);
    // Try by ID first using admin client to bypass RLS
    let { data: updatedData, error: updateError } = await adminSupabase
      .from("appointment_history")
      .update(dbUpdates)
      .eq("id", id)
      .select()

    console.log(`[API History PUT] Direct update result:`, { found: !!updatedData?.length, error: updateError });

    // Fallback: If not found by history PK, try by original_id
    if (!updateError && (!updatedData || updatedData.length === 0)) {
      console.log(`[API History PUT] Fallback to original_id for: ${id}`);
      const { data: fallbackData, error: fbError } = await adminSupabase
        .from("appointment_history")
        .update(dbUpdates)
        .eq("original_id", id)
        .select()

      console.log(`[API History PUT] Fallback result:`, { found: !!fallbackData?.length, error: fbError });
      updatedData = fallbackData
      updateError = fbError
    }

    if (updateError) {
      console.error(`[API History PUT] Database Error:`, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!updatedData || updatedData.length === 0) {
      return NextResponse.json({
        error: `Record not found in history for ID: ${id}. Please refresh and try again.`
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedData[0] })
  }

  const { data: softDeleted, error } = await adminSupabase
    .from("appointment_history")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!softDeleted || softDeleted.length === 0) {
    return NextResponse.json({
      error: `Could not archive record. ID ${id} not found.`
    }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: softDeleted[0] })
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const adminSupabase = await createAdminClient().catch(() => supabase)
  const body = await request.json()

  const { appointmentId, reason, manualData } = body

  // Manual Entry Support
  if (manualData) {
    console.log("[API History POST] Manual Data Received:", manualData);

    // Ensure all possible required fields have defaults
    const manualRecord = {
      name: manualData.name,
      email: manualData.email || "manual@entry.local",
      phone: manualData.phone || "N/A",
      vehicle_make: manualData.vehicle_make,
      vehicle_model: manualData.vehicle_model,
      vehicle_year: manualData.vehicle_year,
      vehicle_plate: manualData.vehicle_plate,
      vehicle_color: manualData.vehicle_color || "",
      insurance: manualData.insurance,
      paul_notes: manualData.paul_notes || manualData.remarks,
      costing: manualData.costing,
      service: manualData.service || "Manual Sales Entry",
      final_status: "completed",
      repair_status: "completed",
      original_id: manualData.original_id || null, // Database will generate UUID if null
      tracking_code: manualData.tracking_code || `MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      archived_reason: "Manual Entry",
      archived_at: new Date().toISOString(),
      completed_at: manualData.completed_at || new Date().toISOString(),
      original_created_at: manualData.completed_at || new Date().toISOString()
    }

    const { error: insertError } = await adminSupabase
      .from("appointment_history")
      .insert(manualRecord)

    if (insertError) {
      console.error("[API History POST] Manual Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

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
      vehicle_color: appointment.vehicle_color,
      chassis_number: appointment.chassis_number,
      engine_number: appointment.engine_number,
      assignee_driver: appointment.assignee_driver,
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
      insurance: appointment.insurance || null,
      estimate_number: appointment.estimate_number || null,
      paul_notes: appointment.paul_notes || null,
      loa_attachment: appointment.loa_attachment || null,
      loa_attachment_2: appointment.loa_attachment_2 || null,
      loa_attachments: appointment.loa_attachments || null,
      is_backjob: appointment.is_backjob || false,
      is_synced: appointment.is_synced || false,
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
  const adminSupabase = await createAdminClient().catch(() => supabase)
  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  // Soft delete by updating deleted_at
  // If 'permanent' param is set, do hard delete
  const { searchParams } = new URL(request.url)
  const isPermanent = searchParams.get("permanent") === "true"

  console.log(`[API History DELETE] ID: ${id}, Permanent: ${isPermanent}`);

  if (isPermanent) {
    // Try by ID first
    let { error } = await adminSupabase
      .from("appointment_history")
      .delete()
      .eq("id", id)

    // Fallback if no error but also might not have found it (delete doesn't return count easily without count: 'exact')
    // but we'll try original_id too to be safe
    if (!error) {
      const { error: fbError } = await adminSupabase
        .from("appointment_history")
        .delete()
        .eq("original_id", id)
      error = fbError
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const deletedAt = new Date().toISOString();

    // Try by ID first
    let { data, error } = await adminSupabase
      .from("appointment_history")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .select()

    if (!error && (!data || data.length === 0)) {
      console.log(`[API History DELETE] Fallback to original_id for soft delete: ${id}`);
      const { error: fbError } = await adminSupabase
        .from("appointment_history")
        .update({ deleted_at: deletedAt })
        .eq("original_id", id)
      error = fbError
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
  if (!isAuthorizedAdminEmail(token?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const adminSupabase = await createAdminClient().catch(() => supabase)
  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  // 1. Get the history record
  const { data: record, error: fetchError } = await adminSupabase
    .from("appointment_history")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !record) {
    return NextResponse.json({ error: "History record not found" }, { status: 404 })
  }

  // 2. Insert back into active appointments
  const { error: insertError } = await adminSupabase
    .from("appointments")
    .insert({
      id: record.original_id, // Restore the original ID if possible
      tracking_code: record.tracking_code,
      name: record.name,
      email: record.email,
      phone: record.phone,
      vehicle_make: record.vehicle_make,
      vehicle_model: record.vehicle_model,
      vehicle_year: record.vehicle_year,
      vehicle_plate: record.vehicle_plate,
      vehicle_color: record.vehicle_color,
      chassis_number: record.chassis_number,
      engine_number: record.engine_number,
      assignee_driver: record.assignee_driver,
      service: record.service,
      preferred_date: record.preferred_date,
      message: record.message,
      status: "contacted", // Default to contacted since it was archived
      repair_status: record.repair_status,
      current_repair_part: record.current_repair_part,
      costing: record.costing,
      created_at: record.original_created_at,
      insurance: record.insurance,
      estimate_number: record.estimate_number,
      paul_notes: record.paul_notes,
      loa_attachment: record.loa_attachment,
      loa_attachment_2: record.loa_attachment_2,
      loa_attachments: record.loa_attachments,
      is_backjob: record.is_backjob || false,
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // 3. Delete from history
  const { error: deleteError } = await adminSupabase
    .from("appointment_history")
    .delete()
    .eq("id", id)

  if (deleteError) {
    // Note: We already inserted it back, so we just log the delete error
    console.error("Cleanup error during unarchive:", deleteError)
  }

  return NextResponse.json({ success: true })
}
