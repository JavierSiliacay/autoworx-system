-- Add remarks column to appointments and appointment_history
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS remarks TEXT;

COMMENT ON COLUMN public.appointments.remarks IS 'General remarks accessible to all staff, synced to Release Monitoring';
COMMENT ON COLUMN public.appointment_history.remarks IS 'General remarks accessible to all staff, synced to Release Monitoring';

-- Backfill existing remarks in appointment_history from paul_notes so legacy records retain their release remarks
UPDATE public.appointment_history 
SET remarks = paul_notes 
WHERE remarks IS NULL AND paul_notes IS NOT NULL;
