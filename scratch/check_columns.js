const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableColumns() {
  // Query a single row from each table to see keys
  const { data: appointment, error: err1 } = await supabase.from('appointments').select('*').limit(1).single();
  const { data: history, error: err2 } = await supabase.from('appointment_history').select('*').limit(1).single();

  if (err1) console.error('Appointments Fetch Error:', err1.message);
  if (err2) console.error('History Fetch Error:', err2.message);

  if (appointment) {
    console.log('Appointments Columns:', Object.keys(appointment));
  }
  if (history) {
    console.log('History Columns:', Object.keys(history));
  }
}

checkTableColumns();
