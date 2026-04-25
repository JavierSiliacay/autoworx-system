import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import sharp from 'sharp'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

const FIELDS = ['damage_images', 'orcr_image', 'orcr_image_2', 'loa_attachment', 'loa_attachment_2', 'loa_attachments']

async function globalRepair() {
    console.log('--- Starting Global Image & LOA Optimization (History + Active) ---')
    
    for (const table of ['appointments', 'appointment_history']) {
        console.log(`\nScanning table: ${table}...`)
        const { data, error } = await supabase
            .from(table)
            .select(`id, tracking_code, ${FIELDS.join(', ')}`)

        if (error) {
            console.error(`  Failed to fetch from ${table}:`, error.message)
            continue
        }

        const records = (data || []) as any[]
        console.log(`  Found ${records.length} records.`)

        for (const rec of records) {
            let updated = false
            const updates: any = {}

            for (const field of FIELDS) {
                const value = rec[field]
                if (!value) continue

                if (Array.isArray(value)) {
                    const newArray = []
                    let arrayChanged = false
                    for (const url of value) {
                        const res = await verifyAndFix(url)
                        newArray.push(res.url)
                        if (res.fixed) arrayChanged = true
                    }
                    if (arrayChanged) {
                        updates[field] = newArray
                        updated = true
                    }
                } else {
                    const res = await verifyAndFix(value)
                    if (res.fixed) {
                        updates[field] = res.url
                        updated = true
                    }
                }
            }

            if (updated) {
                console.log(`  Updating ${table} Record: ${rec.tracking_code || rec.id}`)
                const { error: upErr } = await supabase.from(table).update(updates).eq('id', rec.id)
                if (upErr) console.error(`    Failed to update: ${upErr.message}`)
            }
        }
    }

    console.log('\n--- Repair Complete ---')
}

async function verifyAndFix(url: string): Promise<{ fixed: boolean; url: string; error?: boolean }> {
    if (!url || typeof url !== 'string') return { fixed: false, url }
    try {
        const urlObj = new URL(url)
        const parts = urlObj.pathname.split('/public/damage-images/')
        if (parts.length < 2) return { fixed: false, url }

        const currentPath = parts[1]
        
        // Skip PDFs
        if (currentPath.toLowerCase().endsWith('.pdf')) {
            return { fixed: false, url }
        }

        const webpPath = currentPath.replace(/\.[^/.]+$/, "") + ".webp"

        // Check if WebP exists
        const folder = webpPath.includes('/') ? webpPath.substring(0, webpPath.lastIndexOf('/')) : ''
        const name = webpPath.includes('/') ? webpPath.substring(webpPath.lastIndexOf('/') + 1) : webpPath
        const { data: webpExists } = await supabase.storage.from('damage-images').list(folder, { search: name })

        if (webpExists && webpExists.some(f => f.name === name)) {
            const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(webpPath)
            return { fixed: url !== publicUrl, url: publicUrl }
        }

        // If it's already webp but doesn't exist? That's a broken link.
        if (currentPath.toLowerCase().endsWith('.webp')) {
            return { fixed: false, url, error: true }
        }

        // Convert if missing
        const { data: blob, error: dlError } = await supabase.storage.from('damage-images').download(currentPath)
        if (!dlError && blob) {
            console.log(`    Optimizing Image: ${currentPath}`)
            const buffer = Buffer.from(await blob.arrayBuffer())
            const webpBuffer = await sharp(buffer)
                .resize({ width: 1024, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer()

            await supabase.storage.from('damage-images').upload(webpPath, webpBuffer, { contentType: 'image/webp', upsert: true })
            const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(webpPath)
            return { fixed: true, url: publicUrl }
        }

        return { fixed: false, url, error: true }
    } catch (e) {
        return { fixed: false, url, error: true }
    }
}

globalRepair()
