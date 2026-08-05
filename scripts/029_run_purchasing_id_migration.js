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
  console.log("Running migration to add purchasing_id to expenses table...");
  
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.expenses
      ADD COLUMN IF NOT EXISTS purchasing_id UUID REFERENCES public.purchasing(id) ON DELETE SET NULL;
    `
  });

  if (rpcError) {
    console.error("RPC exec_sql error:", rpcError);
    console.log("\n⚠️ Please run the following SQL manually in Supabase SQL Editor if RPC is disabled:");
    console.log("ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS purchasing_id UUID REFERENCES public.purchasing(id) ON DELETE SET NULL;");
  } else {
    console.log("✅ expenses table updated successfully with purchasing_id!");
  }
}

runMigration();
