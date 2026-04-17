import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function spotCheckLOA() {
    console.log('--- Focused LOA Check ---')
    // Find appointments where LOA is NOT NULL
    const { data: apts, error } = await supabase
        .from('appointments')
        .select('tracking_code, loa_attachment, loa_attachment_2, loa_attachments')
        .or('loa_attachment.not.is.null,loa_attachment_2.not.is.null')
        .limit(10)

    if (error) {
        console.error(error.message)
        return
    }

    if (!apts || apts.length === 0) {
        console.log('No appointments found with LOA data in the specified columns.')
    } else {
        console.log(`Found ${apts.length} appointments with LOA data.`)
        apts.forEach(a => {
            console.log(`- ${a.tracking_code}:`)
            console.log(`  LOA 1: ${a.loa_attachment}`)
            console.log(`  LOA 2: ${a.loa_attachment_2}`)
            console.log(`  LOA Array:`, a.loa_attachments)
        })
    }
}

spotCheckLOA()
