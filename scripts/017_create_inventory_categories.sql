-- Create table for inventory categories
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage categories
CREATE POLICY "Allow authenticated users to manage categories" ON public.inventory_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default categories if they don't exist
INSERT INTO public.inventory_categories (name)
VALUES 
  ('Engine Oil'),
  ('Filters'),
  ('Brake Pads'),
  ('Coolant'),
  ('Electrical')
ON CONFLICT (name) DO NOTHING;
