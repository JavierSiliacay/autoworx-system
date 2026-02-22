-- Create developer_recommendations table
CREATE TABLE IF NOT EXISTS public.developer_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  type TEXT NOT NULL, -- 'Feature', 'Bug', 'Improvement', 'Feedback'
  message TEXT NOT NULL,
  is_solved BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.developer_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (for users on About page)
CREATE POLICY "Allow public insert recommendations" ON public.developer_recommendations
  FOR INSERT WITH CHECK (true);

-- Allow authenticated developers to select/update/delete
-- Note: Policy check will be handled at the API level for more granular control with emails
-- but we can add a basic authenticated check here.
CREATE POLICY "Allow authenticated read recommendations" ON public.developer_recommendations
  FOR ALL USING (auth.role() = 'authenticated');
