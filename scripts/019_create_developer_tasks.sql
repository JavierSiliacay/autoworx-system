-- Create Developer Tasks table
CREATE TABLE IF NOT EXISTS developer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('Bug Fix', 'New Feature', 'Improvement', 'Utility', 'Other')) DEFAULT 'Other',
    status TEXT CHECK (status IN ('Pending', 'Ongoing', 'Done')) DEFAULT 'Pending',
    created_by TEXT, -- Email of admin/authorized user
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ, -- When it moved to 'Ongoing'
    completed_at TIMESTAMPTZ, -- When it moved to 'Done'
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automation for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop if exists and recreate trigger
DROP TRIGGER IF EXISTS update_developer_tasks_updated_at ON developer_tasks;
CREATE TRIGGER update_developer_tasks_updated_at
    BEFORE UPDATE ON developer_tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable Real-time for this table
ALTER publication supabase_realtime ADD TABLE developer_tasks;
