const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
  // THINNERS & PRIMERS
  { category: 'Solvents & Thinners', item_name: 'Nax Multipurpose Thinner', unit: 'Gal', supplier_price: 1100.00, selling_price: 1100.00 },
  { category: 'Solvents & Thinners', item_name: 'Nax Ceramic Thinner', unit: 'litro', supplier_price: 850.00, selling_price: 850.00 },
  { category: 'Solvents & Thinners', item_name: 'Nax HS Filter', unit: 'lit.', supplier_price: 900.00, selling_price: 900.00 },
  { category: 'Primers', item_name: 'PP Primer', unit: 'lit.', supplier_price: 900.00, selling_price: 900.00 },
  { category: 'Primers', item_name: 'T.O Bfilter', unit: 'Gal', supplier_price: 850.00, selling_price: 850.00 },
  { category: 'Primers', item_name: 'T.O Bfilter', unit: 'litro', supplier_price: 280.00, selling_price: 280.00 },
  { category: 'Topcoats', item_name: 'Maxima Topcoat', unit: 'lit.', supplier_price: 700.00, selling_price: 700.00 },

  // SUPPLIES & ABRASIVES
  { category: 'Consumables', item_name: 'Masking Tape 3/4', unit: 'each', supplier_price: 40.00, selling_price: 40.00 },
  { category: 'Abrasives', item_name: 'Sandpaper (120 to 1,200)', unit: 'each', supplier_price: 30.00, selling_price: 30.00 },
  { category: 'Abrasives', item_name: 'Sandpaper (1,500 to 2,000)', unit: 'each', supplier_price: 40.00, selling_price: 40.00 },

  // NAX COLOR
  { category: 'Nax Paints', item_name: 'Nax Orange', unit: 'lit.', supplier_price: 2400.00, selling_price: 2400.00 },
  { category: 'Nax Paints', item_name: 'Nax Black', unit: 'lit.', supplier_price: 1400.00, selling_price: 1400.00 },
  { category: 'Nax Paints', item_name: 'Nax White', unit: 'lit.', supplier_price: 1400.00, selling_price: 1400.00 },
  { category: 'Nax Paints', item_name: 'Nax Silver', unit: 'lit.', supplier_price: 1600.00, selling_price: 1600.00 },
  { category: 'Nax Paints', item_name: 'Nax Gray', unit: 'lit.', supplier_price: 1600.00, selling_price: 1600.00 },
  { category: 'Nax Paints', item_name: 'Nax Pearl White', unit: 'lit.', supplier_price: 2200.00, selling_price: 2200.00 },
  { category: 'Nax Paints', item_name: 'Nax Brown', unit: 'lit.', supplier_price: 1900.00, selling_price: 1900.00 },
  { category: 'Nax Paints', item_name: 'Nax Red', unit: 'lit.', supplier_price: 2000.00, selling_price: 2000.00 },
  { category: 'Nax Paints', item_name: 'Nax Gold', unit: 'lit.', supplier_price: 1900.00, selling_price: 1900.00 },
  { category: 'Nax Paints', item_name: 'Nax Blue', unit: 'lit.', supplier_price: 1800.00, selling_price: 1800.00 },
  { category: 'Nax Paints', item_name: 'Nax Yellow', unit: 'lit.', supplier_price: 1800.00, selling_price: 1800.00 },
  { category: 'Nax Paints', item_name: 'Nax Pink', unit: 'lit.', supplier_price: 1800.00, selling_price: 1800.00 },

  // PREMILA COLOR
  { category: 'Premila Paints', item_name: 'Premila Orange', unit: 'litro', supplier_price: 3600.00, selling_price: 3600.00 },
  { category: 'Premila Paints', item_name: 'Premila Black', unit: 'litro', supplier_price: 2400.00, selling_price: 2400.00 },
  { category: 'Premila Paints', item_name: 'Premila White', unit: 'litro', supplier_price: 2400.00, selling_price: 2400.00 },
  { category: 'Premila Paints', item_name: 'Premila Silver', unit: 'litro', supplier_price: 2700.00, selling_price: 2700.00 },
  { category: 'Premila Paints', item_name: 'Premila Gray', unit: 'litro', supplier_price: 2700.00, selling_price: 2700.00 },
  { category: 'Premila Paints', item_name: 'Premila Pearl White', unit: 'litro', supplier_price: 3400.00, selling_price: 3400.00 },
  { category: 'Premila Paints', item_name: 'Premila Brown', unit: 'litro', supplier_price: 3000.00, selling_price: 3000.00 },
  { category: 'Premila Paints', item_name: 'Premila Gold', unit: 'litro', supplier_price: 3000.00, selling_price: 3000.00 },
  { category: 'Premila Paints', item_name: 'Premila Blue', unit: 'litro', supplier_price: 2800.00, selling_price: 2800.00 },
  { category: 'Premila Paints', item_name: 'Premila Yellow', unit: 'litro', supplier_price: 2700.00, selling_price: 2700.00 },
  { category: 'Premila Paints', item_name: 'Premila Pink', unit: 'litro', supplier_price: 2700.00, selling_price: 2700.00 },
  { category: 'Premila Paints', item_name: 'Premila Red', unit: 'litro', supplier_price: 3000.00, selling_price: 3000.00 },

  // TOPCOATS & Specialty
  { category: 'Topcoats', item_name: 'Ceramic Topcoat', unit: '1QRT', supplier_price: 900.00, selling_price: 900.00 },
  { category: 'Topcoats', item_name: '9700 Topcoat', unit: '1QRT', supplier_price: 1800.00, selling_price: 1800.00 },

  // DETAILING MATS
  { category: 'Consumables', item_name: 'NTY Supra Cut (Ref: 9200 - 1,500)', unit: '1QRT', supplier_price: 1100.00, selling_price: 1100.00 },
  { category: 'Consumables', item_name: 'MAT Supra Gloss (Ref: 8100 - 1,950)', unit: '1QRT', supplier_price: 1100.00, selling_price: 1100.00 }
];

async function seed() {
  const timestamp = new Date().toISOString();
  const insertData = items.map(item => ({
    ...item,
    updated_at: timestamp,
    updated_by: 'system'
  }));

  console.log('Inserting items...');
  const { data, error } = await supabase
    .from('price_list_items')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error seeding items:', error);
  } else {
    console.log('Successfully seeded items:', data.length);
  }
}

seed();
