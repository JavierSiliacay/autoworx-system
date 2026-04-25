import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkUrls() {
  console.log("Checking Active Appointments...");
  const { data: activeApts } = await supabase
    .from("appointments")
    .select("id, estimate_number, loa_attachments, loa_attachment, loa_attachment_2, damage_images");

  let activeIssues = 0;
  activeApts?.forEach(apt => {
    const allUrls = [
      ...(apt.loa_attachments || []),
      ...(apt.loa_attachment ? [apt.loa_attachment] : []),
      ...(apt.loa_attachment_2 ? [apt.loa_attachment_2] : []),
      ...(apt.damage_images || [])
    ];
    allUrls.forEach(url => {
      if (typeof url !== 'string' || !url) {
         console.log(`Issue in Active Apt ${apt.id} (${apt.estimate_number}): Found null/invalid URL`);
         activeIssues++;
      }
    });
  });

  console.log(`\nChecking History...`);
  const { data: historyApts } = await supabase
    .from("appointment_history")
    .select("id, estimate_number, costing");

  let historyIssues = 0;
  historyApts?.forEach(hist => {
    const costing = hist.costing || {};
    const allUrls = [
      ...(costing.loaAttachments || []),
      ...(costing.damage_images || []),
      ...(costing.damagePhotos || []),
      ...(costing.damageImages || [])
    ];
    allUrls.forEach(url => {
       if (typeof url !== 'string' || !url) {
         console.log(`Issue in History Apt ${hist.id} (${hist.estimate_number}): Found null/invalid URL`);
         historyIssues++;
       }
    });
  });

  console.log(`\nSummary:`);
  console.log(`Active Appointment Issues: ${activeIssues}`);
  console.log(`History Issues: ${historyIssues}`);
}

checkUrls();
