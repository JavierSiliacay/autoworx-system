-- Create receivables table for Autoworx Accounting Works
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE DEFAULT CURRENT_DATE,
    client_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
    paid_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage receivables
CREATE POLICY "Enable all operations for authenticated users" ON public.receivables
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create indexes for fast queries and filtering
CREATE INDEX IF NOT EXISTS idx_receivables_date ON public.receivables (date);
CREATE INDEX IF NOT EXISTS idx_receivables_client_name ON public.receivables (client_name);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables (status);
