-- Add deleted_at column to appointments table for soft delete support
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create an index for performance when filtering non-deleted items
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at);
