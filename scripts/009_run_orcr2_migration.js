// Script to add orcr_image_2 column
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
    console.log('Adding orcr_image_2 column...');

    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE public.appointments
                ADD COLUMN IF NOT EXISTS orcr_image_2 TEXT;
                
                COMMENT ON COLUMN public.appointments.orcr_image_2 
                IS 'URL to the second uploaded ORCR image';
            `
        });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log('\nALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS orcr_image_2 TEXT;');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
