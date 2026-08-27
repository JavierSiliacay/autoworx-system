-- Create the collections table in Supabase
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    unit TEXT NOT NULL,
    plate TEXT NOT NULL,
    receipt_type TEXT NOT NULL CHECK (receipt_type IN ('JO', 'AR', 'OR')),
    receipt_number TEXT NOT NULL,
    description TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('CASH', 'CHECK', 'QR PAY', 'BANK TRANSFER', 'CANCELLED')),
    total_amount NUMERIC NOT NULL,
    cashier_name TEXT NOT NULL,
    remarks TEXT,
    created_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage collections
CREATE POLICY "Enable all operations for authenticated users" ON public.collections
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create indexes for fast date & search lookups
CREATE INDEX IF NOT EXISTS idx_collections_date ON public.collections (date);
CREATE INDEX IF NOT EXISTS idx_collections_customer_name ON public.collections (customer_name);
CREATE INDEX IF NOT EXISTS idx_collections_receipt_number ON public.collections (receipt_number);
