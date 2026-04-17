import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import sharp from 'sharp'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function fixSpecificAppointment(id: string) {
    console.log(`Fixing appointment images for ${id}...`)
    const { data: apt, error } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (error || !apt) return

    const newDamageImages = []
    let updated = false

    for (const url of (apt.damage_images || [])) {
        if (url.endsWith('.webp')) {
            newDamageImages.push(url)
            continue
        }

        // Try to find the webp version or create it
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/public/damage-images/')
        if (pathParts.length < 2) {
            newDamageImages.push(url)
            continue
        }

        const oldPath = pathParts[1]
        const newPath = oldPath.replace(/\.[^/.]+$/, "") + ".webp"

        console.log(`Checking storage for ${newPath}...`)
        const { data: exists } = await supabase.storage.from('damage-images').list(newPath.substring(0, newPath.lastIndexOf('/')), {
            search: newPath.substring(newPath.lastIndexOf('/') + 1)
        })

        if (exists && exists.length > 0) {
            console.log(`WebP found! Updating URL.`)
            const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(newPath)
            newDamageImages.push(publicUrl)
            updated = true
        } else {
            console.log(`WebP missing. Attempting force conversion of ${oldPath}...`)
            const { data: blob, error: dlError } = await supabase.storage.from('damage-images').download(oldPath)
            if (dlError) {
                console.error(`  Failed to download ${oldPath}.`)
                newDamageImages.push(url) // Keep old
                continue
            }

            const webpBuffer = await sharp(Buffer.from(await blob.arrayBuffer()))
                .resize({ width: 1024, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer()

            await supabase.storage.from('damage-images').upload(newPath, webpBuffer, { contentType: 'image/webp', upsert: true })
            const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(newPath)
            newDamageImages.push(publicUrl)
            updated = true
        }
    }

    if (updated) {
        await supabase.from('appointments').update({ damage_images: newDamageImages }).eq('id', id)
        console.log('✅ REPAIRED: Damage images updated to WebP.')
    } else {
        console.log('No updates needed or possible.')
    }
}

fixSpecificAppointment('0bdc7cc3-0bbe-4453-ac4b-d1e738e5eab2')
