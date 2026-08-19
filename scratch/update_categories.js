const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const categoryUpdates = [
  // THINNERS & PRIMERS
  { item_name: 'Nax Multipurpose Thinner', category: 'THINNERS & PRIMERS' },
  { item_name: 'Nax Ceramic Thinner', category: 'THINNERS & PRIMERS' },
  { item_name: 'Nax HS Filter', category: 'THINNERS & PRIMERS' },
  { item_name: 'PP Primer', category: 'THINNERS & PRIMERS' },
  { item_name: 'T.O Bfilter', category: 'THINNERS & PRIMERS' }, // Updates both Gal and litro
  { item_name: 'Maxima Topcoat', category: 'THINNERS & PRIMERS' },

  // SUPPLIES & ABRASIVES
  { item_name: 'Masking Tape 3/4', category: 'SUPPLIES & ABRASIVES' },
  { item_name: 'Sandpaper (120 to 1,200)', category: 'SUPPLIES & ABRASIVES' },
  { item_name: 'Sandpaper (1,500 to 2,000)', category: 'SUPPLIES & ABRASIVES' },

  // NAX COLOR
  { item_name: 'Nax Orange', category: 'NAX COLOR' },
  { item_name: 'Nax Black', category: 'NAX COLOR' },
  { item_name: 'Nax White', category: 'NAX COLOR' },
  { item_name: 'Nax Silver', category: 'NAX COLOR' },
  { item_name: 'Nax Gray', category: 'NAX COLOR' },
  { item_name: 'Nax Pearl White', category: 'NAX COLOR' },
  { item_name: 'Nax Brown', category: 'NAX COLOR' },
  { item_name: 'Nax Red', category: 'NAX COLOR' },
  { item_name: 'Nax Gold', category: 'NAX COLOR' },
  { item_name: 'Nax Blue', category: 'NAX COLOR' },
  { item_name: 'Nax Yellow', category: 'NAX COLOR' },
  { item_name: 'Nax Pink', category: 'NAX COLOR' },

  // PREMILA COLOR
  { item_name: 'Premila Orange', category: 'PREMILA COLOR' },
  { item_name: 'Premila Black', category: 'PREMILA COLOR' },
  { item_name: 'Premila White', category: 'PREMILA COLOR' },
  { item_name: 'Premila Silver', category: 'PREMILA COLOR' },
  { item_name: 'Premila Gray', category: 'PREMILA COLOR' },
  { item_name: 'Premila Pearl White', category: 'PREMILA COLOR' },
  { item_name: 'Premila Brown', category: 'PREMILA COLOR' },
  { item_name: 'Premila Gold', category: 'PREMILA COLOR' },
  { item_name: 'Premila Blue', category: 'PREMILA COLOR' },
  { item_name: 'Premila Yellow', category: 'PREMILA COLOR' },
  { item_name: 'Premila Pink', category: 'PREMILA COLOR' },
  { item_name: 'Premila Red', category: 'PREMILA COLOR' },

  // TOPCOATS
  { item_name: 'Ceramic Topcoat', category: 'TOPCOATS' },
  { item_name: '9700 Topcoat', category: 'TOPCOATS' },

  // DETAILING MATS
  { item_name: 'NTY Supra Cut (Ref: 9200 - 1,500)', category: 'DETAILING MATS' },
  { item_name: 'MAT Supra Gloss (Ref: 8100 - 1,950)', category: 'DETAILING MATS' }
];

async function updateCategories() {
  console.log('Updating categories...');
  for (const update of categoryUpdates) {
    const { data, error } = await supabase
      .from('price_list_items')
      .update({ category: update.category })
      .eq('item_name', update.item_name);

    if (error) {
      console.error(`Error updating ${update.item_name}:`, error);
    } else {
      console.log(`Updated ${update.item_name} -> ${update.category}`);
    }
  }
  console.log('Finished updating categories.');
}

updateCategories();
