-- Add orcr_image column to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS orcr_image TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.appointments.orcr_image IS 'URL to the uploaded ORCR (Official Receipt/Certificate of Registration) image';
