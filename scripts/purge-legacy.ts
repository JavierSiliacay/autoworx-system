import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function purgeLegacyFiles() {
    console.log('--- Starting Final Storage Purge (Deleting JPG/PNG/GIF) ---')
    
    // 1. List all files in the bucket and subfolders
    // We'll handle 'damage-images/' subfolder and roots
    const folders = ['', 'damage-images/']
    let totalDeleted = 0
    let totalSizeSaved = 0

    for (const folder of folders) {
        let hasMore = true
        let offset = 0
        const limit = 100

        while (hasMore) {
            console.log(`Scanning storage in folder: "${folder}" (offset: ${offset})...`)
            const { data: files, error } = await supabase.storage.from('damage-images').list(folder, {
                limit,
                offset,
                sortBy: { column: 'name', order: 'asc' }
            })

            if (error || !files || files.length === 0) {
                hasMore = false
                continue
            }

            for (const file of files) {
                if (file.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    const filePath = folder ? `${folder}${file.name}` : file.name
                    console.log(`🗑️ Purging legacy file: ${filePath} (${(file.metadata.size / 1024).toFixed(2)} KB)`)
                    
                    const { error: delError } = await supabase.storage.from('damage-images').remove([filePath])
                    if (!delError) {
                        totalDeleted++
                        totalSizeSaved += file.metadata.size
                    } else {
                        console.error(`  Failed to delete ${filePath}:`, delError.message)
                    }
                }
            }

            if (files.length < limit) hasMore = false
            else offset += limit
        }
    }

    console.log('\n--- Purge Complete ---')
    console.log(`✅ Permanently Deleted: ${totalDeleted} legacy files`)
    console.log(`📉 Storage Reclaimed: ${(totalSizeSaved / (1024 * 1024)).toFixed(2)} MB`)
}

purgeLegacyFiles()
