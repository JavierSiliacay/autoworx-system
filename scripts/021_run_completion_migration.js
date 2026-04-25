const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running Completion Dates migration...');

    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
        -- Add completed_at to appointments table
        ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

        -- Add status_updated_at to appointment_history table
        ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NULL;
      `
        });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log('\nALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;');
            console.log('ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NULL;');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
