import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

const DEAD_URL = "https://ryfydffyvekipqyjngqe.supabase.co/storage/v1/object/public/damage-images/damage-images/loa-6991f73a-50ac-4cba-ac3b-9a0ca1212aea-1776063569049.jpg";
const TRACKING = "MNO7VQC0-434Z5S";

async function main() {
  // Fetch the appointment
  const { data: apts, error } = await supabase
    .from("appointments")
    .select("id, tracking_code, loa_attachment, loa_attachment_2, loa_attachments, costing, repair_status")
    .eq("tracking_code", TRACKING);

  if (error || !apts?.length) {
    console.error("Not found:", error?.message);
    return;
  }

  const apt = apts[0];
  console.log("Found appointment:", apt.id);
  console.log("Current loa_attachments:", JSON.stringify(apt.loa_attachments));
  console.log("Current costing.loaAttachments:", JSON.stringify(apt.costing?.loaAttachments));

  // Strip the dead URL from all LOA fields
  const cleanLOAAttachments = (apt.loa_attachments || []).filter(
    (u: string) => u !== DEAD_URL
  );
  const cleanLOAAttachment = apt.loa_attachment === DEAD_URL ? null : apt.loa_attachment;
  const cleanLOAAttachment2 = apt.loa_attachment_2 === DEAD_URL ? null : apt.loa_attachment_2;

  const newCosting = apt.costing
    ? {
        ...apt.costing,
        loaAttachment: apt.costing.loaAttachment === DEAD_URL ? undefined : apt.costing.loaAttachment,
        loaAttachment2: apt.costing.loaAttachment2 === DEAD_URL ? undefined : apt.costing.loaAttachment2,
        loaAttachments: (apt.costing.loaAttachments || []).filter(
          (u: string) => u !== DEAD_URL
        ),
      }
    : apt.costing;

  console.log("\nWill set:");
  console.log("  loa_attachment:", cleanLOAAttachment);
  console.log("  loa_attachment_2:", cleanLOAAttachment2);
  console.log("  loa_attachments:", JSON.stringify(cleanLOAAttachments));
  console.log("  costing.loaAttachments:", JSON.stringify(newCosting?.loaAttachments));

  const { error: updateErr } = await supabase
    .from("appointments")
    .update({
      loa_attachment: cleanLOAAttachment,
      loa_attachment_2: cleanLOAAttachment2,
      loa_attachments: cleanLOAAttachments,
      costing: newCosting,
    })
    .eq("id", apt.id);

  if (updateErr) {
    console.error("Update failed:", updateErr.message);
  } else {
    console.log("\n✅ Dead URL cleared successfully. Please re-upload the LOA for this unit.");
  }
}

main();
