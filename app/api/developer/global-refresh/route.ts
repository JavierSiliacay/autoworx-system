import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  // We no longer poll, but just in case it's called, return 0.
  return NextResponse.json({ timestamp: 0 })
}

export async function POST() {
  try {
    // We use the service role key or anon key to broadcast the message.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Broadcast the refresh signal directly to all listening AdminLayoutWrappers
    const channel = supabase.channel('system-refresh', {
      config: { broadcast: { ack: true } }
    })
    
    // Wait for the channel to subscribe before sending
    await new Promise((resolve, reject) => {
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          resolve(null)
        }
        if (status === 'CHANNEL_ERROR') {
          reject(err)
        }
      })
    })

    await channel.send({
      type: 'broadcast',
      event: 'force-refresh',
      payload: { timestamp: Date.now() }
    })
    
    // Cleanup channel
    supabase.removeChannel(channel)
    
    return NextResponse.json({ success: true, timestamp: Date.now() })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to broadcast update" }, { status: 500 })
  }
}
