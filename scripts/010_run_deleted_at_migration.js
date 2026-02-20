const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY env variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running deleted_at migration...');

    const sqlFilePath = path.join(__dirname, '010_add_deleted_at_to_appointments.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Migration failed via RPC:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log(sql);
            // Don't exit with error code to avoid breaking the flow, just warn user
        } else {
            console.log('✅ Migration completed successfully!');
        }
    } catch (err) {
        console.error('Error executing migration:', err);
        console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
        console.log(sql);
    }
}

runMigration();
