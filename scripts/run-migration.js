// Script to run the ORCR migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running ORCR migration...');

    try {
        // Add the orcr_image column
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE public.appointments
        ADD COLUMN IF NOT EXISTS orcr_image TEXT;
        
        COMMENT ON COLUMN public.appointments.orcr_image 
        IS 'URL to the uploaded ORCR (Official Receipt/Certificate of Registration) image';
      `
        });

        if (error) {
            console.error('Migration failed:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log('\nALTER TABLE public.appointments');
            console.log('ADD COLUMN IF NOT EXISTS orcr_image TEXT;');
            console.log('\nCOMMENT ON COLUMN public.appointments.orcr_image');
            console.log("IS 'URL to the uploaded ORCR (Official Receipt/Certificate of Registration) image';");
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('The orcr_image column has been added to the appointments table.');
    } catch (err) {
        console.error('Error:', err);
        console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
        console.log('\nALTER TABLE public.appointments');
        console.log('ADD COLUMN IF NOT EXISTS orcr_image TEXT;');
    }
}

runMigration();
