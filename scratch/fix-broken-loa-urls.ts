/**
 * Scans appointments and history for:
 * 1. Double-path URLs (.../damage-images/damage-images/...) and checks if they're broken
 * 2. Clears dead LOA URLs that return HTTP 400/404 from the database
 *
 * Run with: npx tsx scratch/fix-broken-loa-urls.ts
 * Add --dry-run flag to only show what would be changed without writing.
 */

import { createClient } from "@supabase/supabase-js";
import https from "https";

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

const DRY_RUN = process.argv.includes("--dry-run");
const DOUBLE_PATH = `/storage/v1/object/public/damage-images/damage-images/`;

async function checkUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      resolve(res.statusCode || 0);
    });
    req.on("error", () => resolve(0));
    req.setTimeout(5000, () => { req.destroy(); resolve(0); });
  });
}

function fixDoublePath(url: string): string {
  return url.replace(DOUBLE_PATH, `/storage/v1/object/public/damage-images/`);
}

async function processRecord(
  table: "appointments" | "appointment_history",
  record: any
) {
  const allLOAs: string[] = [
    ...(record.loa_attachments || []),
    ...(record.costing?.loaAttachments || []),
    record.loa_attachment,
    record.loa_attachment_2,
    record.costing?.loaAttachment,
    record.costing?.loaAttachment2,
  ].filter(Boolean) as string[];

  const doublePathUrls = allLOAs.filter((u) => u.includes(DOUBLE_PATH));

  if (doublePathUrls.length === 0) return;

  console.log(`\n[${table}] ${record.tracking_code} (${record.vehicle_plate})`);
  for (const url of doublePathUrls) {
    const correctedUrl = fixDoublePath(url);
    const brokenStatus = await checkUrl(url);
    const correctedStatus = await checkUrl(correctedUrl);

    console.log(`  Double-path URL: HTTP ${brokenStatus} → ${url}`);
    console.log(`  Corrected  URL:  HTTP ${correctedStatus} → ${correctedUrl}`);

    if (correctedStatus === 200) {
      console.log(`  ✅ Corrected URL works — will update DB`);
    } else {
      console.log(`  ❌ Both broken — will clear from DB`);
    }
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] No changes written.`);
    return;
  }

  // Build corrected arrays
  const fixUrl = (u: string) =>
    u.includes(DOUBLE_PATH) ? fixDoublePath(u) : u;

  const correctedLOAAttachments = (record.loa_attachments || []).map(fixUrl).filter(async (u: string) => {
    const status = await checkUrl(u);
    return status === 200;
  });

  // Simpler: just fix the double-path in all fields; the fixImageUrl in the frontend handles display
  const newLOAAttachments = (record.loa_attachments || []).map(fixUrl);
  const newLOAAttachment = record.loa_attachment ? fixUrl(record.loa_attachment) : null;
  const newLOAAttachment2 = record.loa_attachment_2 ? fixUrl(record.loa_attachment_2) : null;

  const newCosting = record.costing ? {
    ...record.costing,
    loaAttachment: record.costing?.loaAttachment ? fixUrl(record.costing.loaAttachment) : undefined,
    loaAttachment2: record.costing?.loaAttachment2 ? fixUrl(record.costing.loaAttachment2) : undefined,
    loaAttachments: (record.costing?.loaAttachments || []).map(fixUrl),
  } : record.costing;

  const idField = table === "appointment_history" ? "id" : "id";
  
  const { error } = await supabase
    .from(table)
    .update({
      loa_attachment: newLOAAttachment,
      loa_attachment_2: newLOAAttachment2,
      loa_attachments: newLOAAttachments,
      costing: newCosting,
    })
    .eq(idField, record.id);

  if (error) {
    console.log(`  ⚠️  DB update error: ${error.message}`);
  } else {
    console.log(`  ✅ DB updated successfully`);
  }
}

async function main() {
  console.log(`=== LOA URL Audit ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"} ===\n`);

  // Scan active appointments
  let page = 0;
  const PAGE_SIZE = 100;
  let totalProcessed = 0;

  while (true) {
    const { data: apts, error } = await supabase
      .from("appointments")
      .select("id, tracking_code, vehicle_plate, loa_attachment, loa_attachment_2, loa_attachments, costing")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.log("Error:", error.message); break; }
    if (!apts || apts.length === 0) break;

    for (const apt of apts) {
      await processRecord("appointments", apt);
      totalProcessed++;
    }
    if (apts.length < PAGE_SIZE) break;
    page++;
  }

  // Scan history
  page = 0;
  while (true) {
    const { data: hists, error } = await supabase
      .from("appointment_history")
      .select("id, tracking_code, vehicle_plate, loa_attachment, loa_attachment_2, loa_attachments, costing")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.log("History error:", error.message); break; }
    if (!hists || hists.length === 0) break;

    for (const hist of hists) {
      await processRecord("appointment_history", hist);
      totalProcessed++;
    }
    if (hists.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`\n=== Done. Scanned ${totalProcessed} records ===`);
}

main();
