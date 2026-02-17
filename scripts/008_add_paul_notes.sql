-- Add paul_notes column to appointments and appointment_history
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS paul_notes TEXT;
ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS paul_notes TEXT;

COMMENT ON COLUMN public.appointments.paul_notes IS 'Specific notes or instructions from the Service Manager (Sir Paul) for this unit';
