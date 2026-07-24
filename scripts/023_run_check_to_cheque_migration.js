const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runUpdate() {
  console.log("Updating existing expense records from 'Check' to 'Cheque'...");
  const { data, error } = await supabase
    .from('expenses')
    .update({ type_of_payment: 'Cheque' })
    .eq('type_of_payment', 'Check')
    .select();

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log(`✅ Successfully updated ${data.length} records to 'Cheque'!`);
  }
}

runUpdate();
