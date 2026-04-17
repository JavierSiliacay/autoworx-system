import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function debugDuplicates(trackingCode: string) {
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tracking_code', trackingCode)

    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log(`Found ${appointments.length} appointments for ${trackingCode}`)
    for (const apt of appointments) {
        console.log(`- ID: ${apt.id}, Created: ${apt.created_at}`)
        console.log(`  Damage Images:`, apt.damage_images)
        console.log(`  ORCR:`, apt.orcr_image)
    }
}

debugDuplicates('MNCTQREY-E87R5W')
