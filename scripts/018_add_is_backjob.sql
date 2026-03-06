-- Add is_backjob column to appointments and appointment_history tables
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_backjob BOOLEAN DEFAULT FALSE;
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS is_backjob BOOLEAN DEFAULT FALSE;
