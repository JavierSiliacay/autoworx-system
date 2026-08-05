ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS purchasing_id UUID REFERENCES public.purchasing(id) ON DELETE SET NULL;
