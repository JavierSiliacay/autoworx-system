import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from("parts_transactions")
    .update({ status: 'TEST_STATUS' })
    .eq('id', '3025ed6f-a732-458e-9e46-dbfe6b5e1d88')
    .select('*')
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Success updating to TEST_STATUS:");
    // revert
    await supabase.from("parts_transactions").update({ status: 'STOCKED_IN' }).eq('id', '3025ed6f-a732-458e-9e46-dbfe6b5e1d88')
  }
}

run();
