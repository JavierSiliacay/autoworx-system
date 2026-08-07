const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ryfydffyvekipqyjngqe.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg');

async function check() {
  const active = await supabase.from('appointments').select('tracking_code, vehicle_plate').ilike('name', '%ALK%');
  console.log('Active:', active.data);
  const history = await supabase.from('appointment_history').select('tracking_code, vehicle_plate').ilike('name', '%ALK%');
  console.log('History:', history.data);
}

check().catch(console.error);
