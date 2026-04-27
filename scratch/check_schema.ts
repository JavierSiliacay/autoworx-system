import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from("parts_transactions")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching transactions:", error);
  } else {
    console.log("Transactions table schema sample:");
    console.log(data);
  }
}

run();
