import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function checkHistorySchema() {
    const { data, error } = await supabase.from('appointment_history').select('*').limit(1)
    if (error) {
        console.error(error.message)
    } else if (data && data.length > 0) {
        console.log('Columns in appointment_history:', Object.keys(data[0]))
    } else {
        console.log('appointment_history is empty.')
    }
}

checkHistorySchema()
