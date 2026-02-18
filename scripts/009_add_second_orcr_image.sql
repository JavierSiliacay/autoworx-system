-- Add orcr_image_2 column to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS orcr_image_2 TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.appointments.orcr_image_2 IS 'URL to the second uploaded ORCR image';
