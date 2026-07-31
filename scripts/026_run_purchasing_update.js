const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Running migration to add fields to purchasing table...");
  
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.purchasing
      ADD COLUMN IF NOT EXISTS unit_model TEXT,
      ADD COLUMN IF NOT EXISTS plate_number TEXT,
      ADD COLUMN IF NOT EXISTS vehicle_owner TEXT,
      ADD COLUMN IF NOT EXISTS customer_type TEXT,
      ADD COLUMN IF NOT EXISTS insurance_company_name TEXT,
      ADD COLUMN IF NOT EXISTS pr_number TEXT,
      ADD COLUMN IF NOT EXISTS is_po_synced BOOLEAN DEFAULT FALSE;
    `
  });

  if (rpcError) {
    console.error("RPC exec_sql error:", rpcError);
    console.log("\n⚠️ Please run scripts/026_add_fields_to_purchasing.sql manually in Supabase SQL Editor if RPC is disabled.");
  } else {
    console.log("✅ purchasing table updated successfully!");
  }
}

runMigration();
