-- Create table for parts assigned to specific units (appointments)
CREATE TABLE IF NOT EXISTS public.appointment_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  part_type TEXT, -- e.g., 'Body', 'Engine', 'Electrical'
  price DECIMAL(10, 2) DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending', 'available', 'needs_buy'
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appointment_parts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to manage unit parts
CREATE POLICY "Allow authenticated admins to manage unit parts" ON public.appointment_parts
  FOR ALL USING (auth.role() = 'authenticated');
