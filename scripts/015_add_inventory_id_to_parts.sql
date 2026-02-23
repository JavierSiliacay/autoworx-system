-- Add inventory_id column to appointment_parts to link with warehouse stock
ALTER TABLE public.appointment_parts 
ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- Re-grant permissions (Supabase usually handles this but good practice)
GRANT ALL ON public.appointment_parts TO authenticated;
GRANT ALL ON public.appointment_parts TO service_role;
