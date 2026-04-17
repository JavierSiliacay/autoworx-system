import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAppointmentImages(trackingCode: string) {
    console.log(`Checking appointment: ${trackingCode}...`)
    
    // 1. Get Appointment Data
    const { data: appointment, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('tracking_code', trackingCode)
        .single()

    if (error || !appointment) {
        console.error('Error fetching appointment:', error?.message || 'Not found')
        return
    }

    console.log('--- Appointment Details ---')
    console.log(`ID: ${appointment.id}`)
    console.log(`Name: ${appointment.name}`)
    console.log(`Status: ${appointment.status}`)

    const imageUrls = [
        ...(appointment.damage_images || []),
        appointment.orcr_image,
        appointment.orcr_image_2
    ].filter(Boolean)

    if (imageUrls.length === 0) {
        console.log('No images found for this appointment.')
        return
    }

    console.log('\n--- Image Analysis ---')
    for (const url of imageUrls) {
        // Extract path from public URL
        // URL format usually: https://.../storage/v1/object/public/damage-images/path/to/file.webp
        try {
            const urlObj = new URL(url)
            const pathParts = urlObj.pathname.split('/damage-images/')
            if (pathParts.length < 2) continue
            
            const filePath = pathParts[1]
            
            // Correct way to get file info in Supabase: use list() with prefix and filter
            const folder = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : ''
            const name = filePath.includes('/') ? filePath.substring(filePath.lastIndexOf('/') + 1) : filePath

            const { data: files, error: listError } = await supabase.storage
                .from('damage-images')
                .list(folder, { search: name })

            const fileInfo = files?.find(f => f.name === name)

            if (listError || !fileInfo) {
                console.error(`Error getting info for ${filePath}:`, listError?.message || 'File not found')
                continue
            }

            const sizeKB = (fileInfo.metadata.size / 1024).toFixed(2)
            const type = fileInfo.metadata.mimetype
            
            console.log(`File: ${filePath}`)
            console.log(`  Size: ${sizeKB} KB`)
            console.log(`  Type: ${type}`)
            if (type === 'image/webp') {
                console.log('  ✅ SUCCESS: Format is WebP')
            } else {
                console.log(`  ⚠️ WARNING: Format is ${type}`)
            }
            console.log('---')
        } catch (e) {
            console.error(`Failed to process URL: ${url}`)
        }
    }
}

const trackingCode = 'MNQTQREY-E87R5W'
checkAppointmentImages(trackingCode)
