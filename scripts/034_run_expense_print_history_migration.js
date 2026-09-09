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
    CREATE TABLE IF NOT EXISTS public.expense_print_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        printed_by TEXT NOT NULL,
        report_period TEXT NOT NULL,
        period_value TEXT NOT NULL,
        period_label TEXT NOT NULL,
        view_mode TEXT NOT NULL DEFAULT 'detailed',
        category_filter TEXT NOT NULL DEFAULT 'all',
        payment_filter TEXT NOT NULL DEFAULT 'all',
        total_amount NUMERIC NOT NULL DEFAULT 0,
        records_count INTEGER NOT NULL DEFAULT 0,
        snapshot_data JSONB,
        reprint_count INTEGER NOT NULL DEFAULT 0,
        last_reprinted_at TIMESTAMP WITH TIME ZONE
    );

    ALTER TABLE public.expense_print_history ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expense_print_history' AND policyname = 'Enable all operations for authenticated users'
      ) THEN
        CREATE POLICY "Enable all operations for authenticated users" ON public.expense_print_history
          FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END
    $$;

    CREATE INDEX IF NOT EXISTS idx_expense_print_history_period ON public.expense_print_history (report_period, period_value);
    CREATE INDEX IF NOT EXISTS idx_expense_print_history_created_at ON public.expense_print_history (created_at DESC);
  `;

  try {
    console.log("Executing SQL migration for expense_print_history table...");
    await client.query(sql);
    console.log("✅ public.expense_print_history table created successfully!");

    // Verify table structure
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expense_print_history' 
      ORDER BY ordinal_position;
    `);
    console.log("Expense print history columns:", res.rows.map(r => `${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
