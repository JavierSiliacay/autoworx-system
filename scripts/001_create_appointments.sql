-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  service TEXT NOT NULL,
  preferred_date TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  repair_status TEXT,
  current_repair_part TEXT,
  status_updated_at TIMESTAMPTZ,
  costing JSONB,
  damage_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for booking form - no auth required)
CREATE POLICY "Allow public insert" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Allow anyone to select (for customer tracking)
CREATE POLICY "Allow public select" ON public.appointments
  FOR SELECT USING (true);

-- Allow anyone to update (for admin)
CREATE POLICY "Allow public update" ON public.appointments
  FOR UPDATE USING (true);

-- Allow anyone to delete (for admin)
CREATE POLICY "Allow public delete" ON public.appointments
  FOR DELETE USING (true);
