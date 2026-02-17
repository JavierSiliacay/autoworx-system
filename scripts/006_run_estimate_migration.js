const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running estimate_number migration...');

    try {
        // Add the estimate_number column
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimate_number TEXT;
        ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS estimate_number TEXT;
        
        COMMENT ON COLUMN public.appointments.estimate_number IS 'Sequential estimate number in YYYYMM-#### format';
        COMMENT ON COLUMN public.appointment_history.estimate_number IS 'Sequential estimate number in YYYYMM-#### format';
      `
        });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log('\nALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimate_number TEXT;');
            console.log('ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS estimate_number TEXT;');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
