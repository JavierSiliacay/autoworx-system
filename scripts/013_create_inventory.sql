-- Create inventory table for general warehouse stock
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT, -- 'Engine', 'Suspension', 'Body', 'Electrical', 'Consumables', etc.
  brand TEXT,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  selling_price DECIMAL(10, 2) DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 2,
  location TEXT, -- Rack/Shelf location
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory_logs for tracking stock movements
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'IN' (Restock), 'OUT' (Used in repair), 'ADJUST' (Manual adjustment)
  quantity INTEGER NOT NULL,
  reason TEXT,
  performed_by TEXT, -- Email of the person
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins (and Parts Man) to manage inventory
CREATE POLICY "Allow authenticated admins to manage inventory" ON public.inventory
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated admins to manage inventory logs" ON public.inventory_logs
  FOR ALL USING (auth.role() = 'authenticated');
