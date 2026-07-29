-- Create table for Accessories & Parts Department Job Logs
CREATE TABLE IF NOT EXISTS public.accessories_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL DEFAULT 'ACCESSORIES',
    unit TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    assured_client TEXT,
    date_started DATE NOT NULL,
    date_completed DATE NOT NULL,
    scope_of_works TEXT NOT NULL,
    dept_head TEXT DEFAULT 'Cabañelez',
    assignees JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { name: string, percentage: number }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Index for date queries and filtering
CREATE INDEX IF NOT EXISTS idx_accessories_job_logs_date_completed ON public.accessories_job_logs(date_completed);
CREATE INDEX IF NOT EXISTS idx_accessories_job_logs_plate_number ON public.accessories_job_logs(plate_number);
