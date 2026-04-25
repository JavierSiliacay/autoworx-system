import { createClient } from "@supabase/supabase-js";
import https from "https";

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

const BROKEN_URL = "https://ryfydffyvekipqyjngqe.supabase.co/storage/v1/object/public/damage-images/damage-images/loa-6991f73a-50ac-4cba-ac3b-9a0ca1212aea-1776063569049.jpg";
const CORRECT_URL = "https://ryfydffyvekipqyjngqe.supabase.co/storage/v1/object/public/damage-images/loa-6991f73a-50ac-4cba-ac3b-9a0ca1212aea-1776063569049.jpg";

async function checkUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode || 0);
    }).on("error", () => resolve(0));
  });
}

async function main() {
  console.log("=== URL Status Check ===");
  const brokenStatus = await checkUrl(BROKEN_URL);
  console.log(`Broken URL (double path) → HTTP ${brokenStatus}:`, BROKEN_URL);

  const correctStatus = await checkUrl(CORRECT_URL);
  console.log(`Correct URL (single path) → HTTP ${correctStatus}:`, CORRECT_URL);

  // List files in the bucket to find where the file actually is
  console.log("\n=== Listing bucket root ===");
  const { data: rootFiles, error: rootErr } = await supabase.storage
    .from("damage-images")
    .list("", { limit: 20 });
  if (rootErr) console.log("Root list error:", rootErr.message);
  else console.log("Root entries:", rootFiles?.map(f => `${f.name} (${f.metadata ? 'file' : 'folder'})`));

  console.log("\n=== Listing damage-images subfolder (if exists) ===");
  const { data: subFiles, error: subErr } = await supabase.storage
    .from("damage-images")
    .list("damage-images", { limit: 20 });
  if (subErr) console.log("Subfolder list error:", subErr.message);
  else console.log("damage-images/ subfolder entries:", subFiles?.map(f => f.name).slice(0, 10));

  // Search for the specific file
  console.log("\n=== Searching for the specific LOA file ===");
  const fileName = "loa-6991f73a-50ac-4cba-ac3b-9a0ca1212aea-1776063569049.jpg";
  const { data: found1 } = await supabase.storage.from("damage-images").list("", { search: fileName });
  console.log("Found at root?", found1?.some(f => f.name === fileName));
  const { data: found2 } = await supabase.storage.from("damage-images").list("damage-images", { search: fileName });
  console.log("Found in damage-images/ subfolder?", found2?.some(f => f.name === fileName));
}

main();
