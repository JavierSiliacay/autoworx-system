const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUpdates() {
  const { data, error } = await supabase
    .from('system_updates')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total updates found:', data.length);
  if (data.length > 0) {
    console.log('Latest update:', {
      id: data[0].id,
      version: data[0].version,
      title: data[0].title
    });
  }
}

checkUpdates();
