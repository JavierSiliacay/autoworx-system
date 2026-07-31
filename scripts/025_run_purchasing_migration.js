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
  console.log("Running migration for purchasing table...");
  
  console.log("Creating via exec_sql RPC...");
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.purchasing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          type TEXT NOT NULL,
          item_description TEXT NOT NULL,
          supplier_name TEXT,
          status TEXT NOT NULL DEFAULT 'Pending',
          date_purchased DATE NOT NULL,
          date_arrived DATE,
          remarks TEXT,
          created_by TEXT
      );
    `
  });

  if (rpcError) {
    console.error("RPC exec_sql error:", rpcError);
    console.log("\n⚠️ Please run scripts/025_create_purchasing.sql manually in Supabase SQL Editor if RPC is disabled.");
  } else {
    console.log("✅ purchasing table created successfully!");
  }
}

runMigration();
