const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

async function checkSyncIntegrity() {
  console.log("Fetching files from sync-list API simulation...");
  
  const { data: activeApts } = await supabase
    .from("appointments")
    .select(`id, estimate_number, loa_attachments, loa_attachment, loa_attachment_2, damage_images`);

  const files = [];
  const bucket = "damage-images";
  const baseUrl = `https://ryfydffyvekipqyjngqe.supabase.co/storage/v1/object/public/${bucket}`;

  activeApts?.forEach(apt => {
    const loaUrls = Array.from(new Set([
      ...(apt.loa_attachments || []),
      ...(apt.loa_attachment ? [apt.loa_attachment] : []),
      ...(apt.loa_attachment_2 ? [apt.loa_attachment_2] : [])
    ])).filter(Boolean);

    loaUrls.forEach(url => files.push({ id: apt.id, url, type: "LOA" }));

    const photoUrls = (apt.damage_images || []).filter(Boolean);
    photoUrls.forEach(url => {
      const finalUrl = url.startsWith("http") ? url : `${baseUrl}/${url}`;
      files.push({ id: apt.id, url: finalUrl, type: "PHOTO" });
    });
  });

  console.log(`Found ${files.length} potential files. Testing first 20 for accessibility...`);

  let failures = 0;
  for (let i = 0; i < Math.min(files.length, 20); i++) {
    const file = files[i];
    try {
      const res = await fetch(file.url, { method: 'HEAD' });
      if (res.ok) {
        console.log(`[OK] ${file.type} - ${file.url.substring(0, 60)}... Status: ${res.status}`);
      } else {
        console.log(`[FAIL] ${file.type} - ${file.url.substring(0, 60)}... Status: ${res.status}`);
        failures++;
      }
    } catch (err) {
      console.log(`[ERR] ${file.type} - ${file.url.substring(0, 60)}... Error: ${err.message}`);
      failures++;
    }
  }

  console.log(`\nIntegrity check finished. Failures in sample: ${failures}`);
}

checkSyncIntegrity();
