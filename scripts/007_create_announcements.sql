-- Create system announcements table
CREATE TABLE IF NOT EXISTS public.admin_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_announcements_created_at ON public.admin_announcements(created_at DESC);

-- RLS Policies
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated admins to Read
CREATE POLICY "Allow authenticated admins to read announcements" 
ON public.admin_announcements FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated admins to Insert/Update (usually restricted by API but good to have)
CREATE POLICY "Allow authenticated admins to manage announcements" 
ON public.admin_announcements FOR ALL 
USING (auth.role() = 'authenticated');
