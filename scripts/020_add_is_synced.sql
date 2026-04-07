
-- Add is_synced column to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.appointments.is_synced IS 'Whether the appointment has been synced to the Sales Monitoring log';

-- Add is_synced column to appointment_history table
ALTER TABLE public.appointment_history
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.appointment_history.is_synced IS 'Whether the historical appointment is considered synced to the Sales Monitoring log';
