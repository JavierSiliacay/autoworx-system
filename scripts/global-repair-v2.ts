import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import sharp from 'sharp'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function globalRepair() {
    console.log('--- Starting Global Image Health Check (v2) ---')
    
    // Get ALL appointments
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')

    if (error) {
        console.error('Failed to fetch appointments:', error.message)
        return
    }

    console.log(`Processing ${appointments.length} appointments...`)

    for (const apt of appointments) {
        let needsUpdate = false
        const updates: any = {}

        // Repair Damage Images
        if (apt.damage_images && apt.damage_images.length > 0) {
            const newImages = []
            for (const url of apt.damage_images) {
                const fixedUrl = await repairUrl(url)
                if (fixedUrl !== url) needsUpdate = true
                newImages.push(fixedUrl)
            }
            if (needsUpdate) updates.damage_images = newImages
        }

        // Repair ORCR 1
        if (apt.orcr_image) {
            const fixedUrl = await repairUrl(apt.orcr_image)
            if (fixedUrl !== apt.orcr_image) {
                updates.orcr_image = fixedUrl
                needsUpdate = true
            }
        }

        // Repair ORCR 2
        if (apt.orcr_image_2) {
            const fixedUrl = await repairUrl(apt.orcr_image_2)
            if (fixedUrl !== apt.orcr_image_2) {
                updates.orcr_image_2 = fixedUrl
                needsUpdate = true
            }
        }

        if (needsUpdate) {
            console.log(`Updating ${apt.tracking_code || apt.id}...`)
            await supabase.from('appointments').update(updates).eq('id', apt.id)
        }
    }

    console.log('--- Repair Operation Complete ---')
}

/**
 * Ensures the URL points to a valid, optimized WebP.
 * If the current URL is broken or not WebP, it finds/creates the correct one.
 */
async function repairUrl(url: string): Promise<string> {
    try {
        const urlObj = new URL(url)
        const parts = urlObj.pathname.split('/public/damage-images/')
        if (parts.length < 2) return url
        
        const oldPath = parts[1]
        const webpPath = oldPath.replace(/\.[^/.]+$/, "") + ".webp"

        // 1. Try to see if the WebP already exists (fastest check)
        const { data: webpInfo } = await supabase.storage.from('damage-images').list(
            webpPath.includes('/') ? webpPath.substring(0, webpPath.lastIndexOf('/')) : '',
            { search: webpPath.substring(webpPath.lastIndexOf('/') + 1) }
        )

        const webpExists = webpInfo && webpInfo.some(f => f.name === webpPath.split('/').pop())

        if (webpExists) {
            const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(webpPath)
            return publicUrl
        }

        // 2. If WebP is missing, try to convert the original (if the original exists)
        if (!oldPath.endsWith('.webp')) {
            const { data: blob, error: dlError } = await supabase.storage.from('damage-images').download(oldPath)
            if (!dlError && blob) {
                console.log(`  Converting legacy: ${oldPath}`)
                const buffer = Buffer.from(await blob.arrayBuffer())
                const webpBuffer = await sharp(buffer)
                    .resize({ width: 1024, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer()

                await supabase.storage.from('damage-images').upload(webpPath, webpBuffer, { contentType: 'image/webp', upsert: true })
                const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(webpPath)
                return publicUrl
            }
        }

        return url // Fallback to original if everything fails
    } catch (e) {
        return url
    }
}

globalRepair()
