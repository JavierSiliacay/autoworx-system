import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthorizedAdminEmail } from "@/lib/auth"
import { NextResponse, NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// ─── GET: Fetch all transactions + computed totals ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: transactions, error } = await supabase
      .from("parts_transactions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = transactions || []

    // Compute totals from all transactions
    // stockInSum now represents the CURRENT remaining stock from all IN entries
    const stockInRemaining = rows.filter(r => r.transaction_type === "STOCK_IN").reduce((s, r) => s + (r.quantity || 0), 0)
    // stockOutSum represents the total history of releases
    const stockOutSum = rows.filter(r => r.transaction_type === "STOCK_OUT").reduce((s, r) => s + (r.quantity || 0), 0)
    
    // Historical total = Current remaining + total released
    const stockInHistorical = stockInRemaining + stockOutSum
    const leftInStock = stockInRemaining

    return NextResponse.json({
      transactions: rows,
      totals: { 
        totalQty: stockInHistorical, 
        stockIn: stockInHistorical, 
        stockOut: stockOutSum, 
        leftInStock 
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── POST: Record a new STOCK_IN or STOCK_OUT ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      transaction_type, item_name, kind, condition,
      customer_name, unit_model, plate_number,
      quantity, notes, purchaser, stock_id
    } = body

    if (!transaction_type || !item_name || quantity === undefined) {
      return NextResponse.json({ error: "transaction_type, item_name, and quantity are required." }, { status: 400 })
    }

    const qtyNumber = parseInt(String(quantity))
    if (isNaN(qtyNumber)) {
      return NextResponse.json({ error: "Quantity must be a valid number." }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Insert transaction record
    const { data: tx, error: txError } = await supabase
      .from("parts_transactions")
      .insert({
        transaction_type,
        item_name,
        kind: kind || null,
        condition: condition || null,
        customer_name: customer_name || null,
        unit_model: unit_model || null,
        plate_number: plate_number || null,
        quantity: qtyNumber,
        unit_price: 0,
        total_amount: 0,
        notes: notes || null,
        purchaser: purchaser || null,
        stock_id: stock_id || null,
        performed_by: token?.email,
        status: transaction_type === "STOCK_OUT" ? "RELEASED" : "STOCKED_IN",
        parts_in_date: body.parts_in_date || null,
        parts_out_date: transaction_type === "STOCK_OUT" ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    // Update matching STOCK_IN: Decrement quantity instead of deleting
    if (transaction_type === "STOCK_OUT" && item_name && customer_name) {
      // Find the oldest matching STOCK_IN record that still has quantity
      let query = supabase
        .from("parts_transactions")
        .select("id, quantity")
        .eq("transaction_type", "STOCK_IN")
        .eq("item_name", item_name)
        .eq("customer_name", customer_name)
        .gt("quantity", 0)
        .order("created_at", { ascending: true })
        .limit(1)

      if (plate_number) {
        query = query.eq("plate_number", plate_number)
      } else {
        query = query.is("plate_number", null)
      }

      const { data: stockInRecord } = await query.single()

      if (stockInRecord) {
        const currentQty = stockInRecord.quantity || 0
        const decrement = Math.min(currentQty, qtyNumber)
        const newQty = Math.max(0, currentQty - decrement)
        
        await supabase
          .from("parts_transactions")
          .update({ 
            quantity: newQty,
            status: newQty === 0 ? "RELEASED" : "STOCKED_IN"
          })
          .eq("id", stockInRecord.id)
      }
    }

    // Update master inventory quantity if a stock_id was provided
    if (stock_id) {
      const { data: inv } = await supabase.from("inventory").select("quantity").eq("id", stock_id).single()
      if (inv) {
        const newQty = transaction_type === "STOCK_IN"
          ? (inv.quantity || 0) + parseInt(quantity)
          : Math.max(0, (inv.quantity || 0) - parseInt(quantity))

        await supabase.from("inventory").update({ quantity: newQty }).eq("id", stock_id)
      }
    }

    return NextResponse.json(tx)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── DELETE: Remove a transaction entry ──────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!isAuthorizedAdminEmail(token?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const revert = searchParams.get("revert") === "true"
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Fetch the transaction to be deleted so we can revert its effects
    const { data: txToDelete, error: fetchError } = await supabase
      .from("parts_transactions")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !txToDelete) {
      return NextResponse.json({ error: fetchError?.message || "Transaction not found" }, { status: 404 })
    }

    // 2. Delete the transaction
    const { error: deleteError } = await supabase.from("parts_transactions").delete().eq("id", id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    // 3. Revert STOCK_OUT effects on STOCK_IN record
    if (revert && txToDelete.transaction_type === "STOCK_OUT" && txToDelete.item_name && txToDelete.customer_name) {
      // Find the most recent STOCK_IN record for this owner/item to give the quantity back to
      let query = supabase
        .from("parts_transactions")
        .select("id, quantity")
        .eq("transaction_type", "STOCK_IN")
        .eq("item_name", txToDelete.item_name)
        .eq("customer_name", txToDelete.customer_name)
        .order("created_at", { ascending: false })
        .limit(1)

      if (txToDelete.plate_number) {
        query = query.eq("plate_number", txToDelete.plate_number)
      } else {
        query = query.is("plate_number", null)
      }

      const { data: stockInRecord } = await query.single()

      if (stockInRecord) {
        const newQty = (stockInRecord.quantity || 0) + (txToDelete.quantity || 0)
        await supabase
          .from("parts_transactions")
          .update({ 
            quantity: newQty,
            status: "STOCKED_IN" // Always reset status to STOCKED_IN since quantity > 0
          })
          .eq("id", stockInRecord.id)
      }
    }

    // 4. Revert inventory totals if a stock_id is linked
    if (revert && txToDelete.stock_id) {
      const { data: inv } = await supabase.from("inventory").select("quantity").eq("id", txToDelete.stock_id).single()
      if (inv) {
        // If deleting STOCK_IN, inventory goes down. If deleting STOCK_OUT, inventory goes up.
        const qtyChange = txToDelete.transaction_type === "STOCK_IN"
          ? -(txToDelete.quantity || 0)
          : (txToDelete.quantity || 0)

        const newInvQty = Math.max(0, (inv.quantity || 0) + qtyChange)
        await supabase.from("inventory").update({ quantity: newInvQty }).eq("id", txToDelete.stock_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ─── PATCH: Update a transaction entry ──────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const {
      id, kind, condition, customer_name, unit_model, plate_number,
      quantity, notes, purchaser, action, ids
    } = body

    const supabase = createAdminClient()

    // Bulk actions
    if (action === "soft_delete" && Array.isArray(ids)) {
      for (const txId of ids) {
        const { data } = await supabase.from("parts_transactions").select("status").eq("id", txId).single()
        if (data && !data.status.startsWith("DELETED_")) {
          await supabase.from("parts_transactions").update({ status: `DELETED_${data.status}` }).eq("id", txId)
        }
      }
      return NextResponse.json({ success: true })
    }

    if (action === "restore" && Array.isArray(ids)) {
      for (const txId of ids) {
        const { data } = await supabase.from("parts_transactions").select("status").eq("id", txId).single()
        if (data && data.status.startsWith("DELETED_")) {
          await supabase.from("parts_transactions").update({ status: data.status.replace("DELETED_", "") }).eq("id", txId)
        }
      }
      return NextResponse.json({ success: true })
    }

    if (!id) return NextResponse.json({ error: "Transaction ID is required." }, { status: 400 })

    // Execute the update query
    const { data, error } = await supabase
      .from("parts_transactions")
      .update({
        kind: kind || null,
        condition: condition || null,
        customer_name: customer_name || null,
        unit_model: unit_model || null,
        plate_number: plate_number?.toUpperCase() || null,
        quantity: parseInt(String(quantity)) || 0,
        notes: notes || null,
        purchaser: purchaser || null
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
