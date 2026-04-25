-- Add completed_at to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Add status_updated_at to appointment_history table
ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NULL;
