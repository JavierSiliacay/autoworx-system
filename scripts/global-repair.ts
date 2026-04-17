import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import sharp from 'sharp'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

async function globalRepair() {
    console.log('--- Starting Global Image & LOA Optimization ---')
    
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, tracking_code, damage_images, orcr_image, orcr_image_2, loa_attachment, loa_attachment_2, loa_attachments')

    if (error) {
        console.error('Failed to fetch appointments:', error.message)
        return
    }

    console.log(`Found ${appointments.length} appointments to scan.`)

    let totalFixed = 0
    let brokenLinks = 0

    for (const apt of appointments) {
        let updated = false
        const updates: any = {}

        // 1. Damage Images
        if (apt.damage_images && apt.damage_images.length > 0) {
            const newImages = []
            for (const url of apt.damage_images) {
                const res = await verifyAndFix(url)
                newImages.push(res.url)
                if (res.fixed) updated = true, totalFixed++
                if (res.error) brokenLinks++
            }
            if (updated) updates.damage_images = newImages
        }

        // 2. ORCR Images
        for (const field of ['orcr_image', 'orcr_image_2'] as const) {
            if (apt[field]) {
                const res = await verifyAndFix(apt[field])
                if (res.fixed) {
                    updates[field] = res.url
                    updated = true
                    totalFixed++
                } else if (res.error) brokenLinks++
            }
        }

        // 3. LOA Attachments
        for (const field of ['loa_attachment', 'loa_attachment_2'] as const) {
            if (apt[field]) {
                const res = await verifyAndFix(apt[field])
                if (res.fixed) {
                    updates[field] = res.url
                    updated = true
                    totalFixed++
                } else if (res.error) brokenLinks++
            }
        }

        // 4. LOA Attachments (Array)
        if (apt.loa_attachments && apt.loa_attachments.length > 0) {
            const newLoas = []
            let loaUpdated = false
            for (const url of apt.loa_attachments) {
                const res = await verifyAndFix(url)
                newLoas.push(res.url)
                if (res.fixed) loaUpdated = true, totalFixed++
                if (res.error) brokenLinks++
            }
            if (loaUpdated) {
                updates.loa_attachments = newLoas
                updated = true
            }
        }

        if (updated) {
            console.log(`Updating Record: ${apt.tracking_code || apt.id}`)
            await supabase.from('appointments').update(updates).eq('id', apt.id)
        }
    }

    console.log('\n--- Final Health Report ---')
    console.log(`✅ Fixed & Re-linked: ${totalFixed} files (WebP optimized)`)
    console.log(`⚠️ Permanently Broken: ${brokenLinks} (Missing from storage)`)
    console.log('--- Repair Complete ---')
}

async function verifyAndFix(url: string): Promise<{ fixed: boolean; url: string; error?: boolean }> {
    if (!url) return { fixed: false, url }
    try {
        const urlObj = new URL(url)
        const parts = urlObj.pathname.split('/public/damage-images/')
        if (parts.length < 2) return { fixed: false, url }

        const currentPath = parts[1]
        const webpPath = currentPath.replace(/\.[^/.]+$/, "") + ".webp"

        // Check if WebP exists
        const folder = webpPath.includes('/') ? webpPath.substring(0, webpPath.lastIndexOf('/')) : ''
        const name = webpPath.includes('/') ? webpPath.substring(webpPath.lastIndexOf('/') + 1) : webpPath
        const { data: webpExists } = await supabase.storage.from('damage-images').list(folder, { search: name })

        if (webpExists && webpExists.some(f => f.name === name)) {
            const { data: { publicUrl } } = supabase.storage.from('damage-images').getPublicUrl(webpPath)
            return { fixed: url !== publicUrl, url: publicUrl }
        }

        // Convert original if possible
        const { data: blob, error: dlError } = await supabase.storage.from('damage-images').download(currentPath)
        if (!dlError && blob) {
            const buffer = Buffer.from(await blob.arrayBuffer())
            const webpBuffer = await sharp(buffer).resize({ width: 1024, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
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
