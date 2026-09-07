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
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS remarks TEXT;
    ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS remarks TEXT;

    COMMENT ON COLUMN public.appointments.remarks IS 'General remarks accessible to all staff, synced to Release Monitoring';
    COMMENT ON COLUMN public.appointment_history.remarks IS 'General remarks accessible to all staff, synced to Release Monitoring';

    UPDATE public.appointment_history 
    SET remarks = paul_notes 
    WHERE remarks IS NULL AND paul_notes IS NOT NULL;
  `;

  try {
    console.log("Executing SQL migration...");
    await client.query(sql);
    console.log("✅ SQL migration executed successfully!");

    // Verify columns
    const resApt = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'remarks';
    `);
    console.log("Appointments 'remarks' column:", resApt.rows);

    const resHist = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointment_history' AND column_name = 'remarks';
    `);
    console.log("Appointment_history 'remarks' column:", resHist.rows);

    const backfillCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM public.appointment_history 
      WHERE remarks IS NOT NULL;
    `);
    console.log("Historical records with remarks:", backfillCount.rows[0].count);

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

runMigration();
