-- Add insurance column to appointments and appointment_history
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS insurance TEXT;
ALTER TABLE public.appointment_history ADD COLUMN IF NOT EXISTS insurance TEXT;

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL, -- original_id or id
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name TEXT,
  service TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public access for customers)
CREATE POLICY "Allow public insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read feedback (for display on services page)
CREATE POLICY "Allow public select feedback" ON public.feedback
  FOR SELECT USING (true);
