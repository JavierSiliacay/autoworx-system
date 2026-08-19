const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const allowedCategories = ['THINNERS & PRIMERS', 'SUPPLIES & ABRASIVES', 'NAX COLOR', 'PREMILA COLOR', 'TOPCOATS', 'DETAILING MATS'];
  const { data, error } = await supabase.from('price_list_items').delete().not('category', 'in', '(' + allowedCategories.map(c => `"${c}"`).join(',') + ')');
  console.log(error ? error : 'Deleted old non-matching category items');
})();
