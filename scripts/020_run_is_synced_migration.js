// Script to run the is_synced migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running is_synced migration...');

    try {
        const sql = `
        ALTER TABLE public.appointments
        ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.appointments.is_synced 
        IS 'Whether the appointment has been synced to the Sales Monitoring log';

        ALTER TABLE public.appointment_history
        ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT TRUE;

        COMMENT ON COLUMN public.appointment_history.is_synced 
        IS 'Whether the historical appointment is considered synced to the Sales Monitoring log';
        `;

        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log('\nALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE;');
            console.log('ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT TRUE;');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('The is_synced column has been added to appointments and appointment_history tables.');
    } catch (err) {
        console.error('Error:', err);
        console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
        console.log('\nALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE;');
    }
}

runMigration();
