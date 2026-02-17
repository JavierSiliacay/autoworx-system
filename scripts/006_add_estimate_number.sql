-- Add estimate_number column to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimate_number TEXT;
ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS estimate_number TEXT;

COMMENT ON COLUMN public.appointments.estimate_number IS 'Sequential estimate number in YYYYMM-#### format';
COMMENT ON COLUMN public.appointment_history.estimate_number IS 'Sequential estimate number in YYYYMM-#### format';
