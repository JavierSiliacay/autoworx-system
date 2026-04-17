import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import sharp from 'sharp'

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupStorage() {
    console.log('--- Starting System-Wide Image Optimization ---')
    
    // 1. Fetch all appointments with images
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, damage_images, orcr_image, orcr_image_2')

    if (error) {
        console.error('Error fetching appointments:', error.message)
        return
    }

    console.log(`Found ${appointments.length} appointments to scan.`)

    for (const apt of appointments) {
        const updates: any = {}
        let needsUpdate = false

        // Check damage_images (Array)
        if (apt.damage_images && apt.damage_images.length > 0) {
            const newDamageImages = []
            for (const url of apt.damage_images) {
                const newUrl = await convertAndReplace(url)
                if (newUrl) {
                    newDamageImages.push(newUrl)
                    needsUpdate = true
                } else {
                    newDamageImages.push(url)
                }
            }
            if (needsUpdate) updates.damage_images = newDamageImages
        }

        // Check ORCR image 1
        if (apt.orcr_image) {
            const newUrl = await convertAndReplace(apt.orcr_image)
            if (newUrl) {
                updates.orcr_image = newUrl
                needsUpdate = true
            }
        }

        // Check ORCR image 2
        if (apt.orcr_image_2) {
            const newUrl = await convertAndReplace(apt.orcr_image_2)
            if (newUrl) {
                updates.orcr_image_2 = newUrl
                needsUpdate = true
            }
        }

        if (needsUpdate) {
            console.log(`Updating appointment ${apt.id}...`)
            const { error: updateError } = await supabase
                .from('appointments')
                .update(updates)
                .eq('id', apt.id)
            
            if (updateError) console.error(`Failed to update DB for ${apt.id}:`, updateError.message)
            else console.log(`✅ Success: ${apt.id} is now fully optimized.`)
        }
    }

    console.log('\n--- Optimization Complete ---')
}

async function convertAndReplace(publicUrl: string): Promise<string | null> {
    try {
        const urlObj = new URL(publicUrl)
        // Extract bucket and path. Standard Supabase URL: .../public/bucket-name/path/to/file
        const parts = urlObj.pathname.split('/public/damage-images/')
        if (parts.length < 2) return null
        
        const oldPath = parts[1]
        const newPath = oldPath.replace(/\.[^/.]+$/, "") + ".webp"

        console.log(`Optimizing: ${oldPath} -> ${newPath}`)

        // 1. Download
        const { data: blob, error: dlError } = await supabase.storage
            .from('damage-images')
            .download(oldPath)

        if (dlError || !blob) {
            console.error(`  Download failed: ${oldPath}`, dlError?.message)
            return null
        }

        const buffer = Buffer.from(await blob.arrayBuffer())

        // 2. Convert
        const webpBuffer = await sharp(buffer)
            .resize({ width: 1024, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer()

        // 3. Upload New
        const { error: ulError } = await supabase.storage
            .from('damage-images')
            .upload(newPath, webpBuffer, {
                contentType: 'image/webp',
                upsert: true
            })

        if (ulError) {
            console.error(`  Upload failed: ${newPath}`, ulError.message)
            return null
        }

        // 4. Delete Old (only if the filename changed, e.g. from .jpg to .webp)
        if (oldPath !== newPath) {
            const { error: delError } = await supabase.storage
                .from('damage-images')
                .remove([oldPath])
            
            if (delError) console.warn(`  Warning: Could not delete old file ${oldPath}`)
        }

        // Return new public URL
        const { data: { publicUrl: finalUrl } } = supabase.storage
            .from('damage-images')
            .getPublicUrl(newPath)
        
        return finalUrl

    } catch (e: any) {
        console.error(`  Error processing ${publicUrl}:`, e.message)
        return null
    }
}

cleanupStorage()
