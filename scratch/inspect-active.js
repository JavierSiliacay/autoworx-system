const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

async function inspectActive() {
  const { data } = await supabase
    .from("appointments")
    .select("id, damage_images, loa_attachments")
    .not("damage_images", "is", null)
    .limit(5);

  data.forEach((a, i) => {
    console.log(`Active Appointment ${i}:`);
    console.log(`Damage Images: ${JSON.stringify(a.damage_images)}`);
    console.log(`LOA Attachments: ${JSON.stringify(a.loa_attachments)}`);
  });
}

inspectActive();
