import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function listAll() {
    console.log('Listing top-level folders/files in "damage-images" bucket:')
    const { data: root, error: rootError } = await supabase.storage.from('damage-images').list('', { limit: 20 })
    if (rootError) console.error('Root error:', rootError.message)
    else console.log('Root:', root?.map(f => f.name))

    // Check if there is a 'damage-images' subfolder
    const { data: subfolder, error: subError } = await supabase.storage.from('damage-images').list('damage-images', { limit: 20 })
    if (subError) console.error('Subfolder error:', subError.message)
    else console.log('Inside "damage-images/" subfolder:', subfolder?.map(f => f.name))
}

listAll()
