-- Add orcr_image_2 column to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS orcr_image_2 TEXT;

-- Force schema cache refresh (this is a comment, Supabase might need a restart or just this query might trigger it)
NOTIFY pgrst, 'reload config';
