const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPriceListOthers() {
  console.log("Testing price_list_others table...");

  // 1. Insert sample record
  const { data: inserted, error: insertError } = await supabase
    .from('price_list_others')
    .insert([{
      item_name: 'Hex Bolt M8x30 (Zinc Plated)',
      supplier_name: 'Fastener World Supply',
      category: 'Hardware & Fasteners',
      unit: 'PC',
      supplier_price: 15.50,
      selling_price: 25.00,
      updated_by: 'system_test'
    }])
    .select();

  if (insertError) {
    console.error("Insert error:", insertError);
    return;
  }
  console.log("Inserted item:", inserted);

  const testId = inserted[0].id;

  // 2. Query record
  const { data: fetched, error: fetchError } = await supabase
    .from('price_list_others')
    .select('*')
    .eq('id', testId);

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }
  console.log("Fetched item:", fetched);

  // 3. Update record
  const { data: updated, error: updateError } = await supabase
    .from('price_list_others')
    .update({ selling_price: 30.00, updated_by: 'system_test_update' })
    .eq('id', testId)
    .select();

  if (updateError) {
    console.error("Update error:", updateError);
    return;
  }
  console.log("Updated item:", updated);

  // 4. Clean up test record
  const { error: deleteError } = await supabase
    .from('price_list_others')
    .delete()
    .eq('id', testId);

  if (deleteError) {
    console.error("Delete error:", deleteError);
    return;
  }
  console.log("Cleaned up test item successfully!");
  console.log("ALL TESTS PASSED for price_list_others!");
}

testPriceListOthers();
