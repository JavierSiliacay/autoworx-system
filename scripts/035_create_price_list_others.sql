-- Create Price List Others Table
CREATE TABLE IF NOT EXISTS public.price_list_others (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    supplier_name TEXT,
    category TEXT NOT NULL DEFAULT 'General Supplies',
    unit TEXT NOT NULL DEFAULT 'PC',
    supplier_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

-- Enable RLS
ALTER TABLE public.price_list_others ENABLE ROW LEVEL SECURITY;

-- Create policy for operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'price_list_others' AND policyname = 'Enable all operations for all users'
  ) THEN
    CREATE POLICY "Enable all operations for all users" ON public.price_list_others
      FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_list_others_category ON public.price_list_others (category);
CREATE INDEX IF NOT EXISTS idx_price_list_others_supplier ON public.price_list_others (supplier_name);
CREATE INDEX IF NOT EXISTS idx_price_list_others_item_name ON public.price_list_others (item_name);
