  import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ALK_WEBHOOK_URL = "http://localhost:3000/api/webhooks/autoworx"
const ALK_WEBHOOK_SECRET = "alk_auto_v1_9x8B2mP4kL7zQ1wE5rT"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function backfill() {
  console.log("Starting ALK Backfill...")

  // 1. Fetch active appointments
  const { data: activeAppointments, error: err1 } = await supabase
    .from("appointments")
    .select("*")
    .ilike("name", "%ALK%")
  
  if (err1) console.error("Error fetching active:", err1)

  // 2. Fetch history appointments
  const { data: historyAppointments, error: err2 } = await supabase
    .from("appointment_history")
    .select("*")
    .ilike("name", "%ALK%")

  if (err2) console.error("Error fetching history:", err2)

  const allRecords = [...(activeAppointments || []), ...(historyAppointments || [])]
  console.log(`Found ${allRecords.length} historical ALK records!`)

  for (const data of allRecords) {
    console.log(`Syncing ${data.estimate_number || data.tracking_code}...`)
    try {
      const response = await fetch(ALK_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ALK_WEBHOOK_SECRET}`
        },
        body: JSON.stringify({
          autoworxJobId: data.tracking_code,
          description: Array.isArray(data.service) ? data.service.join(", ") : (data.service || "Historical Repair"),
          cost: data.costing?.total || 0,
          status: data.status || "Completed",
          plateNo: data.vehicle_plate || "UNKNOWN"
        })
      })
      if (!response.ok) {
        console.error(`Failed to sync ${data.tracking_code}: ${response.statusText}`)
      }
    } catch (e) {
      console.error(`Failed to sync ${data.tracking_code}:`, e)
    }
  }

  console.log("Backfill complete!")
}

backfill()
