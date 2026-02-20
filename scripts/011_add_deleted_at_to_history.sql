-- Add deleted_at column to appointment_history table for soft delete support
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create an index for performance when filtering non-deleted items
CREATE INDEX IF NOT EXISTS idx_appointment_history_deleted_at ON appointment_history(deleted_at);
