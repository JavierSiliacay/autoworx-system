const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log("Connecting to PostgreSQL...");
  await client.connect();
  console.log("Connected successfully!");

  const sql = `
    CREATE TABLE IF NOT EXISTS public.price_list_others (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_name TEXT NOT NULL,
        supplier_name TEXT,
        category TEXT NOT NULL DEFAULT 'General Supplies',
        unit TEXT NOT NULL DEFAULT 'PC',
        supplier_price NUMERIC NOT NULL DEFAULT 0,
        selling_price NUMERIC,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by TEXT
    );

    ALTER TABLE public.price_list_others ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'price_list_others' AND policyname = 'Enable all operations for all users'
      ) THEN
        CREATE POLICY "Enable all operations for all users" ON public.price_list_others
          FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_price_list_others_category ON public.price_list_others (category);
    CREATE INDEX IF NOT EXISTS idx_price_list_others_supplier ON public.price_list_others (supplier_name);
    CREATE INDEX IF NOT EXISTS idx_price_list_others_item_name ON public.price_list_others (item_name);
  `;

  try {
    console.log("Executing SQL migration for price_list_others table...");
    await client.query(sql);
    console.log("Migration completed successfully! Table price_list_others is ready.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
