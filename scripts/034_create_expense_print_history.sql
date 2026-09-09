-- Create expense_print_history table for Autoworx Expenses Monitoring
CREATE TABLE IF NOT EXISTS public.expense_print_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    printed_by TEXT NOT NULL,
    report_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly', 'all'
    period_value TEXT NOT NULL,  -- e.g. '2026-09-09', '2026-W37', '2026-09', '2026', 'all'
    period_label TEXT NOT NULL,  -- e.g. 'September 9, 2026', 'September 2026'
    view_mode TEXT NOT NULL DEFAULT 'detailed', -- 'detailed' | 'summary'
    category_filter TEXT NOT NULL DEFAULT 'all',
    payment_filter TEXT NOT NULL DEFAULT 'all',
    total_amount NUMERIC NOT NULL DEFAULT 0,
    records_count INTEGER NOT NULL DEFAULT 0,
    snapshot_data JSONB,         -- Stores the exact array of expenses rows at print time
    reprint_count INTEGER NOT NULL DEFAULT 0,
    last_reprinted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.expense_print_history ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage print history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'expense_print_history' AND policyname = 'Enable all operations for authenticated users'
  ) THEN
    CREATE POLICY "Enable all operations for authenticated users" ON public.expense_print_history
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_expense_print_history_period ON public.expense_print_history (report_period, period_value);
CREATE INDEX IF NOT EXISTS idx_expense_print_history_created_at ON public.expense_print_history (created_at DESC);
