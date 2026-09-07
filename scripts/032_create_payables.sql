-- Create payables table for Autoworx Accounting Works
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    check_number TEXT,
    pdc_term TEXT,
    pdc_date DATE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
    paid_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payables' AND policyname = 'Enable all operations for authenticated users'
  ) THEN
    CREATE POLICY "Enable all operations for authenticated users" ON public.payables
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Create indexes for queries and alerts
CREATE INDEX IF NOT EXISTS idx_payables_date ON public.payables (date);
CREATE INDEX IF NOT EXISTS idx_payables_supplier ON public.payables (supplier_name);
CREATE INDEX IF NOT EXISTS idx_payables_status ON public.payables (status);
CREATE INDEX IF NOT EXISTS idx_payables_pdc_date ON public.payables (pdc_date);
