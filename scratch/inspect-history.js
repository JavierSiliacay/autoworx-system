const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ryfydffyvekipqyjngqe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnlkZmZ5dmVraXBxeWpuZ3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE4MjQ2MCwiZXhwIjoyMDg1NzU4NDYwfQ.W3W6SfGVhwIDHGrin3cTl66byRnof170eimFKKQe-eg"
);

async function inspectHistory() {
  const { data } = await supabase
    .from("appointment_history")
    .select("costing")
    .limit(5);

  data.forEach((h, i) => {
    console.log(`History Record ${i}:`);
    console.log(JSON.stringify(h.costing, null, 2));
  });
}

inspectHistory();
