const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function fixRLS() {
  await client.connect();
  console.log("Connected to database!");

  const sql = `
    -- Drop old restrictive policy if exists
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.price_list_others;
    DROP POLICY IF EXISTS "Enable all operations for all users" ON public.price_list_others;

    -- Create permissive policy for public and authenticated
    CREATE POLICY "Enable all operations for all users" ON public.price_list_others
      FOR ALL TO public USING (true) WITH CHECK (true);
  `;

  await client.query(sql);
  console.log("RLS policy updated successfully!");
  await client.end();
}

fixRLS();
