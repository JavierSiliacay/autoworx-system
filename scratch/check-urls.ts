
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkUrls() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, damage_images, orcr_image, loa_attachment, loa_attachments')
    .limit(10)

  if (error) {
    console.error(error)
    return
  }

  data.forEach(apt => {
    console.log(`Appointment ${apt.id}:`)
    console.log(`  Damage Images:`, apt.damage_images)
    console.log(`  ORCR:`, apt.orcr_image)
    console.log(`  LOA:`, apt.loa_attachment)
    console.log(`  LOA Array:`, apt.loa_attachments)
  })
}

checkUrls()
