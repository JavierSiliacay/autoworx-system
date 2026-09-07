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
    CREATE TABLE IF NOT EXISTS public.payables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        supplier_name TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        check_number TEXT,
        pdc_date DATE,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
        paid_at TIMESTAMP WITH TIME ZONE,
        remarks TEXT,
        created_by TEXT
    );

    ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payables' AND policyname = 'Enable all operations for authenticated users'
      ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON public.payables
          FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_payables_date ON public.payables (date);
    CREATE INDEX IF NOT EXISTS idx_payables_supplier ON public.payables (supplier_name);
    CREATE INDEX IF NOT EXISTS idx_payables_status ON public.payables (status);
    CREATE INDEX IF NOT EXISTS idx_payables_pdc_date ON public.payables (pdc_date);
  `;

  try {
    console.log("Executing SQL migration for payables table...");
    await client.query(sql);
    console.log("✅ public.payables table created successfully!");

    // Verify table structure
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payables' 
      ORDER BY ordinal_position;
    `);
    console.log("Payables columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
