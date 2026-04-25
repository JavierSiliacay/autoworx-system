const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHistorySchema() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'appointment_history' });
  
  if (error) {
    // If RPC doesn't exist, try a different way
    const { data: cols, error: colErr } = await supabase.from('appointment_history').select('*').limit(0);
    if (colErr) {
        console.error('Error:', colErr.message);
    } else {
        console.log('Columns in appointment_history:', Object.keys(cols?.[0] || {}));
    }
    return;
  }
}

async function checkSingle() {
    const { data, error } = await supabase.from('appointment_history').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
    } else {
        console.log('No data found in history, trying to fetch columns from appointments');
        const { data: appt } = await supabase.from('appointments').select('*').limit(1);
        if (appt && appt.length > 0) {
            console.log('Appointments columns:', Object.keys(appt[0]));
        }
    }
}

checkSingle();
