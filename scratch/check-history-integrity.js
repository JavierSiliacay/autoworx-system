const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

async function checkHistoryIntegrity() {
  console.log("Fetching files from History...");
  
  const { data: historyApts } = await supabase
    .from("appointment_history")
    .select("id, estimate_number, costing");

  const files = [];
  const bucket = "damage-images";
  const baseUrl = `https://ryfydffyvekipqyjngqe.supabase.co/storage/v1/object/public/${bucket}`;

  historyApts?.forEach(hist => {
    const costing = hist.costing || {};
    
    // LOA URLs from costing
    const loaUrls = costing.loaAttachments || [];
    loaUrls.forEach((url) => {
       // Check if sync-list prepends base URL for history LOAs
       // (Narrator: it doesn't)
       files.push({ id: hist.id, url, type: "LOA" });
    });

    const photoUrls = costing.damage_images || costing.damagePhotos || costing.damageImages || [];
    photoUrls.forEach((url) => {
      const finalUrl = url.startsWith("http") ? url : `${baseUrl}/${url}`;
      files.push({ id: hist.id, url: finalUrl, type: "PHOTO" });
    });
  });

  console.log(`Found ${files.length} history files. Testing...`);

  let failures = 0;
  for (const file of files) {
    if (!file.url || !file.url.startsWith("http")) {
       console.log(`[FAIL] ${file.type} - URL IS NOT ABSOLUTE: ${file.url}`);
       failures++;
       continue;
    }
  }

  console.log(`\nHistory check finished. Non-absolute URLs found: ${failures}`);
}

checkHistoryIntegrity();
