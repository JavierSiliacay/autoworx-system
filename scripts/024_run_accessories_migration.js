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
  console.log("Running migration for accessories_job_logs table...");
  
  // Try table check by querying
  const { data, error } = await supabase.from('accessories_job_logs').select('id').limit(1);

  if (error && error.code === '42P01') {
    console.log("Table does not exist. Creating via exec_sql RPC or direct client...");
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.accessories_job_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            department TEXT NOT NULL DEFAULT 'ACCESSORIES',
            unit TEXT NOT NULL,
            plate_number TEXT NOT NULL,
            assured_client TEXT,
            date_started DATE NOT NULL,
            date_completed DATE NOT NULL,
            scope_of_works TEXT NOT NULL,
            dept_head TEXT DEFAULT 'Cabañelez',
            assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by TEXT
        );
      `
    });

    if (rpcError) {
      console.error("RPC exec_sql error:", rpcError);
      console.log("\n⚠️ Please run scripts/024_create_accessories_job_logs.sql manually in Supabase SQL Editor if RPC is disabled.");
    } else {
      console.log("✅ accessories_job_logs table created successfully!");
    }
  } else if (error) {
    console.log("Database status:", error.message);
  } else {
    console.log("✅ accessories_job_logs table is ready and verified!");
  }
}

runMigration();
