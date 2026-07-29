import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { batchDetails, items, deletedIds } = body

    if (!batchDetails || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Delete removed items
    if (deletedIds && deletedIds.length > 0) {
      await supabase.from("parts_transactions").delete().in("id", deletedIds)
    }

    // 2. Upsert items
    for (const item of items) {
      if (item.id) {
        await supabase.from("parts_transactions").update({
          item_name: item.name,
          quantity: parseInt(String(item.qty)) || 1,
          kind: item.kind || null,
          condition: item.cond || null,
          notes: item.notes || null,
          customer_name: batchDetails.customer_name || null,
          unit_model: batchDetails.unit_model || null,
          plate_number: batchDetails.plate_number?.toUpperCase() || null,
          purchaser: batchDetails.purchaser || null
        }).eq("id", item.id)
      } else {
        await supabase.from("parts_transactions").insert({
          transaction_type: "STOCK_IN", // Newly added items in batch edit assume STOCK_IN for now
          item_name: item.name,
          quantity: parseInt(String(item.qty)) || 1,
          kind: item.kind || null,
          condition: item.cond || null,
          notes: item.notes || null,
          customer_name: batchDetails.customer_name || null,
          unit_model: batchDetails.unit_model || null,
          plate_number: batchDetails.plate_number?.toUpperCase() || null,
          purchaser: batchDetails.purchaser || null,
          status: "STOCKED_IN"
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
