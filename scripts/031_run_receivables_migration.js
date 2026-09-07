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
    CREATE TABLE IF NOT EXISTS public.receivables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        date DATE NOT NULL,
        client_name TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
        paid_at TIMESTAMP WITH TIME ZONE,
        remarks TEXT,
        created_by TEXT
    );

    ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'receivables' AND policyname = 'Enable all operations for authenticated users'
      ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON public.receivables
          FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_receivables_date ON public.receivables (date);
    CREATE INDEX IF NOT EXISTS idx_receivables_client_name ON public.receivables (client_name);
    CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables (status);
  `;

  try {
    console.log("Executing SQL migration for receivables table...");
    await client.query(sql);
    console.log("✅ public.receivables table created successfully!");

    // Verify table structure
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'receivables' 
      ORDER BY ordinal_position;
    `);
    console.log("Receivables columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
