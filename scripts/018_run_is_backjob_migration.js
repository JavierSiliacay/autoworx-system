const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const envFile = fs.readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^"|"$/g, '')
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY env variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running is_backjob migration...');

    const sqlFilePath = path.join(__dirname, '018_add_is_backjob.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    try {
        console.log('Attempting to run SQL via RPC...');
        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Migration failed via RPC:', error);
            console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
            console.log(sql);
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
